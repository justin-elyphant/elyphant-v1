
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { payment_intent_id, order_id } = await req.json();
    
    console.log('🔍 Verifying payment intent:', { payment_intent_id, order_id });

    if (!payment_intent_id || !order_id) {
      throw new Error('Missing payment_intent_id or order_id');
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Initialize Supabase with service role key for admin operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
    console.log('💳 Payment intent status:', paymentIntent.status);

    if (paymentIntent.status !== 'succeeded') {
      throw new Error(`Payment not successful. Status: ${paymentIntent.status}`);
    }

    // Get the order from database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      console.error('❌ Order not found:', orderError);
      throw new Error('Order not found');
    }

    console.log('📦 Order found:', { order_number: order.order_number, status: order.status });

    // Update order status to completed
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'confirmed',
        payment_status: 'succeeded',
        stripe_payment_intent_id: payment_intent_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', order_id);

    if (updateError) {
      console.error('❌ Error updating order:', updateError);
      throw new Error('Failed to update order status');
    }

    console.log('✅ Order status updated to confirmed');

    // Trigger Zinc processing for marketplace orders
    try {
      console.log('🔄 Triggering Zinc processing...');
      const { data: zincResponse, error: zincError } = await supabase.functions.invoke('process-zinc-order', {
        body: { 
          order_id: order_id,
          payment_intent_id: payment_intent_id
        }
      });

      if (zincError) {
        console.error('⚠️ Zinc processing error (non-fatal):', zincError);
        // Don't fail the whole verification if Zinc fails - log it but continue
      } else {
        console.log('✅ Zinc processing initiated:', zincResponse);
      }
    } catch (zincError) {
      console.error('⚠️ Error calling Zinc processing (non-fatal):', zincError);
      // Continue even if Zinc fails - the payment was successful
    }

    return new Response(
      JSON.stringify({
        success: true,
        order_id: order_id,
        order_number: order.order_number,
        payment_status: 'succeeded',
        message: 'Payment verified and order confirmed'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('❌ Payment verification error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Payment verification failed'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
