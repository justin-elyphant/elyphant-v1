
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { amount, currency = 'usd', metadata = {} } = await req.json()
    
    console.log('🔵 Creating payment intent:', {
      amount: amount,
      currency: currency,
      metadata: metadata,
      timestamp: new Date().toISOString()
    })

    const stripe = (await import('https://esm.sh/stripe@14.21.0')).default(
      Deno.env.get('STRIPE_SECRET_KEY') || '',
      { apiVersion: '2023-10-16' }
    )

    // Check if we should use an existing payment method
    const useExistingPaymentMethod = metadata.useExistingPaymentMethod;
    const paymentMethodId = metadata.paymentMethodId;

    let paymentIntentData: any = {
      amount: Math.round(amount),
      currency: currency,
      metadata: {
        ...metadata,
        created_source: 'create-payment-intent-function',
        created_at: new Date().toISOString()
      }
    };

    if (useExistingPaymentMethod && paymentMethodId) {
      // Use existing payment method
      paymentIntentData.payment_method = paymentMethodId;
      paymentIntentData.confirmation_method = 'manual';
      paymentIntentData.confirm = true;
    } else {
      // Allow new payment method
      paymentIntentData.automatic_payment_methods = {
        enabled: true,
      };
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

    console.log('✅ Payment intent created successfully:', {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      status: paymentIntent.status,
      client_secret: paymentIntent.client_secret ? 'present' : 'missing',
      payment_method: paymentIntent.payment_method || 'none'
    })

    return new Response(
      JSON.stringify({ 
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        status: paymentIntent.status
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('❌ Error creating payment intent:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    })
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
