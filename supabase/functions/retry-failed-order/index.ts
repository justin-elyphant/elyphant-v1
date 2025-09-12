import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log(`🔄 Retrying failed order: ${orderId}`);

    // 1) Fetch order and verify payment status directly with Stripe if needed
    console.log('🔍 Fetching order for verification...');
    const { data: order, error: orderFetchError } = await supabase
      .from('orders')
      .select('id, status, payment_status, stripe_payment_intent_id, total_amount')
      .eq('id', orderId)
      .maybeSingle();

    if (orderFetchError) {
      throw new Error(`Failed to fetch order: ${orderFetchError.message}`);
    }
    if (!order) {
      throw new Error('Order not found');
    }

    let paymentVerified = order.payment_status === 'succeeded';

    if (!paymentVerified && order.stripe_payment_intent_id) {
      console.log('💳 Verifying payment intent in Stripe before retry...');
      try {
        const stripe = (await import('https://esm.sh/stripe@14.21.0')).default(
          Deno.env.get('STRIPE_SECRET_KEY') ?? '',
          { apiVersion: '2024-12-18.acacia' }
        );

        const pi = await stripe.paymentIntents.retrieve(order.stripe_payment_intent_id);
        console.log('🔎 Stripe PI status:', pi.status);

        if (pi.status === 'succeeded') {
          const { error: updateErr } = await supabase
            .from('orders')
            .update({
              payment_status: 'succeeded',
              status: order.status === 'payment_verification_failed' ? 'pending' : order.status,
            })
            .eq('id', orderId);

          if (updateErr) {
            console.error('⚠️ Failed to update order after Stripe verification:', updateErr);
          } else {
            console.log('✅ Payment status updated to succeeded; proceeding to processing');
            paymentVerified = true;
          }
        } else if (['processing', 'requires_action', 'requires_capture'].includes(pi.status)) {
          throw new Error(`Payment not finalized yet in Stripe (status: ${pi.status}). Try again shortly.`);
        } else {
          throw new Error(`Payment not successful in Stripe (status: ${pi.status}).`);
        }
      } catch (stripeErr) {
        console.error('❌ Stripe verification error:', stripeErr);
        throw new Error(stripeErr instanceof Error ? stripeErr.message : 'Stripe verification failed');
      }
    }

    if (!paymentVerified) {
      throw new Error('Payment not verified; aborting retry to prevent duplicate charges.');
    }

    // 2) Call the process-zma-order function with retry flag
    const { data, error } = await supabase.functions.invoke('process-zma-order', {
      body: {
        orderId: orderId,
        isTestMode: false,
        debugMode: true,
        retryAttempt: true,
      }
    });

    if (error) {
      throw new Error(`Failed to retry order: ${error.message}`);
    }

    console.log(`✅ Order retry completed:`, data);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Order ${orderId} retry completed`,
        result: data
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error retrying order:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});