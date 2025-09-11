import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🔍 Auditing orders for duplicates...');

  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.45.0');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find orders that are retry_pending but already have a zinc_order_id
    const { data: problematicOrders, error: fetchError } = await supabase
      .from('orders')
      .select('id, order_number, status, zinc_order_id, zinc_status, retry_count, created_at, updated_at')
      .eq('status', 'retry_pending')
      .not('zinc_order_id', 'is', null)
      .order('created_at', { ascending: false });

    if (fetchError) {
      throw new Error(`Failed to fetch orders: ${fetchError.message}`);
    }

    console.log(`🔍 Found ${problematicOrders?.length || 0} potentially problematic orders`);

    const auditResults = [];
    let fixedCount = 0;

    if (problematicOrders && problematicOrders.length > 0) {
      for (const order of problematicOrders) {
        console.log(`🔍 Auditing order ${order.order_number} (${order.id})`);
        
        const audit = {
          orderId: order.id,
          orderNumber: order.order_number,
          currentStatus: order.status,
          zincOrderId: order.zinc_order_id,
          zincStatus: order.zinc_status,
          retryCount: order.retry_count,
          issue: 'retry_pending_with_zinc_order_id',
          action: 'none'
        };

        // If order has zinc_order_id and is retry_pending, this is likely a duplicate retry scenario
        if (order.zinc_order_id && order.status === 'retry_pending') {
          console.log(`⚠️ Order ${order.order_number} has zinc_order_id ${order.zinc_order_id} but is retry_pending`);
          
          // Update to processing to stop retries
          const { error: updateError } = await supabase
            .from('orders')
            .update({
              status: 'processing',
              zinc_status: 'processing',
              updated_at: new Date().toISOString()
            })
            .eq('id', order.id);

          if (updateError) {
            console.error(`❌ Failed to update order ${order.id}:`, updateError);
            audit.action = 'failed_to_fix';
            audit.error = updateError.message;
          } else {
            console.log(`✅ Fixed order ${order.order_number} - updated to processing`);
            audit.action = 'fixed_status';
            fixedCount++;
          }
        }

        auditResults.push(audit);
      }
    }

    // Also check for orders with multiple zinc_order_ids (potential duplicates)
    const { data: duplicateZincIds, error: duplicateError } = await supabase
      .rpc('check_duplicate_zinc_orders');

    let duplicateResults = [];
    if (!duplicateError && duplicateZincIds) {
      duplicateResults = duplicateZincIds;
    }

    console.log(`✅ Audit complete: ${fixedCount} orders fixed`);

    return new Response(JSON.stringify({
      success: true,
      message: `Audit complete: ${fixedCount} orders fixed`,
      totalProblematicOrders: problematicOrders?.length || 0,
      fixedCount,
      auditResults,
      duplicateZincIds: duplicateResults,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('🚨 Audit error:', error);
    
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