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

    // Handle checkout session events (NEW - Phase 1)
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutSessionCompleted(session, supabase, stripe);
    } else if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutSessionExpired(session, supabase);
    }
    // Handle payment intent events (LEGACY - Phase 1 migration)
    else if (event.type === 'payment_intent.succeeded') {
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
  console.log('⚠️ LEGACY: Payment intent event received:', paymentIntent.id);
  console.log('🔄 Attempting to find associated checkout session...');

  // Try to find the checkout session for this payment intent
  const sessions = await stripe.checkout.sessions.list({
    payment_intent: paymentIntent.id,
    limit: 1
  });

  if (sessions.data.length > 0) {
    console.log('✅ Found checkout session, processing as session event...');
    await handleCheckoutSessionCompleted(sessions.data[0], supabase, stripe);
    return;
  }

  // If no session found, this is truly a legacy payment intent
  console.error('❌ No checkout session found for payment intent');
  console.log('⚠️ This payment intent was created outside checkout flow - skipping order creation');
  
  // Extract metadata for logging
  const metadata = paymentIntent.metadata;

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

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  supabase: any,
  stripe: Stripe
) {
  console.log('✅ Checkout session completed:', session.id);

  try {
    // Check if order already exists (idempotency)
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('checkout_session_id', session.id)
      .maybeSingle();

    if (existingOrder) {
      console.log('⚠️ Order already exists for session:', session.id);
      return { received: true };
    }

    // Extract ALL data from session metadata
    const metadata = session.metadata || {};
    
    // Get line items from session
    const lineItems = await getSessionLineItems(session, stripe);
    
    // Parse structured data from metadata (with safe fallbacks)
    const deliveryGroups = metadata.delivery_groups ? tryParseJSON(metadata.delivery_groups, null) : null;
    const giftOptions = {
      message: metadata.gift_message || '',
      isAnonymous: metadata.gift_is_anonymous === 'true'
    };
    
    // Reconstruct shipping address from individual metadata fields
    const shippingInfo = metadata.ship_name ? {
      name: metadata.ship_name || '',
      address_line1: metadata.ship_address_line1 || '',
      address_line2: metadata.ship_address_line2 || '',
      city: metadata.ship_city || '',
      state: metadata.ship_state || '',
      postal_code: metadata.ship_postal_code || '',
      country: metadata.ship_country || 'US',
      phone: metadata.ship_phone || ''
    } : null;
    const scheduledDate = metadata.scheduled_delivery_date || null;
    const isAutoGift = metadata.is_auto_gift === 'true';
    const autoGiftRuleId = metadata.auto_gift_rule_id || null;
    const isGroupGift = metadata.is_group_gift === 'true';
    const groupGiftProjectId = metadata.group_gift_project_id || null;

    // Handle group gift contributions
    if (isGroupGift && groupGiftProjectId) {
      console.log('🎁 Processing group gift contribution');
      
      const contributionAmount = parseFloat(metadata.contribution_amount || '0');
      
      // Create/update contribution record
      const { error: contributionError } = await supabase
        .from('group_gift_contributions')
        .upsert({
          group_gift_project_id: groupGiftProjectId,
          contributor_id: metadata.user_id,
          committed_amount: contributionAmount,
          stripe_payment_intent_id: session.payment_intent as string,
          stripe_checkout_session_id: session.id,
          contribution_status: 'paid',
          contributed_at: new Date().toISOString(),
        });
        
      if (contributionError) {
        console.error('❌ Failed to create contribution:', contributionError);
        throw contributionError;
      }
      
      // Update project current_amount atomically
      const { error: projectError } = await supabase.rpc(
        'increment_group_gift_amount',
        { 
          project_id: groupGiftProjectId,
          amount: contributionAmount 
        }
      );
      
      if (projectError) {
        console.error('❌ Failed to update project amount:', projectError);
        throw projectError;
      }
      
      console.log('✅ Group gift contribution recorded');
      return { received: true };
    }

    // Determine order status
    let orderStatus = 'payment_confirmed';
    let paymentStatus = 'paid';
    
    if (scheduledDate && new Date(scheduledDate) > new Date()) {
      orderStatus = 'scheduled';
      paymentStatus = 'authorized'; // Funds held, not yet captured
    }

    // Reconstruct pricing breakdown
    const pricingBreakdown = {
      subtotal: parseFloat(metadata.subtotal || '0'),
      shippingCost: parseFloat(metadata.shipping_cost || '0'),
      giftingFee: parseFloat(metadata.gifting_fee || '0'),
      taxAmount: parseFloat(metadata.tax_amount || '0')
    };

    const totalAmount = pricingBreakdown.subtotal + pricingBreakdown.shippingCost + pricingBreakdown.giftingFee + pricingBreakdown.taxAmount;

    // Create order record
    const orderData = {
      user_id: metadata.user_id === 'guest' ? null : metadata.user_id,
      checkout_session_id: session.id,
      payment_intent_id: session.payment_intent as string,
      status: orderStatus,
      payment_status: paymentStatus,
      total_amount: totalAmount,
      currency: session.currency || 'usd',
      line_items: lineItems,
      shipping_address: shippingInfo || session.customer_details,
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

    console.log('✅ Order created from checkout session:', order.id);

    // If NOT scheduled, process immediately
    if (orderStatus === 'payment_confirmed') {
      console.log('🚀 Triggering immediate order processing...');
      
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

    return { received: true, orderId: order.id };
  } catch (error) {
    console.error('❌ Error handling checkout session:', error);
    throw error;
  }
}

async function handleCheckoutSessionExpired(
  session: Stripe.Checkout.Session,
  supabase: any
) {
  console.log('⏱️ Checkout session expired:', session.id);

  // Log for abandoned cart tracking
  await supabase.from('checkout_session_events').insert({
    session_id: session.id,
    event_type: 'expired',
    user_id: session.metadata?.user_id || null,
    created_at: new Date().toISOString(),
  }).catch((err: any) => {
    console.error('Failed to log expired session:', err);
  });

  // Update cart session if exists
  if (session.metadata?.user_id) {
    await supabase
      .from('cart_sessions')
      .update({ 
        checkout_expired_at: new Date().toISOString(),
        status: 'expired'
      })
      .eq('user_id', session.metadata.user_id)
      .eq('checkout_initiated_at', session.created)
      .catch((err: any) => {
        console.error('Failed to update cart session:', err);
      });
  }

  return { received: true };
}

async function getSessionLineItems(session: Stripe.Checkout.Session, stripe: Stripe): Promise<any[]> {
  try {
    console.log('📦 Fetching line items from Stripe session:', session.id);
    
    // Fetch line items from Stripe (up to 100 items per session)
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
      limit: 100,
      expand: ['data.price.product']
    });

    console.log(`✅ Found ${lineItems.data.length} line items`);

    // Transform to our order format
    return lineItems.data.map((item: any) => {
      const product = item.price?.product;
      const metadata = product?.metadata || {};
      
      return {
        product_id: metadata.product_id || product?.id,
        name: item.description || product?.name,
        price: (item.amount_total || 0) / 100, // Convert cents to dollars
        quantity: item.quantity || 1,
        image_url: product?.images?.[0] || null,
        recipient_id: metadata.recipient_id || null,
        recipient_name: metadata.recipient_name || null
      };
    });
  } catch (error) {
    console.error('❌ Failed to fetch session line items:', error);
    return [];
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

// Helper function to safely parse JSON metadata (Phase 1 fix)
function tryParseJSON(jsonString: string, fallback: any) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('⚠️ Failed to parse metadata JSON, using fallback:', error);
    return fallback;
  }
}
