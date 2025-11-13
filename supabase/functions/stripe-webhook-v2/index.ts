import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🪝 Processing Stripe webhook v2...');
    
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    if (!signature || !webhookSecret) {
      console.error('❌ Missing webhook signature or secret');
      return new Response('Webhook signature verification failed', { status: 400 });
    }

    const stripe = new Stripe(
      Deno.env.get('STRIPE_SECRET_KEY') || '',
      { apiVersion: '2023-10-16' }
    );

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      console.log(`✅ Webhook verified: ${event.type}`);
    } catch (err: any) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Handle payment intent events
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentSucceeded(paymentIntent, supabase, stripe);
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentFailed(paymentIntent, supabase);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('❌ Webhook processing error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function handlePaymentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
  supabase: any,
  stripe: Stripe
) {
  console.log('✅ Payment succeeded:', paymentIntent.id);

  // Extract ALL data from metadata (source of truth)
  const metadata = paymentIntent.metadata;
  
  if (!metadata.cart_items) {
    console.error('❌ No cart items in payment intent metadata');
    return;
  }

  const cartItems = JSON.parse(metadata.cart_items);
  const shippingAddress = JSON.parse(metadata.shipping_address || '{}');
  const deliveryGroups = metadata.delivery_groups ? JSON.parse(metadata.delivery_groups) : null;
  const giftOptions = metadata.gift_options ? JSON.parse(metadata.gift_options) : null;
  const scheduledDate = metadata.scheduled_delivery_date || null;
  const isAutoGift = metadata.is_auto_gift === 'true';
  const autoGiftRuleId = metadata.auto_gift_rule_id || null;

  // Check if order already exists (idempotency)
  const { data: existingOrder } = await supabase
    .from('orders')
    .select('id')
    .eq('payment_intent_id', paymentIntent.id)
    .maybeSingle();

  if (existingOrder) {
    console.log('⚠️ Order already exists for payment intent:', paymentIntent.id);
    return;
  }

  // Determine order status
  let orderStatus = 'payment_confirmed';
  if (scheduledDate && new Date(scheduledDate) > new Date()) {
    orderStatus = 'scheduled';
  }

  // Create order record
  const orderData = {
    user_id: metadata.user_id === 'guest' ? null : metadata.user_id,
    payment_intent_id: paymentIntent.id,
    status: orderStatus,
    payment_status: 'paid',
    total_amount: paymentIntent.amount / 100, // Convert from cents
    currency: paymentIntent.currency,
    line_items: cartItems,
    shipping_address: shippingAddress,
    scheduled_delivery_date: scheduledDate,
    is_auto_gift: isAutoGift,
    auto_gift_rule_id: autoGiftRuleId,
    gift_options: giftOptions,
    created_at: new Date().toISOString(),
  };

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert(orderData)
    .select()
    .single();

  if (orderError) {
    console.error('❌ Failed to create order:', orderError);
    throw orderError;
  }

  console.log('✅ Order created:', order.id);

  // If NOT scheduled, process immediately
  if (orderStatus === 'payment_confirmed') {
    console.log('🚀 Triggering immediate order processing...');
    
    // Invoke process-order-v2 function
    const { error: processError } = await supabase.functions.invoke('process-order-v2', {
      body: { orderId: order.id }
    });

    if (processError) {
      console.error('❌ Failed to trigger order processing:', processError);
      // Don't throw - order is saved, can be retried
    }
  } else {
    console.log('📅 Order scheduled for:', scheduledDate);
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent, supabase: any) {
  console.error('❌ Payment failed:', paymentIntent.id);

  // Log failure for monitoring
  await supabase.from('payment_failures').insert({
    payment_intent_id: paymentIntent.id,
    user_id: paymentIntent.metadata.user_id === 'guest' ? null : paymentIntent.metadata.user_id,
    error_code: paymentIntent.last_payment_error?.code,
    error_message: paymentIntent.last_payment_error?.message,
    created_at: new Date().toISOString(),
  });

  // If auto-gift, send notification to user
  if (paymentIntent.metadata.is_auto_gift === 'true') {
    console.log('🎁 Auto-gift payment failed, notifying user...');
    // TODO: Send notification via email/in-app
  }
}
