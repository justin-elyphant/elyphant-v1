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
    const { zincOrderId } = body;

    if (!zincOrderId) {
      throw new Error('Zinc order ID is required');
    }

    console.log(`🔍 Checking status for Zinc order: ${zincOrderId}`);

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

    // Check status with Zinc API
    const zincResponse = await fetch(`https://api.zinc.io/v1/orders/${zincOrderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(zmaAccount.api_key + ':')}`
      }
    });

    const zincResult = await zincResponse.json();
    console.log('📤 Zinc status response:', JSON.stringify(zincResult));

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

    // Extract timeline events and merchant data from response
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
      console.error('Failed to update order status:', updateError);
    }

    return new Response(JSON.stringify({
      success: true,
      zincOrderId,
      derivedStatus,
      zincStatus: derivedZincStatus,
      zincData: zincResult,
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