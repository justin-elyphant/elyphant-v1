import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AdminRequest {
  action: 'retry' | 'reconcile' | 'recover' | 'cancel';
  orderId?: string;
  paymentIntentId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, orderId, paymentIntentId }: AdminRequest = await req.json();

    console.log(`🔧 Admin action: ${action}`, { orderId, paymentIntentId });

    // Verify admin authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authorization');
    }

    // Check if user is admin (you'll need an is_admin field in profiles)
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      throw new Error('Admin access required');
    }

    let result: any;

    switch (action) {
      case 'retry':
        result = await retryOrder(orderId!, supabase);
        break;
      case 'reconcile':
        result = await reconcilePayments(supabase);
        break;
      case 'recover':
        result = await recoverOrder(paymentIntentId!, supabase);
        break;
      case 'cancel':
        result = await cancelOrder(orderId!, supabase);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Log admin action
    await supabase.from('admin_audit_log').insert({
      admin_id: user.id,
      action,
      target_order_id: orderId,
      target_payment_intent_id: paymentIntentId,
      result: JSON.stringify(result),
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        action,
        result,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('❌ Admin action error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function retryOrder(orderId: string, supabase: any) {
  console.log('🔄 Retrying order:', orderId);

  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (!order) {
    throw new Error('Order not found');
  }

  if (order.status === 'shipped' || order.status === 'delivered') {
    throw new Error('Order already completed');
  }

  // Reset order status
  await supabase
    .from('orders')
    .update({
      status: 'payment_confirmed',
      zinc_request_id: null,
      notes: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  // Trigger processing
  const { error: processError } = await supabase.functions.invoke('process-order-v2', {
    body: { orderId }
  });

  if (processError) {
    throw processError;
  }

  return { orderId, action: 'retry', status: 'reprocessing' };
}

async function reconcilePayments(supabase: any) {
  console.log('🔍 Reconciling payments...');

  // Find orders with payment_status = 'paid' but no order record
  const { data: paidOrders } = await supabase
    .from('orders')
    .select('payment_intent_id, status')
    .eq('payment_status', 'paid')
    .in('status', ['failed', 'payment_confirmed']);

  const reconciled = [];

  for (const order of paidOrders || []) {
    // Check if order should have been processed
    if (order.status === 'failed') {
      // Retry failed but paid orders
      await supabase
        .from('orders')
        .update({ status: 'payment_confirmed' })
        .eq('payment_intent_id', order.payment_intent_id);

      reconciled.push(order.payment_intent_id);
    }
  }

  return { 
    reconciled: reconciled.length,
    payment_intents: reconciled,
  };
}

async function recoverOrder(paymentIntentId: string, supabase: any) {
  console.log('🔍 Recovering order from payment intent:', paymentIntentId);

  // Check if order already exists
  const { data: existingOrder } = await supabase
    .from('orders')
    .select('id')
    .eq('payment_intent_id', paymentIntentId)
    .maybeSingle();

  if (existingOrder) {
    return { 
      message: 'Order already exists',
      orderId: existingOrder.id,
    };
  }

  // Fetch payment intent from Stripe
  const stripe = (await import('https://esm.sh/stripe@14.21.0')).default(
    Deno.env.get('STRIPE_SECRET_KEY') || '',
    { apiVersion: '2023-10-16' }
  );

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status !== 'succeeded') {
    throw new Error(`Payment intent not succeeded: ${paymentIntent.status}`);
  }

  // Recreate order from metadata
  const metadata = paymentIntent.metadata;
  const cartItems = JSON.parse(metadata.cart_items);
  const shippingAddress = JSON.parse(metadata.shipping_address);

  const { data: order, error: createError } = await supabase
    .from('orders')
    .insert({
      user_id: metadata.user_id === 'guest' ? null : metadata.user_id,
      payment_intent_id: paymentIntentId,
      status: 'payment_confirmed',
      payment_status: 'paid',
      total_amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      line_items: cartItems,
      shipping_address: shippingAddress,
      notes: 'Recovered by admin',
      created_at: new Date(paymentIntent.created * 1000).toISOString(),
    })
    .select()
    .single();

  if (createError) {
    throw createError;
  }

  // Trigger processing
  await supabase.functions.invoke('process-order-v2', {
    body: { orderId: order.id }
  });

  return {
    message: 'Order recovered and processing',
    orderId: order.id,
  };
}

async function cancelOrder(orderId: string, supabase: any) {
  console.log('❌ Cancelling order:', orderId);

  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (!order) {
    throw new Error('Order not found');
  }

  if (order.status === 'delivered') {
    throw new Error('Cannot cancel delivered order');
  }

  // Update order status
  await supabase
    .from('orders')
    .update({
      status: 'cancelled',
      notes: 'Cancelled by admin',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  // If scheduled and payment was held, release it
  if (order.status === 'scheduled' && order.payment_status === 'authorized') {
    const stripe = (await import('https://esm.sh/stripe@14.21.0')).default(
      Deno.env.get('STRIPE_SECRET_KEY') || '',
      { apiVersion: '2023-10-16' }
    );

    await stripe.paymentIntents.cancel(order.payment_intent_id);
  }

  return { orderId, status: 'cancelled' };
}
