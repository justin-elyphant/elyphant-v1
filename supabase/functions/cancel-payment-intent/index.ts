// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { payment_intent_id, reason = 'abandoned' } = await req.json()
    
    if (!payment_intent_id) {
      throw new Error('Payment intent ID is required')
    }

    console.log('🔴 Cancelling unused payment intent:', {
      payment_intent_id,
      reason,
      timestamp: new Date().toISOString()
    })

    const stripe = (await import('https://esm.sh/stripe@14.21.0')).default(
      Deno.env.get('STRIPE_SECRET_KEY') || '',
      { apiVersion: '2023-10-16' }
    )

    // First check the current status
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id)
    
    console.log('💡 Current payment intent status:', {
      id: payment_intent_id,
      status: paymentIntent.status,
      amount: paymentIntent.amount
    })

    // Only cancel if it's in a cancellable state
    if (paymentIntent.status === 'requires_payment_method' || 
        paymentIntent.status === 'requires_confirmation' ||
        paymentIntent.status === 'requires_action') {
      
      const cancelledIntent = await stripe.paymentIntents.cancel(payment_intent_id)
      
      console.log('✅ Payment intent cancelled successfully:', {
        id: cancelledIntent.id,
        status: cancelledIntent.status,
        cancellation_reason: cancelledIntent.cancellation_reason
      })

      return new Response(
        JSON.stringify({ 
          success: true,
          payment_intent_id: cancelledIntent.id,
          status: cancelledIntent.status,
          message: 'Payment intent cancelled successfully'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    } else {
      console.log('⚠️ Payment intent cannot be cancelled:', {
        id: payment_intent_id,
        status: paymentIntent.status,
        reason: 'Intent is not in a cancellable state'
      })

      return new Response(
        JSON.stringify({ 
          success: false,
          payment_intent_id: payment_intent_id,
          status: paymentIntent.status,
          message: `Payment intent cannot be cancelled - status: ${paymentIntent.status}`
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }
  } catch (error) {
    console.error('❌ Error cancelling payment intent:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    })
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})