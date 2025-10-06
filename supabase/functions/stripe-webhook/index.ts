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
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
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
  
  try {
    // Update order status to payment confirmed
    const { data: order, error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: 'succeeded',
        status: 'payment_confirmed',
        payment_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_payment_intent_id', paymentIntent.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Failed to update order after payment success:', updateError);
      return;
    }

    if (order) {
      console.log(`✅ Order ${order.id} updated for successful payment`);
      
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
      } catch (processError) {
        console.error('⚠️ Failed to trigger order processing:', processError);
        // Don't fail the webhook, order processing can be retried later
      }
    }
  } catch (error) {
    console.error('❌ Error handling payment success:', error);
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
        
        // Call simplified order processor directly
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