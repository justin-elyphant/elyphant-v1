import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

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
        order_id: paymentIntent.metadata?.order_id
      }
    });

    // RACE CONDITION FIX: Try metadata first, then payment_intent_id with retry logic
    let order = null;
    let updateError = null;
    
    // Try 1: Look up by order_id from metadata (primary method)
    if (paymentIntent.metadata?.order_id) {
      console.log(`🔍 Looking up order by metadata order_id: ${paymentIntent.metadata.order_id}`);
      const result = await supabase
        .from('orders')
        .update({
          payment_status: 'succeeded',
          status: 'payment_confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentIntent.metadata.order_id)
        .select()
        .maybeSingle();
      
      order = result.data;
      updateError = result.error;
    }
    
    // Try 2: Fallback to payment_intent_id (backward compatibility + retry)
    if (!order && !updateError) {
      console.log(`🔍 Looking up order by payment_intent_id: ${paymentIntent.id}`);
      const result = await supabase
        .from('orders')
        .update({
          payment_status: 'succeeded',
          status: 'payment_confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_payment_intent_id', paymentIntent.id)
        .select()
        .maybeSingle();
      
      order = result.data;
      updateError = result.error;
      
      // Try 3: Retry after 2 seconds if order not found (race condition mitigation)
      if (!order && !updateError) {
        console.log('⏳ Order not found, retrying in 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const retryResult = await supabase
          .from('orders')
          .update({
            payment_status: 'succeeded',
            status: 'payment_confirmed',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .select()
          .maybeSingle();
        
        order = retryResult.data;
        updateError = retryResult.error;
      }
    }

    if (updateError) {
      console.error('❌ Failed to update order after payment success:', updateError);
      
      // Log failure
      await supabase.from('webhook_delivery_log').insert({
        event_type: 'payment_intent.succeeded',
        event_id: paymentIntent.id,
        delivery_status: 'failed',
        status_code: 500,
        error_message: updateError.message,
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
          payment_verified_at: new Date().toISOString(),
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