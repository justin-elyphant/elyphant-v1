import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🔧 Manual Order Retry - Admin Tool');
  
  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.45.0');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { orderId, action } = await req.json();

    if (!orderId) {
      throw new Error('Order ID is required');
    }

    if (action === 'immediate_retry') {
      console.log(`🔄 Triggering immediate retry for order ${orderId}`);
      
      // Update order to retry_pending with immediate retry time
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'retry_pending',
          next_retry_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateError) {
        throw new Error(`Failed to update order: ${updateError.message}`);
      }

      // Trigger the retry processing function
      const { data: retryResult, error: retryError } = await supabase.functions.invoke('process-retry-pending-orders');

      if (retryError) {
        console.error('❌ Retry processing failed:', retryError);
        throw new Error(`Retry processing failed: ${retryError.message}`);
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Order retry triggered successfully',
        orderId,
        retryResult
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    if (action === 'fix_stuck_orders') {
      console.log('🔧 Fixing all stuck orders...');
      
      // Find and fix orders stuck in processing for more than 2 hours
      const { data: stuckOrders, error: fetchError } = await supabase
        .from('orders')
        .select('id, order_number, status, created_at, updated_at')
        .eq('status', 'processing')
        .lt('updated_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString());

      if (fetchError) {
        throw new Error(`Failed to fetch stuck orders: ${fetchError.message}`);
      }

      if (!stuckOrders || stuckOrders.length === 0) {
        return new Response(JSON.stringify({
          success: true,
          message: 'No stuck orders found',
          fixedCount: 0
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        });
      }

      // Update all stuck orders to retry_pending
      const orderIds = stuckOrders.map(order => order.id);
      const { error: bulkUpdateError } = await supabase
        .from('orders')
        .update({
          status: 'retry_pending',
          next_retry_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .in('id', orderIds);

      if (bulkUpdateError) {
        throw new Error(`Failed to update stuck orders: ${bulkUpdateError.message}`);
      }

      console.log(`✅ Fixed ${stuckOrders.length} stuck orders`);

      return new Response(JSON.stringify({
        success: true,
        message: `Fixed ${stuckOrders.length} stuck orders`,
        fixedCount: stuckOrders.length,
        fixedOrders: stuckOrders.map(o => ({ id: o.id, orderNumber: o.order_number }))
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    throw new Error('Invalid action. Use "immediate_retry" or "fix_stuck_orders"');

  } catch (error) {
    console.error('🚨 Manual retry error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});