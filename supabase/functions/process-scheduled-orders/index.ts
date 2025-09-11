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
    console.log('🕘 [process-scheduled-orders] Daily scheduled order processing started')

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Calculate the processing cutoff date (4 days from now for Amazon 2-day shipping)
    const processingCutoffDate = new Date()
    processingCutoffDate.setDate(processingCutoffDate.getDate() + 4)
    const cutoffDateString = processingCutoffDate.toISOString().split('T')[0] // YYYY-MM-DD format

    console.log(`📅 Processing orders scheduled for delivery on or before: ${cutoffDateString}`)

    // Find orders with status 'scheduled' that are ready for processing
    const { data: ordersToProcess, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        scheduled_delivery_date,
        user_id,
        total_amount,
        payment_status
      `)
      .eq('status', 'scheduled')
      .lte('scheduled_delivery_date', cutoffDateString)
      .order('scheduled_delivery_date', { ascending: true })

    if (ordersError) {
      console.error('❌ Error fetching scheduled orders:', ordersError)
      throw new Error('Failed to fetch scheduled orders')
    }

    if (!ordersToProcess || ordersToProcess.length === 0) {
      console.log('✅ No scheduled orders ready for processing')
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'No scheduled orders ready for processing',
          ordersProcessed: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    console.log(`📦 Found ${ordersToProcess.length} scheduled orders ready for processing`)

    const results = []
    let successCount = 0
    let failureCount = 0

    // Process each order
    for (const order of ordersToProcess) {
      try {
        console.log(`🔄 Processing scheduled order: ${order.order_number} (${order.id})`)
        console.log(`   Scheduled delivery: ${order.scheduled_delivery_date}`)

        // Verify payment status before processing
        if (order.payment_status !== 'succeeded') {
          console.warn(`⚠️ Skipping order ${order.order_number} - payment not succeeded: ${order.payment_status}`)
          results.push({
            orderId: order.id,
            orderNumber: order.order_number,
            success: false,
            error: 'Payment not confirmed',
            skipped: true
          })
          continue
        }

        // Update order status to processing before calling ZMA
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            status: 'processing',
            updated_at: new Date().toISOString()
          })
          .eq('id', order.id)

        if (updateError) {
          console.error(`❌ Failed to update order ${order.order_number} status:`, updateError)
          results.push({
            orderId: order.id,
            orderNumber: order.order_number,
            success: false,
            error: 'Failed to update order status'
          })
          failureCount++
          continue
        }

        // Call process-zma-order function to handle the actual order placement
        console.log(`🚀 Invoking process-zma-order for scheduled order ${order.id}`)
        
        const { data: zmaResult, error: zmaError } = await supabase.functions.invoke('process-zma-order', {
          body: {
            orderId: order.id,
            isTestMode: false,
            debugMode: false,
            scheduledProcessing: true // Flag to indicate this is scheduled processing
          }
        })

        if (zmaError) {
          console.error(`❌ ZMA processing failed for order ${order.order_number}:`, zmaError)
          
          // Revert order status back to scheduled on failure
          await supabase
            .from('orders')
            .update({
              status: 'scheduled',
              retry_count: (order.retry_count || 0) + 1,
              retry_reason: `Scheduled processing failed: ${zmaError.message}`,
              next_retry_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // Retry in 1 hour
              updated_at: new Date().toISOString()
            })
            .eq('id', order.id)

          results.push({
            orderId: order.id,
            orderNumber: order.order_number,
            success: false,
            error: zmaError.message
          })
          failureCount++
        } else {
          console.log(`✅ Successfully processed scheduled order ${order.order_number}`)
          
          results.push({
            orderId: order.id,
            orderNumber: order.order_number,
            success: true,
            zmaResult: zmaResult
          })
          successCount++
        }

        // Add small delay between orders to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 2000)) // 2 second delay

      } catch (orderError) {
        console.error(`❌ Unexpected error processing order ${order.order_number}:`, orderError)
        
        results.push({
          orderId: order.id,
          orderNumber: order.order_number,
          success: false,
          error: orderError.message
        })
        failureCount++
      }
    }

    console.log(`📊 Scheduled order processing complete:`)
    console.log(`   ✅ Success: ${successCount}`)
    console.log(`   ❌ Failures: ${failureCount}`)
    console.log(`   📦 Total: ${ordersToProcess.length}`)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Processed ${ordersToProcess.length} scheduled orders`,
        ordersProcessed: ordersToProcess.length,
        successCount,
        failureCount,
        results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Error in process-scheduled-orders function:', error)
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