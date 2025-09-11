import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🔄 Processing retry-pending orders...');

  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.45.0');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find orders that are ready for retry
    const { data: retryOrders, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'retry_pending')
      .lte('next_retry_at', new Date().toISOString())
      .lt('retry_count', 3) // Maximum 3 retries
      .order('created_at', { ascending: true })
      .limit(10); // Process max 10 orders per run

    if (fetchError) {
      console.error('❌ Error fetching retry orders:', fetchError);
      throw new Error(`Failed to fetch retry orders: ${fetchError.message}`);
    }

    if (!retryOrders || retryOrders.length === 0) {
      console.log('✅ No orders need retry processing');
      return new Response(JSON.stringify({
        success: true,
        message: 'No orders need retry processing',
        processedCount: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    console.log(`🔄 Found ${retryOrders.length} orders ready for retry`);

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const order of retryOrders) {
      try {
        console.log(`🔄 Processing retry for order ${order.id} (attempt ${order.retry_count + 1})`);

        // CRITICAL SAFETY CHECK: Skip orders that already have a successful zinc_order_id
        if (order.zinc_order_id && order.zinc_status !== 'failed') {
          console.log(`⚠️ Order ${order.id} already has zinc_order_id ${order.zinc_order_id} with status ${order.zinc_status} - checking actual status before retry`);
          
          // Check the actual status with Zinc API if possible
          // For now, mark as processing to stop retries and let manual verification handle it
          await supabase
            .from('orders')
            .update({
              status: 'processing',
              zinc_status: 'processing',
              updated_at: new Date().toISOString()
            })
            .eq('id', order.id);
          
          console.log(`✅ Order ${order.id} marked as processing to stop duplicate retries`);
          successCount++;
          results.push({
            orderId: order.id,
            success: true,
            message: 'Stopped duplicate retry - order already has zinc_order_id',
            zinc_order_id: order.zinc_order_id
          });
          continue;
        }

        // SAFETY GUARD: Only allow ZMA processing (zinc_api disabled)
        let orderMethod = order.order_method || 'zma';
        
        // Block and convert any zinc_api orders to ZMA
        if (orderMethod === 'zinc_api') {
          console.log(`🔄 Converting order ${order.id} from zinc_api to ZMA`);
          await supabase
            .from('orders')
            .update({ order_method: 'zma' })
            .eq('id', order.id);
          orderMethod = 'zma';
        }
        
        const functionName = 'process-zma-order';  // Only use ZMA processing
        console.log(`🔄 Using ${functionName} for order ${order.id} (zinc_api disabled)`);

        // Retry the order processing
        const { data, error } = await supabase.functions.invoke(functionName, {
          body: {
            orderId: order.id,
            isTestMode: false,
            debugMode: false,
            retryAttempt: true
          }
        });

        if (error) {
          console.error(`❌ Retry failed for order ${order.id}:`, error);
          
          // Check if we've exceeded max retries
          const newRetryCount = (order.retry_count || 0) + 1;
          if (newRetryCount >= 3) {
            console.log(`❌ Max retries exceeded for order ${order.id}, marking as failed`);
            
            // Mark as permanently failed
            await supabase
              .from('orders')
              .update({
                status: 'failed',
                zinc_status: 'max_retries_exceeded',
                updated_at: new Date().toISOString()
              })
              .eq('id', order.id);

            // If this was an auto-gift execution, reset it
            const { data: execution } = await supabase
              .from('automated_gift_executions')
              .select('id')
              .eq('order_id', order.id)
              .maybeSingle();

            if (execution) {
              await supabase
                .from('automated_gift_executions')
                .update({
                  status: 'failed',
                  error_message: 'Max retry attempts exceeded. Please try again manually.',
                  updated_at: new Date().toISOString()
                })
                .eq('id', execution.id);
            }
          } else {
            // Schedule next retry with exponential backoff
            const delays = [3600, 14400, 43200]; // 1hr, 4hr, 12hr
            const nextRetryDelay = delays[newRetryCount - 1] || 43200;
            
            await supabase
              .from('orders')
              .update({
                retry_count: newRetryCount,
                next_retry_at: new Date(Date.now() + (nextRetryDelay * 1000)).toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', order.id);

            console.log(`⏰ Scheduled next retry for order ${order.id} in ${nextRetryDelay / 3600} hours`);
          }

          failureCount++;
          results.push({
            orderId: order.id,
            success: false,
            error: error.message || 'Unknown error',
            attempt: newRetryCount
          });
        } else if (data.success) {
          console.log(`✅ Retry successful for order ${order.id}`);
          successCount++;
          results.push({
            orderId: order.id,
            success: true,
            zincRequestId: data.zincRequestId,
            attempt: (order.retry_count || 0) + 1
          });
        } else {
          // Processing function returned but indicated failure
          console.error(`❌ Retry processing failed for order ${order.id}:`, data.error);
          
          // Handle according to retry logic (similar to error case above)
          const newRetryCount = (order.retry_count || 0) + 1;
          if (newRetryCount >= 3) {
            await supabase
              .from('orders')
              .update({
                status: 'failed',
                zinc_status: 'max_retries_exceeded',
                updated_at: new Date().toISOString()
              })
              .eq('id', order.id);
          } else {
            const delays = [3600, 14400, 43200];
            const nextRetryDelay = delays[newRetryCount - 1] || 43200;
            
            await supabase
              .from('orders')
              .update({
                retry_count: newRetryCount,
                next_retry_at: new Date(Date.now() + (nextRetryDelay * 1000)).toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', order.id);
          }

          failureCount++;
          results.push({
            orderId: order.id,
            success: false,
            error: data.error || 'Processing function failed',
            attempt: newRetryCount
          });
        }

        // Add delay between orders to avoid overwhelming systems
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (orderError) {
        console.error(`❌ Unexpected error processing order ${order.id}:`, orderError);
        failureCount++;
        results.push({
          orderId: order.id,
          success: false,
          error: orderError.message || 'Unexpected error',
          attempt: (order.retry_count || 0) + 1
        });
      }
    }

    console.log(`🏁 Retry processing complete: ${successCount} successful, ${failureCount} failed`);

    return new Response(JSON.stringify({
      success: true,
      message: `Processed ${retryOrders.length} retry orders`,
      processedCount: retryOrders.length,
      successCount,
      failureCount,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('🚨 Retry processing error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});