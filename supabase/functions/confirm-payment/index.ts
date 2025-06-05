
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
    const { payment_intent_id, order_id } = await req.json()

    const stripe = (await import('https://esm.sh/stripe@14.21.0')).default(
      Deno.env.get('STRIPE_SECRET_KEY') || '',
      { apiVersion: '2023-10-16' }
    )

    // Retrieve the payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id)

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Update order status based on payment status
    let orderStatus = 'pending'
    let paymentStatus = 'pending'

    if (paymentIntent.status === 'succeeded') {
      orderStatus = 'confirmed'
      paymentStatus = 'completed'
    } else if (paymentIntent.status === 'payment_failed') {
      orderStatus = 'payment_failed'
      paymentStatus = 'failed'
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: orderStatus,
        payment_status: paymentStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', order_id)

    if (updateError) {
      throw new Error(`Failed to update order: ${updateError.message}`)
    }

    return new Response(
      JSON.stringify({ 
        status: paymentIntent.status,
        order_status: orderStatus,
        payment_status: paymentStatus
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
