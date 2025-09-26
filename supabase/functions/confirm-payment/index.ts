
// @ts-nocheck
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
    const requestBody = await req.json()
    const { payment_intent_id, session_id } = requestBody

    // Enhanced input validation
    if (!payment_intent_id && !session_id) {
      throw new Error('Either payment_intent_id or session_id is required')
    }

    // Validate ID formats if provided
    if (payment_intent_id && typeof payment_intent_id !== 'string') {
      throw new Error('Invalid payment_intent_id format')
    }
    
    if (session_id && typeof session_id !== 'string') {
      throw new Error('Invalid session_id format')
    }

    console.log('💳 Processing payment confirmation:', {
      hasPaymentIntent: !!payment_intent_id,
      hasSession: !!session_id,
      paymentIntentId: payment_intent_id ? payment_intent_id.substring(0, 20) + '...' : null,
      sessionId: session_id ? session_id.substring(0, 20) + '...' : null
    })

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

    // Enhanced Stripe payment verification with better error handling
    try {
      if (payment_intent_id) {
        console.log('🔍 Retrieving payment intent from Stripe...')
        const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id)
        
        console.log(`💳 Payment intent status: ${paymentIntent.status}`)
        
        if (paymentIntent.status === 'succeeded') {
          paymentStatus = 'succeeded'
          orderStatus = 'payment_confirmed'
        } else if (paymentIntent.status === 'payment_failed' || paymentIntent.status === 'canceled') {
          paymentStatus = 'failed'
          orderStatus = 'payment_failed'
        } else {
          console.log(`⏳ Payment intent in intermediate status: ${paymentIntent.status}`)
          paymentStatus = 'pending'
          orderStatus = 'pending'
        }
      } else if (session_id) {
        console.log('🔍 Retrieving checkout session from Stripe...')
        const session = await stripe.checkout.sessions.retrieve(session_id)
        
        console.log(`💳 Session payment status: ${session.payment_status}`)
        
        if (session.payment_status === 'paid') {
          paymentStatus = 'succeeded'
          orderStatus = 'payment_confirmed'
        } else if (session.payment_status === 'failed') {
          paymentStatus = 'failed'
          orderStatus = 'payment_failed'
        } else {
          console.log(`⏳ Session in intermediate status: ${session.payment_status}`)
          paymentStatus = 'pending'
          orderStatus = 'pending'
        }
      }
    } catch (stripeError) {
      console.error('❌ Stripe API error:', stripeError)
      throw new Error(`Failed to verify payment with Stripe: ${stripeError.message}`)
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

    // Enhanced database update with better error handling and validation
    console.log('💾 Updating order in database...', {
      paymentStatus,
      orderStatus,
      updateField: session_id ? 'stripe_session_id' : 'stripe_payment_intent_id',
      updateValue: (session_id || payment_intent_id)?.substring(0, 20) + '...'
    })

    const { data: order, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq(session_id ? 'stripe_session_id' : 'stripe_payment_intent_id', session_id || payment_intent_id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Database update failed:', updateError)
      
      // If no order found, try alternative lookup methods
      if (updateError.message?.includes('No rows') || updateError.message?.includes('0 rows')) {
        console.log('🔍 No order found with primary identifier, attempting alternative lookup...')
        
        // Try to find order by user and recent timestamp
        const { data: recentOrders, error: lookupError } = await supabase
          .from('orders')
          .select('id, stripe_session_id, stripe_payment_intent_id, status, payment_status')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
          .order('created_at', { ascending: false })
          .limit(10)

        if (!lookupError && recentOrders?.length > 0) {
          console.log(`📋 Found ${recentOrders.length} recent orders for alternative matching`)
          
          const matchingOrder = recentOrders.find(o => 
            (session_id && o.stripe_session_id === session_id) ||
            (payment_intent_id && o.stripe_payment_intent_id === payment_intent_id)
          )

          if (matchingOrder) {
            console.log('✅ Found matching order via alternative lookup:', matchingOrder.id)
            
            const { data: updatedOrder, error: retryError } = await supabase
              .from('orders')
              .update(updateData)
              .eq('id', matchingOrder.id)
              .select()
              .single()

            if (retryError) {
              throw new Error(`Failed to update order after alternative lookup: ${retryError.message}`)
            }
            
            order = updatedOrder
          } else {
            throw new Error(`No matching order found for payment confirmation`)
          }
        } else {
          throw new Error(`Failed to update order: ${updateError.message}`)
        }
      } else {
        throw new Error(`Failed to update order: ${updateError.message}`)
      }
    }

    if (order) {
      console.log('✅ Order updated successfully:', {
        orderId: order.id,
        orderNumber: order.order_number,
        newStatus: order.status,
        paymentStatus: order.payment_status
      })
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
