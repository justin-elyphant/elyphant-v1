import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
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
    console.log('🪝 [START] Stripe Webhook v2 - Processing event...');
    
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
      console.log(`✅ [${new Date().toISOString()}] Webhook verified: ${event.type} | ID: ${event.id}`);
    } catch (err: any) {
      console.error(`❌ [${new Date().toISOString()}] Webhook signature verification failed:`, err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // CORE: Handle checkout.session.completed (primary order creation path)
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`📋 [${new Date().toISOString()}] Processing checkout.session.completed: ${session.id}`);
      await handleCheckoutSessionCompleted(session, supabase, stripe);
    } 
    // CORE: Handle checkout.session.expired
    else if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`⏱️ [${new Date().toISOString()}] Processing checkout.session.expired: ${session.id}`);
      await handleCheckoutSessionExpired(session, supabase);
    }
    // LEGACY: payment_intent events (no order creation, enrichment only)
    else if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`⚠️ [${new Date().toISOString()}] LEGACY: payment_intent.succeeded ${paymentIntent.id} - enrichment only, no order creation`);
      await enrichExistingOrder(paymentIntent, supabase);
    } 
    else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`⚠️ [${new Date().toISOString()}] LEGACY: payment_intent.payment_failed ${paymentIntent.id} - updating existing order`);
      await handlePaymentFailed(paymentIntent, supabase);
    }

    console.log(`✅ [${new Date().toISOString()}] Webhook processing complete`);
    return new Response(
      JSON.stringify({ received: true, event_type: event.type, event_id: event.id }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error(`❌ [${new Date().toISOString()}] Webhook processing error:`, error);
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
  const startTime = Date.now();
  console.log(`📋 [${new Date().toISOString()}] [START] Processing checkout.session.completed: ${sessionId}`);

  // STEP 1: Check for existing order (idempotency)
  console.log(`🔍 [STEP 1] Checking for existing order...`);
  const { data: existingOrder } = await supabase
    .from('orders')
    .select('id, status, receipt_sent_at, user_id')
    .eq('checkout_session_id', sessionId)
    .single();

  if (existingOrder) {
    console.log(`✅ [STEP 1] Order already exists: ${existingOrder.id} | Status: ${existingOrder.status}`);
    console.log(`🔍 [STEP 1.1] Idempotency check - skipping insert, checking follow-up steps...`);
    
    // Check if receipt needs to be sent
    if (!existingOrder.receipt_sent_at) {
      console.log(`📧 [STEP 1.2] Receipt not sent yet, triggering email orchestrator...`);
      const lineItemsForRetry = await stripe.checkout.sessions.listLineItems(sessionId, { limit: 100 });
      
      // Extract Amazon ASINs from product metadata for receipt
      const lineItemsData = await Promise.all(
        lineItemsForRetry.data.map(async (item: any) => {
          const stripeProductId = item.price?.product;
          const description = item.description || 'Product';
          
          // Skip non-product items
          if (description === 'Shipping' || description === 'Tax' || description.includes('Gifting Fee')) {
            return null;
          }
          
          let amazonAsin = 'unknown';
          if (stripeProductId) {
            try {
              const product = await stripe.products.retrieve(stripeProductId);
              amazonAsin = product.metadata?.product_id || 'unknown';
            } catch (err) {
              console.error(`⚠️  Failed to fetch product metadata:`, err);
            }
          }
          
          return {
            product_id: amazonAsin,  // Use Amazon ASIN
            title: description,
            quantity: item.quantity || 1,
            unit_price: item.price?.unit_amount ? item.price.unit_amount / 100 : 0,
            currency: item.price?.currency || 'usd',
          };
        })
      );
      
      // Filter out null entries
      const filteredLineItems = lineItemsData.filter((item): item is NonNullable<typeof item> => item !== null);
      
      await triggerEmailOrchestrator(existingOrder.id, session, filteredLineItems, supabase);
    }
    
    // Check if processing needed (non-scheduled, not yet submitted)
    console.log(`🔍 [STEP 1.3] Checking if order needs processing...`);
    const { data: fullOrder } = await supabase
      .from('orders')
      .select('id, status, is_scheduled, zinc_order_id')
      .eq('id', existingOrder.id)
      .single();
      
    if (fullOrder && !fullOrder.is_scheduled && !fullOrder.zinc_order_id && fullOrder.status !== 'processing') {
      console.log(`🔄 [STEP 1.4] Order not yet processing, triggering process-order-v2 with retry...`);
      try {
        await triggerOrderProcessingWithRetry(fullOrder.id, supabase, existingOrder.user_id);
      } catch (err: any) {
        console.error(`❌ [STEP 1.4] Processing retry failed:`, err);
      }
    }
    
    console.log(`✅ [${new Date().toISOString()}] Idempotent handling complete for ${existingOrder.id}`);
    return;
  }

  console.log(`✅ [STEP 1] No existing order found - proceeding with creation`);

  // STEP 2: Extract shipping from metadata (collected at /checkout)
  console.log(`🔍 [STEP 2] Extracting shipping address from session metadata...`);
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

  console.log(`📦 [STEP 2] Shipping extracted: ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postal_code}`);

  // Validate shipping completeness
  const missingShippingFields = [];
  if (!shippingAddress.address_line1) missingShippingFields.push('address_line1');
  if (!shippingAddress.city) missingShippingFields.push('city');
  if (!shippingAddress.state) missingShippingFields.push('state');
  if (!shippingAddress.postal_code) missingShippingFields.push('postal_code');

  if (missingShippingFields.length > 0) {
    console.error(`❌ [STEP 2] Incomplete shipping address: missing ${missingShippingFields.join(', ')}`);
    console.log(`[DEBUG] session.metadata keys:`, Object.keys(session.metadata || {}));
    throw new Error(`Incomplete shipping address: missing ${missingShippingFields.join(', ')}`);
  }

  // STEP 3: Extract scalars from metadata
  console.log(`🔍 [STEP 3] Extracting order metadata...`);
  const userId = metadata.user_id || session.client_reference_id;
  const scheduledDate = metadata.scheduled_delivery_date || null;
  const isScheduled = !!scheduledDate && new Date(scheduledDate) > new Date();
  const isAutoGift = metadata.is_auto_gift === 'true';
  const autoGiftRuleId = metadata.auto_gift_rule_id || null;
  const deliveryGroupId = metadata.delivery_group_id || null;

  console.log(`✅ [STEP 3] User: ${userId} | Scheduled: ${isScheduled} | AutoGift: ${isAutoGift} | DeliveryGroup: ${deliveryGroupId}`);

  if (!userId) {
    console.error('❌ No user_id in session metadata or client_reference_id');
    throw new Error('Missing user_id in checkout session');
  }

  // STEP 4: Fetch line items from Stripe API and extract Amazon ASINs from metadata
  console.log(`📋 [STEP 4] Fetching line items from Stripe...`);
  const lineItemsResponse = await stripe.checkout.sessions.listLineItems(sessionId, { limit: 100 });
  
  // Extract line items and fetch product metadata to get Amazon ASINs
  const lineItemsWithMetadata = await Promise.all(
    lineItemsResponse.data.map(async (item: any) => {
      const stripeProductId = item.price?.product;
      
      // Skip non-product items (Shipping, Tax, Gifting Fee)
      const description = item.description || '';
      if (description === 'Shipping' || description === 'Tax' || description.includes('Gifting Fee')) {
        console.log(`⏭️  Skipping non-product item: ${description}`);
        return null;
      }
      
      // Fetch product to get metadata containing Amazon ASIN and gift message
      let amazonAsin = 'unknown';
      let recipientId = null;
      let recipientName = '';
      let giftMessage = '';
      
      if (stripeProductId) {
        try {
          const product = await stripe.products.retrieve(stripeProductId);
          amazonAsin = product.metadata?.product_id || 'unknown';
          recipientId = product.metadata?.recipient_id || null;
          recipientName = product.metadata?.recipient_name || '';
          giftMessage = product.metadata?.gift_message || '';
          
          console.log(`✅ [STEP 4.1] Product: ${description} | Amazon ASIN: ${amazonAsin} | Stripe ID: ${stripeProductId} | Gift: ${giftMessage ? 'Yes' : 'No'}`);
        } catch (err) {
          console.error(`⚠️  Failed to fetch product ${stripeProductId}:`, err);
        }
      }
      
      return {
        product_id: amazonAsin,  // Use Amazon ASIN from metadata, not Stripe Price ID
        title: description || 'Product',
        quantity: item.quantity || 1,
        unit_price: item.price?.unit_amount ? item.price.unit_amount / 100 : 0,
        currency: item.price?.currency || 'usd',
        recipient_id: recipientId === 'self' ? null : recipientId,  // Convert 'self' to null
        recipient_name: recipientName,
        gift_message: giftMessage,
      };
    })
  );
  
  // Filter out null entries (non-product items)
  const lineItems = lineItemsWithMetadata.filter((item): item is NonNullable<typeof item> => item !== null);
  
  console.log(`✅ [STEP 4] Found ${lineItems.length} product line items (filtered out fees/shipping/tax)`);

  if (lineItems.length === 0) {
    console.error('❌ No line items found in checkout session');
    throw new Error('No line items in checkout session');
  }

  // STEP 5: Extract gift messages from line items
  const giftMessages = lineItems
    .map((item: any) => item.gift_message)
    .filter((msg: string) => msg && msg.trim());

  const primaryGiftMessage = giftMessages.length > 0 ? giftMessages[0] : '';
  const isGift = giftMessages.length > 0 || isAutoGift;

  const gift_options = {
    isGift,
    giftMessage: primaryGiftMessage,
    giftWrapping: false,
    isSurpriseGift: false
  };

  console.log(`🎁 [STEP 5] Gift detection: ${isGift ? 'Yes' : 'No'} | Message: "${primaryGiftMessage}"`);

  // STEP 6: Create order
  console.log(`💾 [STEP 6] Creating order for user ${userId}...`);
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
    gift_options,
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

  console.log(`💾 [STEP 6.1] Inserting order into database...`);
  const { data: newOrder, error: insertError } = await supabase
    .from('orders')
    .insert(orderData)
    .select('id, order_number, status')
    .single();

  if (insertError) {
    console.error(`❌ [STEP 6.1] Failed to create order:`, insertError);
    throw new Error(`Failed to create order: ${insertError.message}`);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`✅ [STEP 6] Order created in ${elapsed}s: ${newOrder.id} | Number: ${newOrder.order_number} | Status: ${newOrder.status}`);

  // STEP 7: Send receipt email (idempotent via orchestrator)
  console.log(`📧 [STEP 7] Sending receipt email...`);
  await triggerEmailOrchestrator(newOrder.id, session, lineItems, supabase);
  console.log(`✅ [STEP 7] Email orchestrator triggered`);

  // STEP 8: Trigger processing if not scheduled WITH RETRY VERIFICATION
  if (!isScheduled && session.payment_status === 'paid') {
    console.log(`🚀 [${new Date().toISOString()}] Triggering immediate order processing for ${newOrder.id}...`);
    
    try {
      await triggerOrderProcessingWithRetry(newOrder.id, supabase, userId);
    } catch (processingError: any) {
      console.error(`❌ [${new Date().toISOString()}] CRITICAL: Order processing failed for ${newOrder.id}:`, processingError);
      // Don't throw - order is created, just log the failure
      // Admin can use OrderRecoveryTool to retry manually
    }
  } else if (isScheduled) {
    console.log(`⏰ [${new Date().toISOString()}] Order scheduled for ${scheduledDate} - skipping immediate processing`);
  }

  console.log(`✅ [${new Date().toISOString()}] checkout.session.completed processing complete for ${sessionId}`);
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
    console.log(`📧 [${new Date().toISOString()}] Triggering email orchestrator for order ${orderId}...`);
    
    const recipientEmail = session.customer_details?.email;
    if (!recipientEmail) {
      console.error(`❌ [${new Date().toISOString()}] No customer email found in session ${session.id}`);
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
      console.error(`❌ [${new Date().toISOString()}] Email orchestrator error:`, error);
    } else {
      console.log(`✅ [${new Date().toISOString()}] Email orchestrator triggered successfully for ${recipientEmail}`);
    }
  } catch (err: any) {
    console.error(`❌ [${new Date().toISOString()}] Failed to trigger email orchestrator:`, err.message);
  }
}

// ============================================================================
// HELPER: Trigger order processing WITH RETRY AND VERIFICATION
// ============================================================================
async function triggerOrderProcessingWithRetry(orderId: string, supabase: any, userId: string) {
  const maxRetries = 2;
  const verificationDelayMs = 3000; // Wait 3 seconds before verification
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 [${new Date().toISOString()}] Attempt ${attempt}/${maxRetries}: Invoking process-order-v2 for ${orderId}...`);
      
      const { data, error } = await supabase.functions.invoke('process-order-v2', {
        body: { orderId, userId }
      });

      if (error) {
        console.error(`❌ [${new Date().toISOString()}] process-order-v2 invocation error (attempt ${attempt}):`, error);
        
        if (attempt === maxRetries) {
          throw new Error(`Failed to invoke process-order-v2 after ${maxRetries} attempts: ${error.message}`);
        }
        
        console.log(`⏳ Retrying in 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }

      console.log(`✅ [${new Date().toISOString()}] process-order-v2 invoked successfully (attempt ${attempt})`);
      
      // CRITICAL: Verify that Zinc submission actually happened
      console.log(`🔍 [${new Date().toISOString()}] Verifying Zinc submission in ${verificationDelayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, verificationDelayMs));
      
      const { data: verifiedOrder, error: verifyError } = await supabase
        .from('orders')
        .select('zinc_order_id, zinc_request_id, status')
        .eq('id', orderId)
        .single();

      if (verifyError) {
        console.error(`❌ [${new Date().toISOString()}] Verification query failed:`, verifyError);
        throw new Error('Failed to verify order after processing');
      }

      if (!verifiedOrder.zinc_order_id && !verifiedOrder.zinc_request_id) {
        console.error(`❌ [${new Date().toISOString()}] VERIFICATION FAILED: Order ${orderId} has no Zinc IDs despite successful invocation`);
        
        if (attempt === maxRetries) {
          throw new Error('Order processing verification failed - Zinc IDs not populated');
        }
        
        console.log(`⏳ Retrying processing...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }

      console.log(`✅ [${new Date().toISOString()}] VERIFIED: Order ${orderId} successfully submitted to Zinc | Request: ${verifiedOrder.zinc_request_id} | Order: ${verifiedOrder.zinc_order_id}`);
      return; // Success!
      
    } catch (err: any) {
      console.error(`❌ [${new Date().toISOString()}] Processing attempt ${attempt} failed:`, err.message);
      
      if (attempt === maxRetries) {
        throw err;
      }
      
      console.log(`⏳ Retrying in 2 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

// ============================================================================
// LEGACY: Keep old function for backward compatibility but add logging
// ============================================================================
async function triggerOrderProcessing(orderId: string, supabase: any, userId: string) {
  console.log(`⚠️ [${new Date().toISOString()}] LEGACY: Using triggerOrderProcessing without retry. Consider using triggerOrderProcessingWithRetry.`);
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
