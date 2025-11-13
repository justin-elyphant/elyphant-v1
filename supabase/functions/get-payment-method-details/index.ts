import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { paymentMethodId } = await req.json();
    
    console.log('💳 [get-payment-method-details] Received ID:', paymentMethodId);
    
    if (!paymentMethodId) {
      throw new Error('Payment method ID is required');
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    let paymentMethod;
    
    // Handle both PaymentIntent IDs (pi_) and PaymentMethod IDs (pm_)
    if (paymentMethodId.startsWith('pi_')) {
      console.log('🔄 [get-payment-method-details] Received PaymentIntent ID, retrieving PaymentMethod...');
      
      // First, get the PaymentIntent to extract the PaymentMethod ID
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentMethodId);
      
      if (!paymentIntent.payment_method) {
        throw new Error('PaymentIntent does not have an attached payment method');
      }
      
      const pmId = typeof paymentIntent.payment_method === 'string' 
        ? paymentIntent.payment_method 
        : paymentIntent.payment_method.id;
      
      console.log('🔍 [get-payment-method-details] Found PaymentMethod ID:', pmId);
      paymentMethod = await stripe.paymentMethods.retrieve(pmId);
      
    } else if (paymentMethodId.startsWith('pm_')) {
      console.log('✅ [get-payment-method-details] Received PaymentMethod ID directly');
      paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
      
    } else {
      throw new Error(`Invalid ID format. Expected pm_ or pi_ prefix, received: ${paymentMethodId}`);
    }
    
    console.log('✅ [get-payment-method-details] Payment method retrieved successfully');

    return new Response(JSON.stringify({
      success: true,
      data: paymentMethod
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('❌ [get-payment-method-details] Error:', errorMessage);
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
