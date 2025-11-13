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
    console.log('💳 [capture-scheduled-payment] Function invoked');
    
    const { orderId } = await req.json();
    
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, order_number, stripe_payment_intent_id, payment_status, status')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    console.log(`📋 Processing payment capture for order: ${order.order_number}`);
    console.log(`   Payment Intent ID: ${order.stripe_payment_intent_id}`);
    console.log(`   Current payment status: ${order.payment_status}`);

    if (!order.stripe_payment_intent_id) {
      throw new Error('No payment intent found for order');
    }

    // Initialize Stripe
    const stripe = (await import('https://esm.sh/stripe@14.21.0')).default(
      Deno.env.get('STRIPE_SECRET_KEY') || '',
      { apiVersion: '2023-10-16' }
    );

    // Retrieve and confirm the payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(order.stripe_payment_intent_id);
    
    console.log('🔍 Payment intent status:', paymentIntent.status);

    if (paymentIntent.status === 'requires_confirmation') {
      console.log('💳 Confirming payment intent...');
      
      const confirmedPayment = await stripe.paymentIntents.confirm(order.stripe_payment_intent_id);
      
      if (confirmedPayment.status === 'succeeded') {
        console.log('✅ Payment confirmed successfully');
        
        // Update order payment status
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            payment_status: 'succeeded',
            status: 'payment_confirmed',
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);

        if (updateError) {
          console.error('❌ Failed to update order status:', updateError);
          throw new Error('Failed to update order status');
        }

        console.log(`✅ Order ${order.order_number} payment status updated to succeeded`);
        
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Payment captured successfully',
            orderId: orderId,
            paymentIntentId: order.stripe_payment_intent_id,
            status: confirmedPayment.status
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        );
      } else {
        throw new Error(`Payment confirmation failed with status: ${confirmedPayment.status}`);
      }
    } else if (paymentIntent.status === 'succeeded') {
      console.log('✅ Payment already succeeded');
      
      // Update order status anyway to ensure consistency
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'succeeded',
          status: 'payment_confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('❌ Failed to update order status:', updateError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Payment already captured',
          orderId: orderId,
          paymentIntentId: order.stripe_payment_intent_id,
          status: paymentIntent.status
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      );
    } else {
      throw new Error(`Cannot capture payment in status: ${paymentIntent.status}`);
    }

  } catch (error) {
    console.error('❌ Error in capture-scheduled-payment:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});