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
    const { orderId } = await req.json()
    
    if (!orderId) {
      throw new Error('Order ID is required')
    }

    console.log(`🔄 [retry-failed-order] Retrying order: ${orderId}`)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderId}`)
    }

    console.log(`📦 Order status: ${order.status}, Payment: ${order.payment_status}`)

    // Check if order can be retried
    if (!['failed', 'cancelled', 'error'].includes(order.status)) {
      throw new Error(`Order ${orderId} cannot be retried. Current status: ${order.status}`)
    }

    // Reset order to processing status (keep zinc_order_id to prevent duplicate orders)
    const newRetryCount = (order.retry_count || 0) + 1;
    
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'processing',
        zinc_status: null,
        retry_count: newRetryCount,
        retry_reason: 'Manual retry requested',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    if (updateError) {
      throw new Error(`Failed to update order status: ${updateError.message}`)
    }

    // Retry processing with ZMA using unique idempotency key
    console.log(`🚀 Invoking process-zma-order for retry: ${orderId} (attempt ${newRetryCount})`)
    
    const { data: zmaResult, error: zmaError } = await supabase.functions.invoke('process-zma-order', {
      body: {
        orderId: orderId,
        isTestMode: false,
        debugMode: true,
        isRetryAttempt: true,
        retryReason: 'Manual retry',
        retryCount: newRetryCount,
        customIdempotencyKey: `${orderId}-retry-${newRetryCount}` // Unique key per retry
      }
    })

    if (zmaError) {
      console.error(`❌ ZMA retry failed:`, zmaError)
      
      // Update order back to failed with retry info
      await supabase
        .from('orders')
        .update({
          status: 'failed',
          retry_reason: `Retry failed: ${zmaError.message}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      throw new Error(`Retry failed: ${zmaError.message}`)
    }

    console.log(`✅ Order retry successful:`, zmaResult)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Order ${orderId} retry initiated successfully`,
        orderId: orderId,
        result: zmaResult
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Error in retry-failed-order function:', error)
    const message = error instanceof Error ? error.message : String(error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})