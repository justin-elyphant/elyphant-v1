// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🧹 Duplicate Order Cleanup - Enhanced Prevention System');
  
  try {
    // Create Supabase client
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.45.0');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    const { mode = 'report', cancelDuplicates = false } = body;

    console.log(`🔍 Running in ${mode} mode, cancelDuplicates: ${cancelDuplicates}`);

    // Step 1: Find orders with duplicate zinc_order_ids
    const { data: duplicateOrders, error: duplicateError } = await supabase
      .from('orders')
      .select('id, zinc_order_id, status, created_at, user_id, total_amount')
      .not('zinc_order_id', 'is', null)
      .order('created_at', { ascending: true });

    if (duplicateError) {
      throw new Error(`Failed to fetch orders: ${duplicateError.message}`);
    }

    // Group by zinc_order_id to find duplicates
    const zincOrderGroups = new Map();
    duplicateOrders?.forEach(order => {
      if (!zincOrderGroups.has(order.zinc_order_id)) {
        zincOrderGroups.set(order.zinc_order_id, []);
      }
      zincOrderGroups.get(order.zinc_order_id).push(order);
    });

    // Find actual duplicates (groups with more than 1 order)
    const duplicateGroups = Array.from(zincOrderGroups.entries())
      .filter(([zincId, orders]) => orders.length > 1);

    console.log(`📊 Found ${duplicateGroups.length} zinc_order_ids with duplicates`);

    const results = {
      totalDuplicateGroups: duplicateGroups.length,
      duplicateOrdersFound: 0,
      duplicateOrdersCancelled: 0,
      duplicateDetails: [] as any[],
      cleanupActions: [] as any[]
    };

    // Step 2: Process each duplicate group
    for (const [zincId, orders] of duplicateGroups) {
      console.log(`🔍 Processing duplicate group: ${zincId} (${orders.length} orders)`);
      
      // Sort by creation date to keep the first (original) order
      orders.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      const originalOrder = orders[0];
      const duplicateOrders = orders.slice(1);
      
      results.duplicateOrdersFound += duplicateOrders.length;
      
      const groupDetail = {
        zinc_order_id: zincId,
        original_order: {
          id: originalOrder.id,
          created_at: originalOrder.created_at,
          status: originalOrder.status
        },
        duplicate_orders: duplicateOrders.map((order: any) => ({
          id: order.id,
          created_at: order.created_at,
          status: order.status,
          user_id: order.user_id,
          total_amount: order.total_amount
        }))
      };
      
      results.duplicateDetails.push(groupDetail);

      // Step 3: Cancel duplicates if requested and in cleanup mode
      if (mode === 'cleanup' && cancelDuplicates) {
        for (const duplicateOrder of duplicateOrders) {
          try {
            // Only cancel if the order is in a cancellable state
            if (['pending', 'processing', 'retry_pending'].includes(duplicateOrder.status)) {
              console.log(`🚫 Cancelling duplicate order: ${duplicateOrder.id}`);
              
              // Cancel the Zinc order via API if needed
              let zincCancelled = false;
              try {
                // Get ZMA credentials for cancellation
                const { data: zmaAccount } = await supabase
                  .from('zma_accounts')
                  .select('*')
                  .eq('is_default', true)
                  .eq('account_status', 'active')
                  .limit(1)
                  .single();

                if (zmaAccount) {
                  const zincResponse = await fetch(`https://api.zinc.io/v1/orders/${zincId}/cancel`, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Basic ${btoa(zmaAccount.api_key + ':')}`
                    }
                  });

                  if (zincResponse.ok) {
                    zincCancelled = true;
                    console.log(`✅ Cancelled Zinc order: ${zincId}`);
                  } else {
                    console.warn(`⚠️ Failed to cancel Zinc order: ${zincId}`);
                  }
                }
              } catch (zincError) {
                console.warn(`⚠️ Zinc cancellation error for ${zincId}:`, zincError instanceof Error ? zincError.message : 'Unknown error');
              }

              // Update order status in database
              const { error: updateError } = await supabase
                .from('orders')
                .update({
                  status: 'cancelled',
                  zinc_status: zincCancelled ? 'cancelled' : 'cancellation_attempted',
                  updated_at: new Date().toISOString(),
                  cancellation_reason: 'Duplicate order cleanup'
                })
                .eq('id', duplicateOrder.id);

              if (updateError) {
                console.error(`❌ Failed to update duplicate order ${duplicateOrder.id}:`, updateError);
              } else {
                results.duplicateOrdersCancelled++;
                results.cleanupActions.push({
                  action: 'cancelled',
                  order_id: duplicateOrder.id,
                  zinc_order_id: zincId,
                  zinc_cancelled: zincCancelled
                });
              }

              // Add order note for audit trail
              await supabase
                .from('order_notes')
                .insert({
                  order_id: duplicateOrder.id,
                  note_content: `Order cancelled as duplicate. Original order: ${originalOrder.id}. Zinc cancellation: ${zincCancelled ? 'successful' : 'attempted'}`,
                  note_type: 'system_cleanup',
                  is_internal: true,
                  admin_user_id: null
                });

            } else {
              console.log(`⏭️ Skipping duplicate order ${duplicateOrder.id} - status: ${duplicateOrder.status}`);
              results.cleanupActions.push({
                action: 'skipped',
                order_id: duplicateOrder.id,
                zinc_order_id: zincId,
                reason: `Status ${duplicateOrder.status} not cancellable`
              });
            }
          } catch (error) {
            console.error(`❌ Error processing duplicate order ${duplicateOrder.id}:`, error);
            results.cleanupActions.push({
              action: 'error',
              order_id: duplicateOrder.id,
              zinc_order_id: zincId,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      }
    }

    // Step 4: Clean up expired request fingerprints
    console.log('🧹 Cleaning up expired request fingerprints...');
    const { data: cleanupCount } = await supabase
      .rpc('cleanup_expired_fingerprints');
    
    results.cleanupActions.push({
      action: 'fingerprint_cleanup',
      expired_fingerprints_removed: cleanupCount || 0
    });

    // Step 5: Generate summary
    const summary = {
      timestamp: new Date().toISOString(),
      mode,
      cancelDuplicates,
      ...results
    };

    console.log('✅ Duplicate cleanup completed:', summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('🚨 Duplicate cleanup error:', error);
    
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
