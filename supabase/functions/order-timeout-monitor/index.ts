import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('⏰ Order Timeout Monitor - Preventing Stuck Orders');
  
  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.45.0');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find orders stuck in processing for more than 1 hour (specifically those waiting for Zinc webhook)
    const { data: stuckOrders, error: fetchError } = await supabase
      .from('orders')
      .select('id, order_number, status, created_at, updated_at, retry_count, zinc_status')
      .eq('status', 'processing')
      .eq('zinc_status', 'submitted')
      .lt('updated_at', new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString())
      .order('updated_at', { ascending: true });

    if (fetchError) {
      console.error('❌ Error fetching stuck orders:', fetchError);
      throw new Error(`Failed to fetch stuck orders: ${fetchError.message}`);
    }

    if (!stuckOrders || stuckOrders.length === 0) {
      console.log('✅ No stuck orders found - system healthy');
      return new Response(JSON.stringify({
        success: true,
        message: 'No stuck orders found',
        healthStatus: 'healthy',
        checkedAt: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    console.log(`🔧 Found ${stuckOrders.length} stuck orders, moving to retry_pending`);

    const results = [];
    let fixedCount = 0;
    let failedCount = 0;

    for (const order of stuckOrders) {
      try {
        // Determine next retry time based on retry count
        const retryCount = order.retry_count || 0;
        const delays = [1800, 3600, 14400]; // 30min, 1hr, 4hr
        const delaySeconds = delays[retryCount] || 43200; // Default to 12hr
        
        const nextRetryAt = new Date(Date.now() + (delaySeconds * 1000));

        // Update order to retry_pending
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            status: 'retry_pending',
            next_retry_at: nextRetryAt.toISOString(),
            updated_at: new Date().toISOString(),
            retry_reason: 'timeout_recovery'
          })
          .eq('id', order.id);

        if (updateError) {
          console.error(`❌ Failed to update order ${order.id}:`, updateError);
          failedCount++;
          results.push({
            orderId: order.id,
            orderNumber: order.order_number,
            success: false,
            error: updateError.message
          });
        } else {
          console.log(`✅ Fixed stuck order ${order.order_number} (${order.id})`);
          fixedCount++;
          results.push({
            orderId: order.id,
            orderNumber: order.order_number,
            success: true,
            nextRetryAt: nextRetryAt.toISOString()
          });
        }

        // Add small delay between operations
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (orderError) {
        console.error(`❌ Error processing order ${order.id}:`, orderError);
        failedCount++;
        results.push({
          orderId: order.id,
          orderNumber: order.order_number,
          success: false,
          error: (orderError instanceof Error ? orderError.message : String(orderError))
        });
      }
    }

    // Create alert if we found stuck orders
    if (fixedCount > 0) {
      await supabase
        .from('admin_audit_log')
        .insert({
          admin_user_id: '00000000-0000-0000-0000-000000000000',
          action_type: 'timeout_recovery',
          target_type: 'order_batch',
          target_id: '00000000-0000-0000-0000-000000000000',
          action_details: {
            message: `Recovered ${fixedCount} stuck orders`,
            fixedCount,
            failedCount,
            timestamp: new Date().toISOString(),
            stuckOrders: results
          }
        });
    }

    console.log(`🏁 Timeout monitoring complete: ${fixedCount} fixed, ${failedCount} failed`);

    return new Response(JSON.stringify({
      success: true,
      message: `Timeout monitoring complete`,
      healthStatus: fixedCount > 0 ? 'recovered' : 'healthy',
      fixedCount,
      failedCount,
      totalChecked: stuckOrders.length,
      results,
      checkedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('🚨 Timeout monitor error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: (error instanceof Error ? error.message : String(error)),
      healthStatus: 'error',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});