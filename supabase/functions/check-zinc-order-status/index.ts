import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🔍 Checking Zinc order status...');

  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.45.0');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    // Support both singular and plural parameter names
    const { zincOrderId, orderIds, singleOrderId } = body;
    
    // Normalize to array
    let orderIdsToCheck: string[] = [];
    if (zincOrderId) {
      orderIdsToCheck = [zincOrderId];
    } else if (singleOrderId) {
      orderIdsToCheck = [singleOrderId];
    } else if (orderIds && Array.isArray(orderIds)) {
      orderIdsToCheck = orderIds.filter(id => id); // Filter out null/undefined
    }

    if (orderIdsToCheck.length === 0) {
      console.log('⚠️ No valid Zinc order IDs provided, skipping check');
      return new Response(JSON.stringify({
        success: true,
        message: 'No orders to check',
        results: [],
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    console.log(`🔍 Checking status for ${orderIdsToCheck.length} Zinc order(s):`, orderIdsToCheck);

    // Get ZMA credentials
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
    const results = await Promise.allSettled(
      orderIdsToCheck.map(async (zincOrderId) => {
        try {
          console.log(`📦 Checking Zinc order: ${zincOrderId}`);
          
          // Check status with Zinc API
          const zincResponse = await fetch(`https://api.zinc.io/v1/orders/${zincOrderId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Basic ${btoa(zmaAccount.api_key + ':')}`
            }
          });

          const zincResult = await zincResponse.json();

          if (!zincResponse.ok) {
            throw new Error(`Zinc API error: ${zincResult.message || 'Unknown error'}`);
          }

          // Derive order status from Zinc response
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
              const latestUpdate = statusUpdates[statusUpdates.length - 1];
              
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

          // Update our database with enhanced data
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
            .eq('zinc_order_id', zincOrderId);

          if (updateError) {
            console.error(`Failed to update order ${zincOrderId}:`, updateError);
            throw updateError;
          }

          console.log(`✅ Updated order ${zincOrderId} with status: ${derivedStatus}`);

          return {
            zincOrderId,
            success: true,
            updated: true,
            derivedStatus,
            zincStatus: derivedZincStatus
          };

        } catch (orderError) {
          console.error(`❌ Failed to process order ${zincOrderId}:`, orderError);
          return {
            zincOrderId,
            success: false,
            updated: false,
            error: orderError instanceof Error ? orderError.message : 'Unknown error'
          };
        }
      })
    );

    // Format results
    const processedResults = results.map(result => 
      result.status === 'fulfilled' ? result.value : { 
        success: false, 
        error: result.reason?.message || 'Processing failed' 
      }
    );

    const successCount = processedResults.filter(r => r.success).length;
    console.log(`✅ Processed ${successCount}/${orderIdsToCheck.length} orders successfully`);

    return new Response(JSON.stringify({
      success: true,
      processed: orderIdsToCheck.length,
      successful: successCount,
      results: processedResults,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('🚨 Error checking Zinc status:', error);
    
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