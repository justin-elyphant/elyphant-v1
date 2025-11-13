import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type VerifyPayload = {
  orderId: string;
  triggerProcessing?: boolean; // default true
  debugMode?: boolean; // default true
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, triggerProcessing = true, debugMode = true } = (await req.json()) as VerifyPayload;

    if (!orderId) {
      throw new Error('Order ID is required');
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log(`🚑 Verify & Recover - Order: ${orderId}`);

    // Fetch the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status, payment_status, stripe_payment_intent_id, total_amount')
      .eq('id', orderId)
      .maybeSingle();

    if (orderError) throw new Error(`Failed to fetch order: ${orderError.message}`);
    if (!order) throw new Error('Order not found');

    const result: Record<string, unknown> = {
      orderId,
      initialStatus: order.status,
      initialPaymentStatus: order.payment_status,
      verifiedInStripe: false,
      processingTriggered: false,
    };

    // Verify payment in Stripe when needed
    if (order.payment_status !== 'succeeded') {
      if (!order.stripe_payment_intent_id) {
        throw new Error('Order missing stripe_payment_intent_id; cannot verify payment');
      }

      console.log('💳 Checking Stripe PaymentIntent...');
      const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
      if (!stripeKey) throw new Error('Stripe secret key not configured in environment');

      const stripe = (await import('https://esm.sh/stripe@14.21.0')).default(
        stripeKey,
        { apiVersion: '2024-12-18.acacia' }
      );

      const pi = await stripe.paymentIntents.retrieve(order.stripe_payment_intent_id);
      console.log('🔎 Stripe PI status:', pi.status);

      result['stripePaymentIntentStatus'] = pi.status;

      if (pi.status === 'succeeded') {
        const { error: updErr } = await supabase
          .from('orders')
          .update({
            payment_status: 'succeeded',
            status: order.status === 'payment_verification_failed' ? 'pending' : order.status,
          })
          .eq('id', orderId);

        if (updErr) throw new Error(`Failed updating order after Stripe verification: ${updErr.message}`);
        result['verifiedInStripe'] = true;
        result['updatedPaymentStatus'] = 'succeeded';
        result['updatedOrderStatus'] = order.status === 'payment_verification_failed' ? 'pending' : order.status;
      } else if (['processing', 'requires_action', 'requires_capture'].includes(pi.status)) {
        throw new Error(`Payment not finalized yet in Stripe (status: ${pi.status})`);
      } else {
        throw new Error(`Payment not successful in Stripe (status: ${pi.status})`);
      }
    } else {
      console.log('✅ Order already has payment_status = succeeded');
      result['verifiedInStripe'] = true;
    }

    // Optionally trigger order processing
    if (triggerProcessing) {
      console.log('🚀 Triggering ZMA processing after verification...');
      const { data: procData, error: procError } = await supabase.functions.invoke('process-zma-order', {
        body: { orderId, isTestMode: false, debugMode, retryAttempt: true },
      });
      if (procError) throw new Error(`ZMA processing failed: ${procError.message}`);
      result['processingTriggered'] = true;
      result['processingResult'] = procData ?? null;
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Verification and recovery completed', ...result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    );
  } catch (error) {
    console.error('❌ Verification/Recovery error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
    );
  }
});