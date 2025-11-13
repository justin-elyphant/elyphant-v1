import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PAYMENT-RECONCILIATION] ${step}${detailsStr}`);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    logStep("Payment reconciliation started")

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

    // Get recent orders with payment issues
    const { data: problemOrders, error: problemOrdersError } = await supabase
      .from('orders')
      .select('id, order_number, stripe_payment_intent_id, stripe_session_id, status, payment_status, created_at, total_amount')
      .in('status', ['pending', 'payment_verification_failed'])
      .not('stripe_payment_intent_id', 'is', null)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .limit(50)

    if (problemOrdersError) {
      throw new Error(`Failed to fetch problem orders: ${problemOrdersError.message}`)
    }

    logStep("Found orders to reconcile", { count: problemOrders?.length || 0 })

    let reconciledCount = 0
    let discrepanciesFound = 0
    const discrepancies = []

    // Process each order
    for (const order of problemOrders || []) {
      try {
        logStep("Reconciling order", { 
          orderId: order.id, 
          orderNumber: order.order_number,
          orderStatus: order.status,
          paymentStatus: order.payment_status
        })

        // Get payment intent from Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(order.stripe_payment_intent_id)
        
        logStep("Retrieved payment intent", { 
          orderId: order.id,
          stripeStatus: paymentIntent.status,
          stripeAmount: paymentIntent.amount,
          orderAmount: order.total_amount
        })

        // Check for discrepancies
        const expectedAmount = Math.round(order.total_amount * 100) // Convert to cents
        const hasAmountDiscrepancy = paymentIntent.amount !== expectedAmount
        const hasStatusDiscrepancy = 
          (paymentIntent.status === 'succeeded' && order.payment_status !== 'succeeded') ||
          (paymentIntent.status === 'canceled' && order.status !== 'cancelled')

        if (hasAmountDiscrepancy || hasStatusDiscrepancy) {
          discrepanciesFound++
          const discrepancy = {
            order_id: order.id,
            order_number: order.order_number,
            stripe_payment_intent_id: order.stripe_payment_intent_id,
            amount_discrepancy: hasAmountDiscrepancy,
            status_discrepancy: hasStatusDiscrepancy,
            order_amount: order.total_amount,
            stripe_amount: paymentIntent.amount / 100,
            order_status: order.status,
            order_payment_status: order.payment_status,
            stripe_status: paymentIntent.status,
            created_at: new Date().toISOString()
          }
          discrepancies.push(discrepancy)

          // Log to audit table
          await supabase
            .from('payment_verification_audit')
            .insert({
              order_id: order.id,
              stripe_session_id: order.stripe_session_id,
              stripe_payment_intent_id: order.stripe_payment_intent_id,
              verification_method: 'reconciliation_check',
              verification_status: 'discrepancy_found',
              error_details: discrepancy,
              metadata: {
                reconciliation_type: 'daily_check',
                discrepancy_types: [
                  ...(hasAmountDiscrepancy ? ['amount_mismatch'] : []),
                  ...(hasStatusDiscrepancy ? ['status_mismatch'] : [])
                ]
              }
            })

          logStep("Discrepancy found", discrepancy)
        }

        // Auto-correct successful payments
        if (paymentIntent.status === 'succeeded' && order.payment_status !== 'succeeded') {
          logStep("Auto-correcting successful payment", { orderId: order.id })

          const { error: updateError } = await supabase
            .from('orders')
            .update({
              status: 'processing',
              payment_status: 'succeeded',
              updated_at: new Date().toISOString()
            })
            .eq('id', order.id)

          if (updateError) {
            throw new Error(`Failed to update order ${order.id}: ${updateError.message}`)
          }

          // Log successful reconciliation
          await supabase
            .from('payment_verification_audit')
            .insert({
              order_id: order.id,
              stripe_session_id: order.stripe_session_id,
              stripe_payment_intent_id: order.stripe_payment_intent_id,
              verification_method: 'reconciliation_auto_correct',
              verification_status: 'success',
              metadata: {
                previous_status: order.status,
                previous_payment_status: order.payment_status,
                corrected_at: new Date().toISOString()
              }
            })

          // Trigger ZMA processing if needed
          try {
            await supabase.functions.invoke('process-zma-order', {
              body: {
                orderId: order.id,
                isTestMode: false,
                debugMode: false
              }
            })
            logStep("ZMA processing triggered for reconciled order", { orderId: order.id })
          } catch (zmaError) {
            logStep("ZMA processing failed for reconciled order", { orderId: order.id, error: zmaError })
          }

          reconciledCount++
        }

      } catch (orderError) {
        logStep("Error reconciling order", { 
          orderId: order.id, 
           error: (orderError instanceof Error ? orderError.message : String(orderError)) 
        })

        // Log failed reconciliation
        await supabase
          .from('payment_verification_audit')
          .insert({
            order_id: order.id,
            stripe_payment_intent_id: order.stripe_payment_intent_id,
            verification_method: 'reconciliation_check',
            verification_status: 'error',
            error_details: { error: (orderError instanceof Error ? orderError.message : String(orderError)) },
            metadata: {
              error_type: 'reconciliation_failure',
              attempted_at: new Date().toISOString()
            }
          })
      }
    }

    const summary = {
      orders_checked: problemOrders?.length || 0,
      orders_reconciled: reconciledCount,
      discrepancies_found: discrepanciesFound,
      discrepancies: discrepancies,
      execution_time: new Date().toISOString()
    }

    logStep("Payment reconciliation completed", summary)

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
    logStep("ERROR in payment reconciliation", { message: (error instanceof Error ? error.message : String(error)) })
    return new Response(
      JSON.stringify({ 
        success: false,
        error: (error instanceof Error ? error.message : String(error)) 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})