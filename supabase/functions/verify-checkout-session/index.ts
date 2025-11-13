
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
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
      console.log(`[VERIFY-CHECKOUT] Payment successful for session: ${session_id}`)
      
      // Enhanced verification audit logging
      const auditEntry: any = {
        stripe_session_id: session_id,
        stripe_payment_intent_id: session.payment_intent,
        verification_method: 'session_id_primary',
        verification_status: 'attempting',
        verification_attempts: 1,
        metadata: {
          session_payment_status: session.payment_status,
          session_amount: session.amount_total,
          timestamp: new Date().toISOString()
        }
      }

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
        
        // Log verification failure
        await supabase
          .from('payment_verification_audit')
          .insert({
            ...auditEntry,
            verification_status: 'failed',
            error_details: { error: updateError.message }
          })
        
        throw new Error('Failed to update order status')
      }

      // Log successful verification
      if (order) {
        auditEntry.order_id = order.id
        auditEntry.verification_status = 'success'
        
        await supabase
          .from('payment_verification_audit')
          .insert(auditEntry)
      }

      // Conditional ZMA order processing after successful payment
      if (order) {
        try {
          // Enhanced package-level scheduling logic
          const currentDate = new Date()
          let shouldSchedule = false
          let earliestDeliveryDate = null
          let latestDeliveryDate = null
          
          // Check Stripe metadata for scheduled delivery date first
          const sessionScheduledDate = session.metadata?.scheduled_delivery_date || session.metadata?.scheduledDeliveryDate
          console.log(`[VERIFY-CHECKOUT] Stripe session metadata:`, {
            scheduled_delivery_date: sessionScheduledDate,
            all_metadata: session.metadata
          })
          
          // Check package-level scheduling from delivery groups metadata
          try {
            const deliveryGroupsMetadata = session.metadata?.delivery_groups ? JSON.parse(session.metadata.delivery_groups) : {}
            console.log(`[VERIFY-CHECKOUT] Checking delivery groups for scheduling:`, deliveryGroupsMetadata)
            
            const scheduledDates = Object.values(deliveryGroupsMetadata)
              .map((group: any) => group.scheduledDeliveryDate)
              .filter(date => date)
              .map(date => new Date(date))
            
            if (scheduledDates.length > 0) {
              earliestDeliveryDate = new Date(Math.min(...scheduledDates.map(d => d.getTime())))
              latestDeliveryDate = new Date(Math.max(...scheduledDates.map(d => d.getTime())))
              
              // Check if ANY package is scheduled more than 4 days away
              const daysDifference = Math.ceil((earliestDeliveryDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
              shouldSchedule = daysDifference > 4
              
              console.log(`[VERIFY-CHECKOUT] Package scheduling analysis:`, {
                packageCount: Object.keys(deliveryGroupsMetadata).length,
                scheduledPackages: scheduledDates.length,
                earliestDelivery: earliestDeliveryDate.toISOString().split('T')[0],
                latestDelivery: latestDeliveryDate.toISOString().split('T')[0],
                daysTillEarliest: daysDifference,
                shouldSchedule
              })
            }
          } catch (e) {
            console.warn(`[VERIFY-CHECKOUT] Failed to parse delivery groups metadata:`, e)
          }
          
          // Check session metadata for scheduled delivery date
          if (!shouldSchedule && sessionScheduledDate) {
            const scheduledDate = new Date(sessionScheduledDate)
            const daysDifference = Math.ceil((scheduledDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
            shouldSchedule = daysDifference > 4
            earliestDeliveryDate = scheduledDate
            
            console.log(`[VERIFY-CHECKOUT] Session metadata scheduling check:`, {
              session_scheduled_date: sessionScheduledDate,
              days_until_delivery: daysDifference,
              should_schedule: shouldSchedule
            })
          }
          
          // Fallback to order-level scheduled delivery date
          if (!shouldSchedule && order.scheduled_delivery_date) {
            const scheduledDate = new Date(order.scheduled_delivery_date)
            const daysDifference = Math.ceil((scheduledDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
            shouldSchedule = daysDifference > 4
            earliestDeliveryDate = scheduledDate
            
            console.log(`[VERIFY-CHECKOUT] Order-level scheduling check:`, {
              scheduled_delivery_date: order.scheduled_delivery_date,
              days_until_delivery: daysDifference,
              should_schedule: shouldSchedule
            })
          }

          if (shouldSchedule && earliestDeliveryDate) {
            // Schedule for later processing - set status to 'scheduled'
            const daysTillEarliest = Math.ceil((earliestDeliveryDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
            console.log(`📅 [VERIFY-CHECKOUT] Order ${order.id} has packages scheduled for delivery in ${daysTillEarliest} days - marking as scheduled`)
            
            const updateData = {
              status: 'scheduled',
              scheduled_delivery_date: order.scheduled_delivery_date || earliestDeliveryDate.toISOString().split('T')[0],
              package_scheduling_metadata: session.metadata?.delivery_groups || null,
              updated_at: new Date().toISOString()
            }
            
            const { error: scheduleError } = await supabase
              .from('orders')
              .update(updateData)
              .eq('id', order.id)

            if (scheduleError) {
              console.error('Failed to update order to scheduled status:', scheduleError)
              // Fall through to immediate processing if scheduling fails
            } else {
              console.log(`✅ [VERIFY-CHECKOUT] Order ${order.id} successfully scheduled for future processing`)
              // Successfully scheduled - don't process now
              return new Response(
                JSON.stringify({ 
                  success: true,
                  order_number: order?.order_number,
                  payment_status: session.payment_status,
                  scheduled: true,
                  processing_date: new Date(earliestDeliveryDate.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  packageCount: Object.keys(JSON.parse(session.metadata?.delivery_groups || '{}')).length
                }),
                { 
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                  status: 200,
                },
              )
            }
          }

          // Process immediately (no scheduled date OR scheduled date <= 4 days away OR scheduling failed)
          console.log(`🚀 [VERIFY-CHECKOUT] Processing order ${order.id} immediately`)
          
          // Call process-zma-order function with enhanced package-level data
          const { data: zincResult, error: zincError } = await supabase.functions.invoke('process-zma-order', {
            body: {
              orderId: order.id,
              isTestMode: false,
              debugMode: false,
              scheduledDeliveryDate: order.scheduled_delivery_date,
              packageSchedulingData: session.metadata?.delivery_groups || null,
              hasMultiplePackages: Object.keys(JSON.parse(session.metadata?.delivery_groups || '{}')).length > 1
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
  } catch (error: any) {
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
