import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

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
    const { paymentMethodId, paymentIntentId } = await req.json();
    
    console.log('🔗 [attach-payment-method] Attaching payment method:', paymentMethodId, 'to payment intent:', paymentIntentId);
    
    if (!paymentMethodId || !paymentIntentId) {
      throw new Error('Payment method ID and payment intent ID are required');
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Get the payment intent to find the customer
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (!paymentIntent.customer) {
      throw new Error('Payment intent has no customer associated');
    }

    const customerId = typeof paymentIntent.customer === 'string' 
      ? paymentIntent.customer 
      : paymentIntent.customer.id;

    console.log('👤 [attach-payment-method] Customer ID:', customerId);

    // Check if payment method is already attached to this customer
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    
    if (paymentMethod.customer === customerId) {
      console.log('✅ [attach-payment-method] Payment method already attached to customer');
      return new Response(JSON.stringify({
        success: true,
        message: 'Payment method already attached',
        customerId
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // Attach the payment method to the customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
    
    console.log('✅ [attach-payment-method] Payment method attached successfully');

    return new Response(JSON.stringify({
      success: true,
      message: 'Payment method attached successfully',
      customerId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error: any) {
    console.error('❌ [attach-payment-method] Error:', error.message);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
