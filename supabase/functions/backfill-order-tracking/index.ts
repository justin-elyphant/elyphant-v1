import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  "https://dmkxtkvlispxeqfzlczr.supabase.co",
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ""
);

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();

    if (!orderId) {
      throw new Error('orderId is required');
    }

    // Get the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    // For order 02d50698-a385-460f-9ca8-fbcee438ff72, manually add tracking data
    const trackingData = [{
      obtained_at: "2025-10-18T22:18:12.347Z",
      product_id: "B071DNYSPB",
      retailer_tracking_number: "TBA325220021401",
      delivery_proof_image: "https://objects.zincapi.com/amazon_9e04c3b0cb34fca76493320e_114-7002872-2487404_delivery_proof.jpg",
      tracking_number: "ZPYAA0063515698YQ",
      carrier: "ZNLOGIC",
      product_ids: ["B071DNYSPB"],
      merchant_order_id: "114-7002872-2487404",
      delivery_status: "Delivered",
      zinc_tracking_number: "ZPYAA0063515698YQ",
      tracking_url: "https://t.17track.net/en#nums=ZPYAA0063515698YQ",
      retailer_tracking_url: "https://www.amazon.com/gp/your-account/ship-track?itemId=jkmlrqoomolpxsp&orderId=114-7002872-2487404&shipmentId=PtKkkDRVN&packageIndex=0&ref_=ppx_hzod_shipconns_dt_b_track_package_0"
    }];

    // Update merchant_tracking_data
    const existingTracking = order.merchant_tracking_data || {};
    const updatedTracking = {
      ...existingTracking,
      tracking: trackingData,
      last_update: new Date().toISOString()
    };

    // Add tracking timeline event
    const existingTimeline = order.zinc_timeline_events || [];
    const trackingEvent = {
      id: `tracking_${trackingData[0].tracking_number}_${trackingData[0].obtained_at}`,
      type: 'tracking.obtained',
      title: 'Tracking Number Obtained',
      description: `Tracking available: ${trackingData[0].tracking_number} via ${trackingData[0].carrier}`,
      timestamp: trackingData[0].obtained_at,
      status: trackingData[0].delivery_status === 'Delivered' ? 'completed' : 'in_progress',
      data: {
        tracking_number: trackingData[0].tracking_number,
        carrier: trackingData[0].carrier,
        tracking_url: trackingData[0].tracking_url,
        retailer_tracking_url: trackingData[0].retailer_tracking_url,
        delivery_status: trackingData[0].delivery_status,
        product_id: trackingData[0].product_id
      },
      source: 'zinc'
    };

    const updatedTimeline = [...existingTimeline, trackingEvent];

    // Update the order
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        tracking_number: trackingData[0].tracking_number,
        merchant_tracking_data: updatedTracking,
        zinc_timeline_events: updatedTimeline,
        status: 'delivered',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      throw updateError;
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Order tracking data backfilled successfully',
      orderId: orderId,
      tracking_number: trackingData[0].tracking_number
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    console.error('Backfill error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
