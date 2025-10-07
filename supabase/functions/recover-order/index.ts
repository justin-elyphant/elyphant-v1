import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();
    
    console.log('🔧 Manual order recovery triggered for:', orderId);
    
    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Order ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Step 1: Get the order
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      console.error('❌ Order not found:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Order not found', details: fetchError }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📦 Current order status:', {
      status: order.status,
      payment_status: order.payment_status,
      stripe_payment_intent_id: order.stripe_payment_intent_id
    });

    // Step 2: Verify payment with Stripe
    const stripe = (await import('https://esm.sh/stripe@14.21.0')).default(
      Deno.env.get('STRIPE_SECRET_KEY') || '',
      { apiVersion: '2023-10-16' }
    );

    let paymentVerified = false;
    if (order.stripe_payment_intent_id) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(order.stripe_payment_intent_id);
        console.log('💳 Stripe payment status:', paymentIntent.status);
        
        if (paymentIntent.status === 'succeeded') {
          paymentVerified = true;
        }
      } catch (stripeError) {
        console.error('⚠️ Stripe verification failed:', stripeError);
      }
    }

    if (!paymentVerified) {
      return new Response(
        JSON.stringify({ 
          error: 'Payment not verified in Stripe',
          suggestion: 'Please verify payment status in Stripe Dashboard'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Update order status
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: 'succeeded',
        status: 'payment_confirmed',
        payment_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Failed to update order:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update order', details: updateError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Order updated successfully');

    // Step 4: Trigger order processing
    try {
      const processResult = await supabase.functions.invoke('process-zma-order', {
        body: { 
          orderId: orderId,
          triggerSource: 'manual-recovery',
          isScheduled: updatedOrder.scheduled_delivery_date ? true : false,
          scheduledDeliveryDate: updatedOrder.scheduled_delivery_date,
          isAutoGift: updatedOrder.is_auto_gift || false,
          autoGiftContext: updatedOrder.auto_gift_context
        }
      });

      console.log('🚀 Order processing triggered:', processResult);

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Order recovered and processing triggered',
          order: updatedOrder,
          processing: processResult.data
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (processError) {
      console.error('⚠️ Processing trigger failed:', processError);
      
      // Order was updated successfully, but processing failed
      return new Response(
        JSON.stringify({ 
          success: true,
          warning: 'Order recovered but processing trigger failed',
          order: updatedOrder,
          processingError: processError.message
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }
  } catch (error: any) {
    console.error('❌ Recovery error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
