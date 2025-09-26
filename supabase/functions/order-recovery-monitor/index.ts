import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ORDER-RECOVERY-MONITOR] ${step}${detailsStr}`);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    logStep("Order recovery monitor started")

    // Create Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    const stripe = (await import('https://esm.sh/stripe@14.21.0')).default(
      Deno.env.get('STRIPE_SECRET_KEY') || '',
      { apiVersion: '2023-10-16' }
    )

    // Phase 1: Find stuck orders with payment_verification_failed
    const { data: stuckOrders, error: stuckOrdersError } = await supabase
      .from('orders')
      .select('id, order_number, stripe_payment_intent_id, stripe_session_id, created_at, updated_at')
      .eq('status', 'payment_verification_failed')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .limit(20)

    if (stuckOrdersError) {
      throw new Error(`Failed to fetch stuck orders: ${stuckOrdersError.message}`)
    }

    logStep("Found stuck orders", { count: stuckOrders?.length || 0 })

    let recoveredCount = 0
    let skippedCount = 0

    // Process each stuck order
    for (const order of stuckOrders || []) {
      try {
        logStep("Processing stuck order", { 
          orderId: order.id, 
          orderNumber: order.order_number,
          paymentIntentId: order.stripe_payment_intent_id 
        })

        // Skip if no payment intent ID
        if (!order.stripe_payment_intent_id) {
          logStep("Skipping order without payment intent", { orderId: order.id })
          skippedCount++
          continue
        }

        // Check payment status with Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(order.stripe_payment_intent_id)
        
        logStep("Retrieved payment intent", { 
          orderId: order.id,
          paymentStatus: paymentIntent.status,
          amount: paymentIntent.amount
        })

        // If payment succeeded on Stripe, recover the order
        if (paymentIntent.status === 'succeeded') {
          logStep("Payment succeeded, attempting recovery", { orderId: order.id })

          // Update order status to processing
          const { error: updateError } = await supabase
            .from('orders')
            .update({
              status: 'processing',
              payment_status: 'succeeded',
              stripe_session_id: order.stripe_session_id || `recovered_${Date.now()}`,
              updated_at: new Date().toISOString()
            })
            .eq('id', order.id)

          if (updateError) {
            throw new Error(`Failed to update order ${order.id}: ${updateError.message}`)
          }

          // Log the recovery
          await supabase
            .from('order_recovery_logs')
            .insert({
              order_id: order.id,
              recovery_type: 'payment_verification_recovery',
              recovery_status: 'completed',
              metadata: {
                original_status: 'payment_verification_failed',
                stripe_payment_intent_id: order.stripe_payment_intent_id,
                stripe_amount: paymentIntent.amount,
                recovery_timestamp: new Date().toISOString()
              }
            })

          // Trigger ZMA processing
          try {
            const { data: zmaResult, error: zmaError } = await supabase.functions.invoke('process-zma-order', {
              body: {
                orderId: order.id,
                isTestMode: false,
                debugMode: false
              }
            })

            if (zmaError) {
              logStep("ZMA processing failed", { orderId: order.id, error: zmaError })
              // Log but don't fail the recovery
              await supabase
                .from('order_recovery_logs')
                .insert({
                  order_id: order.id,
                  recovery_type: 'zma_processing_failure',
                  recovery_status: 'failed',
                  error_message: zmaError.message,
                  metadata: { zma_error: zmaError }
                })
            } else {
              logStep("ZMA processing initiated successfully", { orderId: order.id, result: zmaResult })
            }
          } catch (zmaProcessingError) {
            logStep("Error initiating ZMA processing", { orderId: order.id, error: zmaProcessingError })
          }

          recoveredCount++
          logStep("Order recovered successfully", { orderId: order.id })

        } else {
          logStep("Payment not succeeded, skipping", { 
            orderId: order.id, 
            paymentStatus: paymentIntent.status 
          })
          skippedCount++
        }

      } catch (orderError) {
        logStep("Error processing order", { 
          orderId: order.id, 
          error: orderError instanceof Error ? orderError.message : 'Unknown error' 
        })

        // Log the failed recovery attempt
        await supabase
          .from('order_recovery_logs')
          .insert({
            order_id: order.id,
            recovery_type: 'payment_verification_recovery',
            recovery_status: 'failed',
            error_message: orderError instanceof Error ? orderError.message : 'Unknown error',
            metadata: {
              error_details: orderError instanceof Error ? orderError.message : 'Unknown error',
              attempted_at: new Date().toISOString()
            }
          })
      }
    }

    // Phase 2: Check for orders that should have triggered ZMA but didn't
    const { data: processingOrders, error: processingOrdersError } = await supabase
      .from('orders')
      .select('id, order_number, created_at, updated_at')
      .eq('status', 'processing')
      .eq('payment_status', 'succeeded')
      .is('zinc_order_id', null)
      .gte('created_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()) // Last 2 hours
      .limit(10)

    if (!processingOrdersError && processingOrders && processingOrders.length > 0) {
      logStep("Found orders missing ZMA processing", { count: processingOrders.length })

      for (const order of processingOrders) {
        try {
          logStep("Triggering ZMA for missing order", { orderId: order.id })

          const { data: zmaResult, error: zmaError } = await supabase.functions.invoke('process-zma-order', {
            body: {
              orderId: order.id,
              isTestMode: false,
              debugMode: false
            }
          })

          if (zmaError) {
            logStep("ZMA processing failed for missing order", { orderId: order.id, error: zmaError })
          } else {
            logStep("ZMA processing initiated for missing order", { orderId: order.id })
          }
        } catch (error) {
          logStep("Error triggering ZMA for missing order", { orderId: order.id, error: error.message })
        }
      }
    }

    const summary = {
      stuck_orders_found: stuckOrders?.length || 0,
      orders_recovered: recoveredCount,
      orders_skipped: skippedCount,
      processing_orders_found: processingOrders?.length || 0,
      execution_time: new Date().toISOString()
    }

    logStep("Recovery monitor completed", summary)

    return new Response(
      JSON.stringify({ 
        success: true,
        summary
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    logStep("ERROR in recovery monitor", { message: error.message })
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})