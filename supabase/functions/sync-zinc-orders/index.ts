import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('🔄 Starting Zinc order sync...');

  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.45.0');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json().catch(() => ({}));
    const { syncType = 'manual', triggeredBy = null } = body;

    // Create sync log entry
    const { data: syncLog, error: logError } = await supabase
      .from('zinc_sync_logs')
      .insert({
        sync_type: syncType,
        triggered_by: triggeredBy,
        status: 'running'
      })
      .select()
      .single();

    if (logError) {
      console.error('Failed to create sync log:', logError);
    }

    const syncLogId = syncLog?.id;

    // Find orders stuck in submitted_to_zinc or processing status for > 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    
    const { data: pendingOrders, error: queryError } = await supabase
      .from('orders')
      .select('id, zinc_order_id, order_number, created_at, status')
      .in('status', ['submitted_to_zinc', 'processing'])
      .lt('created_at', tenMinutesAgo)
      .not('zinc_order_id', 'is', null)
      .order('created_at', { ascending: true })
      .limit(50); // Process up to 50 orders per sync

    if (queryError) {
      throw new Error(`Failed to query pending orders: ${queryError.message}`);
    }

    if (!pendingOrders || pendingOrders.length === 0) {
      console.log('✅ No pending orders to sync');
      
      // Update sync log
      if (syncLogId) {
        await supabase
          .from('zinc_sync_logs')
          .update({
            status: 'completed',
            orders_checked: 0,
            orders_updated: 0,
            orders_failed: 0,
            execution_time_ms: Date.now() - startTime,
            metadata: { message: 'No pending orders found' }
          })
          .eq('id', syncLogId);
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'No pending orders to sync',
        ordersChecked: 0,
        ordersUpdated: 0,
        ordersFailed: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    console.log(`📦 Found ${pendingOrders.length} pending orders to sync`);

    let ordersUpdated = 0;
    let ordersFailed = 0;
    const failedOrders: any[] = [];

    // Get ZMA credentials once
    const { data: zmaAccount, error: credError } = await supabase
      .from('zma_accounts')
      .select('*')
      .eq('is_default', true)
      .eq('account_status', 'active')
      .limit(1)
      .single();

    if (credError || !zmaAccount) {
      throw new Error('No active default ZMA account found');
    }

    // Process each order
    for (const order of pendingOrders) {
      try {
        console.log(`🔍 Syncing order ${order.order_number} (${order.zinc_order_id})`);

        // Call Zinc API to get order status
        const zincResponse = await fetch(`https://api.zinc.io/v1/orders/${order.zinc_order_id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${btoa(zmaAccount.api_key + ':')}`
          }
        });

        const zincResult = await zincResponse.json();

        if (!zincResponse.ok) {
          throw new Error(`Zinc API error: ${zincResult.message || 'Unknown error'}`);
        }

        // Derive order status from Zinc response (no top-level status field)
        function deriveOrderStatus(zincData: any): { status: string; zincStatus: string } {
          // Check tracking for delivered status (most accurate)
          if (zincData.tracking && Array.isArray(zincData.tracking)) {
            const hasDelivered = zincData.tracking.some((t: any) => 
              t.delivery_status === 'Delivered' || t.delivery_status === 'delivered'
            );
            if (hasDelivered) {
              return { status: 'delivered', zincStatus: 'delivered' };
            }
          }

          // Check status_updates for latest event
          const statusUpdates = zincData.status_updates || [];
          if (statusUpdates.length > 0) {
            // Get most recent update
            const latestUpdate = statusUpdates[statusUpdates.length - 1];
            
            // Map event types to statuses
            if (latestUpdate.type === 'shipment.shipped') {
              return { status: 'shipped', zincStatus: 'shipped' };
            }
            if (latestUpdate.type === 'request.failed') {
              return { status: 'failed', zincStatus: 'failed' };
            }
            if (latestUpdate.type === 'request.cancelled') {
              return { status: 'cancelled', zincStatus: 'cancelled' };
            }
            if (latestUpdate.type === 'request.finished' && latestUpdate.data?.success) {
              return { status: 'processing', zincStatus: 'placed' };
            }
          }

          // Default fallback
          return { status: 'processing', zincStatus: 'unknown' };
        }

        // Helper function to get event titles
        function getEventTitle(statusType: string): string {
          const titleMap: Record<string, string> = {
            'request.placed': 'Order Placed',
            'request.finished': 'Order Processed',
            'shipment.shipped': 'Shipped',
            'shipment.delivered': 'Delivered',
            'request.failed': 'Order Failed',
            'request.cancelled': 'Order Cancelled',
            'tracking.available': 'Tracking Available'
          };
          return titleMap[statusType] || 'Order Update';
        }

        // Extract timeline events and merchant data
        const timelineEvents = zincResult.status_updates || [];
        const merchantOrderIds = zincResult.merchant_order_ids || [];
        
        // Create structured timeline events
        const structuredEvents = timelineEvents.map((update: any) => ({
          id: `zinc_${update.type}_${update._created_at}`,
          type: update.type,
          title: getEventTitle(update.type),
          description: update.message,
          timestamp: update._created_at,
          status: 'completed',
          data: update.data,
          source: 'zinc'
        }));

        // Add tracking events from merchant data
        merchantOrderIds.forEach((merchant: any) => {
          if (merchant.tracking_url) {
            structuredEvents.push({
              id: `tracking_${merchant.merchant_order_id}`,
              type: 'tracking.available',
              title: 'Tracking Available',
              description: `Tracking information available for ${merchant.merchant.toUpperCase()} order`,
              timestamp: merchant.placed_at || new Date().toISOString(),
              status: 'completed',
              data: {
                tracking_url: merchant.tracking_url,
                merchant_order_id: merchant.merchant_order_id,
                merchant: merchant.merchant
              },
              source: 'merchant'
            });
          }
        });

        // Sort events by timestamp
        const sortedEvents = structuredEvents.sort((a: any, b: any) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        // Prepare merchant tracking data
        const merchantTracking = {
          merchant_order_ids: merchantOrderIds,
          delivery_dates: zincResult.delivery_dates || [],
          last_update: new Date().toISOString()
        };

        // Derive correct status from Zinc data
        const { status: derivedStatus, zincStatus: derivedZincStatus } = deriveOrderStatus(zincResult);

        // Update order in database
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            zinc_status: derivedZincStatus,
            status: derivedStatus,
            zinc_timeline_events: sortedEvents,
            merchant_tracking_data: merchantTracking,
            last_zinc_update: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', order.id);

        if (updateError) {
          throw updateError;
        }

        ordersUpdated++;
        console.log(`✅ Updated order ${order.order_number}: ${derivedStatus} (zinc: ${derivedZincStatus})`);

      } catch (error) {
        ordersFailed++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ Failed to sync order ${order.order_number}:`, errorMsg);
        
        failedOrders.push({
          order_number: order.order_number,
          zinc_order_id: order.zinc_order_id,
          error: errorMsg
        });
      }

      // Add small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Update sync log with final results
    if (syncLogId) {
      await supabase
        .from('zinc_sync_logs')
        .update({
          status: ordersFailed === pendingOrders.length ? 'failed' : 'completed',
          orders_checked: pendingOrders.length,
          orders_updated: ordersUpdated,
          orders_failed: ordersFailed,
          execution_time_ms: Date.now() - startTime,
          metadata: {
            failed_orders: failedOrders,
            sync_completed_at: new Date().toISOString()
          }
        })
        .eq('id', syncLogId);
    }

    console.log(`✅ Sync completed: ${ordersUpdated} updated, ${ordersFailed} failed`);

    return new Response(JSON.stringify({
      success: true,
      ordersChecked: pendingOrders.length,
      ordersUpdated,
      ordersFailed,
      failedOrders,
      executionTimeMs: Date.now() - startTime
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('🚨 Sync failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
