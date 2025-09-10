
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
    const { session_id } = await req.json()

    const stripe = (await import('https://esm.sh/stripe@14.21.0')).default(
      Deno.env.get('STRIPE_SECRET_KEY') || '',
      { apiVersion: '2023-10-16' }
    )

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id)

    if (session.payment_status === 'paid') {
      // Update order status in database - try matching by session_id first, then by payment_intent_id
      let { data: order, error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'processing',
          payment_status: 'succeeded',
          stripe_payment_intent_id: session.payment_intent,
          stripe_session_id: session_id,
          updated_at: new Date().toISOString()
        })
        .eq('stripe_session_id', session_id)
        .select('id, order_number, shipping_info, gift_message, is_gift, scheduled_delivery_date, is_surprise_gift')
        .single()

      // If no order found by session_id, try by payment_intent_id
      if (updateError && updateError.message.includes('No rows') && session.payment_intent) {
        console.log('No order found by session_id, trying payment_intent_id:', session.payment_intent)
        const { data: orderByIntent, error: intentError } = await supabase
          .from('orders')
          .update({
            status: 'processing',
            payment_status: 'succeeded',
            stripe_session_id: session_id,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_payment_intent_id', session.payment_intent)
          .select('id, order_number, shipping_info, gift_message, is_gift, scheduled_delivery_date, is_surprise_gift')
          .single()
        
        order = orderByIntent
        updateError = intentError
      }

      if (updateError && !updateError.message.includes('No rows')) {
        console.error('Error updating order:', updateError)
        throw new Error('Failed to update order status')
      }

      // Trigger ZMA order processing after successful payment
      if (order) {
        try {
          // Call process-zma-order function (zinc_api disabled)
          const { data: zincResult, error: zincError } = await supabase.functions.invoke('process-zma-order', {
            body: {
              orderId: order.id,
              isTestMode: false,
              debugMode: false
            }
          })

          if (zincError) {
            console.error('Zinc processing failed:', zincError)
            // Don't fail the payment verification, just log the error
          } else {
            console.log('Zinc processing initiated successfully for order:', order.id, 'Result:', zincResult)
          }
        } catch (zincError) {
          console.error('Error initiating Zinc processing:', zincError)
          // Don't fail the payment verification, just log the error
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          order_number: order?.order_number,
          payment_status: session.payment_status
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    } else {
      return new Response(
        JSON.stringify({ 
          success: false,
          payment_status: session.payment_status,
          error: 'Payment not completed'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }
  } catch (error) {
    console.error('Error verifying checkout session:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
