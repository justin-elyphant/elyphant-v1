
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { payment_intent_id, session_id } = await req.json()

    const stripe = (await import('https://esm.sh/stripe@14.21.0')).default(
      Deno.env.get('STRIPE_SECRET_KEY') || '',
      { apiVersion: '2023-10-16' }
    )

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let paymentStatus = 'pending'
    let orderStatus = 'pending'

    if (payment_intent_id) {
      // Retrieve the payment intent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id)
      
      if (paymentIntent.status === 'succeeded') {
        paymentStatus = 'completed'
        orderStatus = 'payment_confirmed'
      } else if (paymentIntent.status === 'payment_failed') {
        paymentStatus = 'failed'
        orderStatus = 'payment_failed'
      }
    } else if (session_id) {
      // Retrieve the checkout session from Stripe
      const session = await stripe.checkout.sessions.retrieve(session_id)
      
      if (session.payment_status === 'paid') {
        paymentStatus = 'completed'
        orderStatus = 'payment_confirmed'
      } else if (session.payment_status === 'failed') {
        paymentStatus = 'failed'
        orderStatus = 'payment_failed'
      }
    }

    // Update order status based on payment status
    const updateData: any = {
      payment_status: paymentStatus,
      status: orderStatus,
      updated_at: new Date().toISOString()
    }

    if (payment_intent_id) {
      updateData.stripe_payment_intent_id = payment_intent_id
    }

    const { data: order, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq(session_id ? 'stripe_session_id' : 'stripe_payment_intent_id', session_id || payment_intent_id)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Failed to update order: ${updateError.message}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        payment_status: paymentStatus,
        order_status: orderStatus,
        order: order
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error confirming payment:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
