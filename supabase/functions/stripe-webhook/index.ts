import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

/**
 * Normalize date input to valid YYYY-MM-DD format or null
 * Prevents PostgreSQL "invalid input syntax for type date" errors
 */
function normalizeDate(input: unknown): string | null {
  if (!input || input === '' || input === 'null' || input === 'undefined') {
    return null;
  }
  
  const dateStr = String(input).trim();
  if (!dateStr) {
    return null;
  }
  
  try {
    // Already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return dateStr;
      }
    }
    
    // Try parsing as ISO date
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (e) {
    console.warn('⚠️ Failed to normalize date:', dateStr, e);
  }
  
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🪝 Processing Stripe webhook...');
    
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    if (!signature || !webhookSecret) {
      console.error('❌ Missing webhook signature or secret');
      return new Response('Webhook signature verification failed', { status: 400 });
    }

    const stripe = (await import('https://esm.sh/stripe@14.21.0')).default(
      Deno.env.get('STRIPE_SECRET_KEY') || '',
      { apiVersion: '2023-10-16' }
    );

    const body = await req.text();
    let event;

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

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object, supabase);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object, supabase);
        break;
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object, supabase);
        break;
      default:
        console.log(`🔄 Unhandled event type: ${event.type}`);
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

async function handlePaymentSucceeded(paymentIntent: any, supabase: any) {
  console.log(`💳 Payment succeeded: ${paymentIntent.id}`);
  const startTime = Date.now();
  
  try {
    // Log webhook delivery
    await supabase.from('webhook_delivery_log').insert({
      event_type: 'payment_intent.succeeded',
      event_id: paymentIntent.id,
      delivery_status: 'processing',
      status_code: 200,
      payment_intent_id: paymentIntent.id,
      metadata: {
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        customer: paymentIntent.customer,
        has_cart_session: Boolean(paymentIntent.metadata?.cart_session_id)
      }
    });

    // Fetch cart data from cart_sessions table
    let order = null;
    let updateError = null;
    
    // Try 1: Look up by order_id from metadata (old flow - backward compatibility)
    if (paymentIntent.metadata?.order_id) {
      console.log(`🔍 Looking up order by metadata order_id: ${paymentIntent.metadata.order_id}`);
      const result = await supabase
        .from('orders')
        .update({
          payment_status: 'succeeded',
          status: 'payment_confirmed',
          stripe_payment_intent_id: paymentIntent.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentIntent.metadata.order_id)
        .select()
        .maybeSingle();
      
      order = result.data;
      updateError = result.error;
    }
    
    // Try 2: Look up by payment_intent_id (old flow - backward compatibility)
    if (!order && !updateError) {
      console.log(`🔍 Looking up order by payment_intent_id: ${paymentIntent.id}`);
      const result = await supabase
        .from('orders')
        .select()
        .eq('stripe_payment_intent_id', paymentIntent.id)
        .maybeSingle();
      
      if (result.data) {
        const updateResult = await supabase
          .from('orders')
          .update({
            payment_status: 'succeeded',
            status: 'payment_confirmed',
            updated_at: new Date().toISOString()
          })
          .eq('id', result.data.id)
          .select()
          .single();
        
        order = updateResult.data;
        updateError = updateResult.error;
      }
    }
    
    // NEW FLOW: Create order from cart_sessions table
    if (!order && !updateError && paymentIntent.metadata?.cart_session_id) {
      console.log('📦 Fetching cart data from cart_sessions...');
      
      const { data: cartSession, error: sessionError } = await supabase
        .from('cart_sessions')
        .select('cart_data')
        .eq('session_id', paymentIntent.metadata.cart_session_id)
        .maybeSingle();
      
      if (sessionError || !cartSession) {
        console.error('❌ Failed to fetch cart session:', sessionError);
        updateError = sessionError || new Error('Cart session not found');
      } else {
        const cartData = cartSession.cart_data;
        
        // Validate shipping info exists (prevent empty orders)
        if (!cartData.shippingInfo?.address && !cartData.shippingInfo?.address_line1) {
          console.error('❌ Missing shipping address in cart data');
          updateError = new Error('Missing shipping address');
          return;
        }

        console.log('📦 Cart data:', JSON.stringify(cartData, null, 2));
        
        // Normalize scheduled delivery date (prevent empty string errors)
        const normalizedDeliveryDate = normalizeDate(
          cartData.giftOptions?.scheduleDelivery 
            ? cartData.giftOptions?.scheduledDeliveryDate 
            : null
        );
        
        console.log('📅 Date normalization:', {
          original: cartData.giftOptions?.scheduledDeliveryDate,
          scheduleDelivery: cartData.giftOptions?.scheduleDelivery,
          normalized: normalizedDeliveryDate
        });
        
        const { data: newOrder, error: createError } = await supabase
          .from('orders')
          .insert({
            user_id: paymentIntent.metadata.user_id,
            stripe_payment_intent_id: paymentIntent.id,
            order_number: `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            status: 'payment_confirmed',
            payment_status: 'succeeded',
            subtotal: cartData.subtotal,
            shipping_cost: cartData.shippingCost,
            gifting_fee: cartData.giftingFee,
            gifting_fee_name: cartData.giftingFeeName,
            gifting_fee_description: cartData.giftingFeeDescription,
            tax_amount: cartData.taxAmount,
            total_amount: cartData.totalAmount,
            currency: 'USD',
            shipping_info: cartData.shippingInfo,
            gift_options: cartData.giftOptions,
            delivery_groups: (() => {
              // Group items by recipient assignment
              const groupedByRecipient = new Map();
              
              cartData.cartItems.forEach((item: any) => {
                if (item.recipientAssignment) {
                  const groupId = item.recipientAssignment.deliveryGroupId;
                  if (!groupedByRecipient.has(groupId)) {
                    groupedByRecipient.set(groupId, {
                      id: groupId,
                      connectionId: item.recipientAssignment.connectionId,
                      connectionName: item.recipientAssignment.connectionName,
                      items: [],
                      giftMessage: item.recipientAssignment.giftMessage,
                      scheduledDeliveryDate: item.recipientAssignment.scheduledDeliveryDate,
                      shippingAddress: item.recipientAssignment.shippingAddress,
                      address_verified: item.recipientAssignment.address_verified,
                      address_verification_method: item.recipientAssignment.address_verification_method,
                      address_verified_at: item.recipientAssignment.address_verified_at,
                      address_last_updated: item.recipientAssignment.address_last_updated
                    });
                  }
                  groupedByRecipient.get(groupId).items.push(item);
                }
              });
              
              // If items have recipient assignments, use grouped delivery
              if (groupedByRecipient.size > 0) {
                return Array.from(groupedByRecipient.values());
              }
              
              // Otherwise, single delivery group (current behavior)
              return [{
                items: cartData.cartItems,
                shipping_info: cartData.shippingInfo,
                gift_options: cartData.giftOptions
              }];
            })(),
            scheduled_delivery_date: normalizedDeliveryDate,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (createError) {
          console.error('❌ Failed to create order:', createError);
          updateError = createError;
        } else {
          order = newOrder;
          console.log('✅ Order created from cart_sessions:', order.id);
          
          // Insert order items into order_items table with correct column mapping
          const items = Array.isArray(cartData?.cartItems) ? cartData.cartItems : [];
          
          if (items.length === 0) {
            console.warn('⚠️ No cart items found in cart session; skipping order_items insert');
          } else {
            const orderItems = items.map((item: any) => {
              const ra = item?.recipientAssignment || {};
              const qty = Number(item?.quantity ?? 1);
              const unitPrice = Number(item?.price ?? 0);

              return {
                order_id: order.id,
                product_id: String(item?.product_id ?? ''),
                product_name: item?.title ?? item?.name ?? 'Product',
                product_image: item?.image ?? null,
                vendor: 'zma',
                quantity: qty,
                unit_price: unitPrice,
                total_price: unitPrice * qty,
                recipient_connection_id: ra?.connectionId ?? null,
                delivery_group_id: ra?.deliveryGroupId ?? null,
                recipient_gift_message: ra?.giftMessage ?? null,
                scheduled_delivery_date: normalizeDate(ra?.scheduledDeliveryDate),
                variation_text: item?.variation_text ?? null,
                selected_variations: item?.selected_variations ?? null
              };
            });

            console.log(`📦 Inserting ${orderItems.length} order items. First item:`, {
              product_name: orderItems[0]?.product_name,
              quantity: orderItems[0]?.quantity,
              unit_price: orderItems[0]?.unit_price
            });

            const { error: itemsError } = await supabase
              .from('order_items')
              .insert(orderItems);

            if (itemsError) {
              console.error('❌ Failed to create order items:', itemsError);
            } else {
              console.log('✅ Created', orderItems.length, 'order items');
            }
          }
          
          // Mark cart session as completed
          await supabase
            .from('cart_sessions')
            .update({ completed_at: new Date().toISOString() })
            .eq('session_id', paymentIntent.metadata.cart_session_id);
        }
      }
    }

    if (updateError || !order) {
      console.error('❌ Failed to find or create order after payment success:', updateError);
      
      await supabase.from('webhook_delivery_log').insert({
        event_type: 'payment_intent.succeeded',
        event_id: paymentIntent.id,
        delivery_status: 'failed',
        status_code: 500,
        error_message: updateError?.message || 'Order not found and no cart session',
        payment_intent_id: paymentIntent.id,
        processing_duration_ms: Date.now() - startTime
      });
      
      return;
    }

    if (order) {
      console.log(`✅ Order ${order.id} updated for successful payment`);
      
      // 📧 Trigger payment confirmation email
      try {
        console.log('📧 Triggering payment confirmation email...');
        const { error: emailError } = await supabase.functions.invoke('ecommerce-email-orchestrator', {
          body: {
            eventType: 'payment_confirmed',
            orderId: order.id
          }
        });
        
        if (emailError) {
          console.error('⚠️ Failed to send payment confirmation email:', emailError);
        } else {
          console.log('✅ Payment confirmation email triggered');
        }
      } catch (emailError) {
        console.error('⚠️ Error triggering payment confirmation email:', emailError);
      }
      
      // Call process-zma-order directly (consolidated, single path)
      try {
        await supabase.functions.invoke('process-zma-order', {
          body: { 
            orderId: order.id,
            triggerSource: 'stripe-webhook',
            isScheduled: order.scheduled_delivery_date ? true : false,
            scheduledDeliveryDate: order.scheduled_delivery_date,
            isAutoGift: order.is_auto_gift || false,
            autoGiftContext: order.auto_gift_context
          }
        });
        console.log(`🚀 Direct ZMA processor invoked for order ${order.id}`);
        
        // Log success
        await supabase.from('webhook_delivery_log').insert({
          event_type: 'payment_intent.succeeded',
          event_id: paymentIntent.id,
          delivery_status: 'completed',
          status_code: 200,
          payment_intent_id: paymentIntent.id,
          order_id: order.id,
          processing_duration_ms: Date.now() - startTime
        });
      } catch (processError) {
        console.error('⚠️ Failed to trigger order processing:', processError);
        
        // Log processing failure
        await supabase.from('webhook_delivery_log').insert({
          event_type: 'payment_intent.succeeded',
          event_id: paymentIntent.id,
          delivery_status: 'processing_failed',
          status_code: 500,
          error_message: processError.message,
          payment_intent_id: paymentIntent.id,
          order_id: order.id,
          processing_duration_ms: Date.now() - startTime
        });
      }
    }
  } catch (error) {
    console.error('❌ Error handling payment success:', error);
    
    // Log general error
    await supabase.from('webhook_delivery_log').insert({
      event_type: 'payment_intent.succeeded',
      event_id: paymentIntent.id,
      delivery_status: 'error',
      status_code: 500,
      error_message: error.message,
      payment_intent_id: paymentIntent.id,
      processing_duration_ms: Date.now() - startTime
    });
  }
}

async function handlePaymentFailed(paymentIntent: any, supabase: any) {
  console.log(`❌ Payment failed: ${paymentIntent.id}`);
  
  try {
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: 'failed',
        status: 'payment_failed',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    if (updateError) {
      console.error('❌ Failed to update order after payment failure:', updateError);
    } else {
      console.log(`✅ Order updated for failed payment: ${paymentIntent.id}`);
    }
  } catch (error) {
    console.error('❌ Error handling payment failure:', error);
  }
}

async function handleCheckoutCompleted(session: any, supabase: any) {
  console.log(`🛍️ Checkout completed: ${session.id}`);
  
  try {
    if (session.payment_status === 'paid') {
      const { data: order, error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'succeeded',
          status: 'payment_confirmed',
          stripe_payment_intent_id: session.payment_intent,
          updated_at: new Date().toISOString()
        })
        .eq('stripe_session_id', session.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Failed to update order after checkout completion:', updateError);
        return;
      }

      if (order) {
        console.log(`✅ Order ${order.id} updated for completed checkout`);
        
        // Call simplified order processor directly (email deduplication handled by orchestrator)
        try {
          await supabase.functions.invoke('simple-order-processor', {
            body: { 
              orderId: order.id,
              triggerSource: 'stripe-webhook',
              isScheduled: order.scheduled_delivery_date ? true : false,
              scheduledDeliveryDate: order.scheduled_delivery_date,
              isAutoGift: order.is_auto_gift || false,
              autoGiftContext: order.auto_gift_context
            }
          });
          console.log(`🚀 Simplified processor invoked for checkout order ${order.id}`);
        } catch (processError) {
          console.error('⚠️ Failed to trigger order processing:', processError);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error handling checkout completion:', error);
  }
}