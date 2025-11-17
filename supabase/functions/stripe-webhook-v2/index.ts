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
    console.log('🪝 Stripe Webhook v2 - Processing event...');
    
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
      console.log(`✅ Webhook verified: ${event.type} | ID: ${event.id}`);
    } catch (err: any) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // CORE: Handle checkout.session.completed (primary order creation path)
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutSessionCompleted(session, supabase, stripe);
    } 
    // CORE: Handle checkout.session.expired
    else if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutSessionExpired(session, supabase);
    }
    // LEGACY: payment_intent events (no order creation, enrichment only)
    else if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`⚠️ LEGACY: payment_intent.succeeded ${paymentIntent.id} - enrichment only, no order creation`);
      await enrichExistingOrder(paymentIntent, supabase);
    } 
    else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`⚠️ LEGACY: payment_intent.payment_failed ${paymentIntent.id} - updating existing order`);
      await handlePaymentFailed(paymentIntent, supabase);
    }

    return new Response(
      JSON.stringify({ received: true, event_type: event.type, event_id: event.id }),
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

// ============================================================================
// CORE HANDLER: checkout.session.completed
// ============================================================================
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  supabase: any,
  stripe: Stripe
) {
  const sessionId = session.id;
  console.log(`📋 Processing checkout.session.completed: ${sessionId}`);

  // STEP 1: Check for existing order (idempotency)
  const { data: existingOrder } = await supabase
    .from('orders')
    .select('id, status, receipt_sent_at, user_id')
    .eq('checkout_session_id', sessionId)
    .single();

  if (existingOrder) {
    console.log(`✅ Order already exists: ${existingOrder.id} | Status: ${existingOrder.status}`);
    console.log(`🔍 Idempotency check - skipping insert, checking follow-up steps...`);
    
    // Check if receipt needs to be sent
    if (!existingOrder.receipt_sent_at) {
      console.log(`📧 Receipt not sent yet, triggering email orchestrator...`);
      const lineItemsForRetry = await stripe.checkout.sessions.listLineItems(sessionId, { limit: 100 });
      const lineItemsData = lineItemsForRetry.data.map((item: any) => ({
        product_id: item.price?.product || item.description || 'unknown',
        title: item.description || 'Product',
        quantity: item.quantity || 1,
        unit_price: item.price?.unit_amount ? item.price.unit_amount / 100 : 0,
        currency: item.price?.currency || 'usd',
      }));
      await triggerEmailOrchestrator(existingOrder.id, session, lineItemsData, supabase);
    }
    
    // Check if processing needed (non-scheduled, not yet submitted)
    const { data: fullOrder } = await supabase
      .from('orders')
      .select('id, status, is_scheduled, zinc_order_id')
      .eq('id', existingOrder.id)
      .single();
      
    if (fullOrder && !fullOrder.is_scheduled && !fullOrder.zinc_order_id && fullOrder.status !== 'processing') {
      console.log(`🔄 Order not yet processing, triggering process-order-v2...`);
      await triggerOrderProcessing(fullOrder.id, supabase, existingOrder.user_id);
    }
    
    return;
  }

  // STEP 2: Extract shipping from metadata (collected at /checkout)
  const metadata = session.metadata || {};
  
  const shippingAddress = {
    name: metadata.ship_name || '',
    address_line1: metadata.ship_address_line1 || '',
    address_line2: metadata.ship_address_line2 || '',
    city: metadata.ship_city || '',
    state: metadata.ship_state || '',
    postal_code: metadata.ship_postal_code || '',
    country: metadata.ship_country || 'US',
  };

  console.log(`📦 Shipping extracted from metadata: ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postal_code}`);

  // Validate shipping completeness
  const missingShippingFields = [];
  if (!shippingAddress.address_line1) missingShippingFields.push('address_line1');
  if (!shippingAddress.city) missingShippingFields.push('city');
  if (!shippingAddress.state) missingShippingFields.push('state');
  if (!shippingAddress.postal_code) missingShippingFields.push('postal_code');

  if (missingShippingFields.length > 0) {
    console.error(`❌ Incomplete shipping address: missing ${missingShippingFields.join(', ')}`);
    console.log('[DEBUG] session.metadata keys:', Object.keys(session.metadata || {}));
    throw new Error(`Incomplete shipping address: missing ${missingShippingFields.join(', ')}`);
  }

  // STEP 3: Extract scalars from metadata
  const userId = metadata.user_id || session.client_reference_id;
  const scheduledDate = metadata.scheduled_delivery_date || null;
  const isScheduled = !!scheduledDate && new Date(scheduledDate) > new Date();
  const isAutoGift = metadata.is_auto_gift === 'true';
  const autoGiftRuleId = metadata.auto_gift_rule_id || null;
  const deliveryGroupId = metadata.delivery_group_id || null;

  console.log(`👤 User ID: ${userId} | Scheduled: ${isScheduled} | AutoGift: ${isAutoGift}`);

  if (!userId) {
    console.error('❌ No user_id in session metadata or client_reference_id');
    throw new Error('Missing user_id in checkout session');
  }

  // STEP 4: Fetch line items from Stripe API
  console.log(`📋 Fetching line items from Stripe...`);
  const lineItemsResponse = await stripe.checkout.sessions.listLineItems(sessionId, { limit: 100 });
  const lineItems = lineItemsResponse.data.map((item: any) => ({
    product_id: item.price?.product || item.description || 'unknown',
    title: item.description || 'Product',
    quantity: item.quantity || 1,
    unit_price: item.price?.unit_amount ? item.price.unit_amount / 100 : 0,
    currency: item.price?.currency || 'usd',
  }));

  console.log(`✅ Found ${lineItems.length} line items`);

  if (lineItems.length === 0) {
    console.error('❌ No line items found in checkout session');
    throw new Error('No line items in checkout session');
  }

  // STEP 5: Create order
  const orderData = {
    user_id: userId,
    checkout_session_id: sessionId,
    payment_intent_id: session.payment_intent as string || null,
    status: isScheduled ? 'scheduled' : 'payment_confirmed',
    payment_status: session.payment_status === 'paid' ? 'paid' : 'pending',
    total_amount: session.amount_total ? session.amount_total / 100 : 0,
    currency: session.currency || 'usd',
    line_items: lineItems,
    shipping_address: shippingAddress,
    scheduled_delivery_date: scheduledDate,
    is_auto_gift: isAutoGift,
    auto_gift_rule_id: autoGiftRuleId,
    notes: deliveryGroupId ? JSON.stringify({ 
      delivery_group_id: deliveryGroupId,
      metadata_snapshot: new Date().toISOString()
    }) : null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  console.log(`💾 Creating order for user ${userId}...`);
  const { data: newOrder, error: insertError } = await supabase
    .from('orders')
    .insert(orderData)
    .select('id, order_number, status')
    .single();

  if (insertError) {
    console.error('❌ Failed to create order:', insertError);
    throw new Error(`Failed to create order: ${insertError.message}`);
  }

  console.log(`✅ Order created: ${newOrder.id} | Number: ${newOrder.order_number}`);

  // STEP 6: Send receipt email (idempotent via orchestrator)
  await triggerEmailOrchestrator(newOrder.id, session, lineItems, supabase);

  // STEP 7: Trigger processing if not scheduled
  if (!isScheduled && session.payment_status === 'paid') {
    console.log(`🚀 Triggering immediate order processing...`);
    await triggerOrderProcessing(newOrder.id, supabase, userId);
  } else if (isScheduled) {
    console.log(`⏰ Order scheduled for ${scheduledDate} - skipping immediate processing`);
  }

  console.log(`✅ checkout.session.completed processing complete for ${sessionId}`);
}

// ============================================================================
// CORE HANDLER: checkout.session.expired
// ============================================================================
async function handleCheckoutSessionExpired(
  session: Stripe.Checkout.Session,
  supabase: any
) {
  const sessionId = session.id;
  console.log(`⏱️ Processing checkout.session.expired: ${sessionId}`);

  const { data: existingOrder } = await supabase
    .from('orders')
    .select('id, status')
    .eq('checkout_session_id', sessionId)
    .single();

  if (existingOrder && existingOrder.status === 'payment_confirmed') {
    console.log(`⚠️ Marking order as expired: ${existingOrder.id}`);
    await supabase
      .from('orders')
      .update({ status: 'expired', updated_at: new Date().toISOString() })
      .eq('id', existingOrder.id);
  } else {
    console.log(`ℹ️ No confirmed order found for expired session ${sessionId}`);
  }
}

// ============================================================================
// LEGACY: payment_intent enrichment (no order creation)
// ============================================================================
async function enrichExistingOrder(
  paymentIntent: Stripe.PaymentIntent,
  supabase: any
) {
  const piId = paymentIntent.id;
  console.log(`🔍 LEGACY: Attempting to enrich existing order for payment_intent ${piId}`);

  const { data: existingOrder } = await supabase
    .from('orders')
    .select('id, status, payment_status')
    .eq('payment_intent_id', piId)
    .single();

  if (existingOrder) {
    console.log(`✅ Found existing order ${existingOrder.id}, enriching payment status`);
    await supabase
      .from('orders')
      .update({ 
        payment_status: 'paid',
        updated_at: new Date().toISOString()
      })
      .eq('id', existingOrder.id);
  } else {
    console.log(`ℹ️ No existing order found for payment_intent ${piId} - this is expected if using checkout sessions`);
  }
}

// ============================================================================
// LEGACY: payment_intent.payment_failed
// ============================================================================
async function handlePaymentFailed(
  paymentIntent: Stripe.PaymentIntent,
  supabase: any
) {
  const piId = paymentIntent.id;
  console.log(`❌ Payment failed for payment_intent ${piId}`);

  const { data: existingOrder } = await supabase
    .from('orders')
    .select('id')
    .eq('payment_intent_id', piId)
    .single();

  if (existingOrder) {
    await supabase
      .from('orders')
      .update({ 
        status: 'payment_failed',
        payment_status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', existingOrder.id);
    console.log(`✅ Marked order ${existingOrder.id} as payment_failed`);
  }
}

// ============================================================================
// HELPER: Trigger email orchestrator (idempotent)
// ============================================================================
async function triggerEmailOrchestrator(
  orderId: string,
  session: Stripe.Checkout.Session,
  lineItems: any[],
  supabase: any
) {
  try {
    console.log(`📧 Triggering email orchestrator for order ${orderId}...`);
    
    const recipientEmail = session.customer_details?.email;
    if (!recipientEmail) {
      console.error(`❌ No customer email found in session ${session.id}`);
      return;
    }

    const { error } = await supabase.functions.invoke('ecommerce-email-orchestrator', {
      body: {
        eventType: 'order_receipt',
        recipientEmail: recipientEmail,
        data: {
          order_id: orderId,
          checkout_session_id: session.id,
          amount: session.amount_total ? session.amount_total / 100 : 0,
          currency: session.currency || 'usd',
          line_items: lineItems,
          customer_name: session.customer_details?.name || recipientEmail,
        }
      }
    });
    
    if (error) {
      console.error(`❌ Email orchestrator error:`, error);
    } else {
      console.log(`✅ Email orchestrator triggered successfully for ${recipientEmail}`);
    }
  } catch (err: any) {
    console.error(`❌ Failed to trigger email orchestrator:`, err.message);
  }
}

// ============================================================================
// HELPER: Trigger order processing
// ============================================================================
async function triggerOrderProcessing(orderId: string, supabase: any, userId: string) {
  try {
    console.log(`🚀 Triggering process-order-v2 for order ${orderId}...`);
    
    const { error } = await supabase.functions.invoke('process-order-v2', {
      body: { orderId }
    });
    
    if (error) {
      console.error(`❌ process-order-v2 error:`, error);
      await supabase
        .from('orders')
        .update({
          status: 'requires_attention',
          funding_hold_reason: `Failed to trigger processing: ${error.message}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
    } else {
      console.log(`✅ process-order-v2 triggered successfully`);
    }
  } catch (err: any) {
    console.error(`❌ Failed to trigger process-order-v2:`, err.message);
  }
}
