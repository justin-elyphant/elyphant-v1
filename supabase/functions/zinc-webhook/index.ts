import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ZincWebhookPayload {
  _type: string;
  request_id: string;
  tracking?: Array<{
    tracking_number: string;
    retailer_tracking_number: string;
    carrier: string;
    delivery_status: string;
    tracking_url: string;
    retailer_tracking_url?: string;
    delivery_proof_image?: string;
    product_id: string;
    merchant_order_id: string;
    obtained_at: string;
  }>;
  merchant_order_ids?: Array<{
    merchant_order_id: string;
    tracking_url: string;
    placed_at: string;
  }>;
  price_components?: {
    total: number;
    subtotal: number;
    tax: number;
    shipping: number;
  };
  delivery_dates?: Array<{
    date: string;
    delivery_date: string;
  }>;
  request?: {
    client_notes?: {
      supabase_order_id: string;
      our_internal_order_id: string;
    };
  };
  code?: string;
  message?: string;
  data?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  );

  try {
    // Parse webhook payload
    const payload: ZincWebhookPayload = await req.json();
    const url = new URL(req.url);
    const webhookType = url.pathname.split('/').pop() || 'unknown';
    const orderId = url.searchParams.get('orderId');
    const token = url.searchParams.get('token');

    console.log('🔔 Zinc webhook received:', {
      type: webhookType,
      request_id: payload.request_id,
      order_id: orderId,
      payload_type: payload._type
    });

    // Extract order ID from payload
    const supabaseOrderId = payload.request?.client_notes?.supabase_order_id || orderId;

    if (!supabaseOrderId) {
      console.error('❌ No order ID found in webhook');
      return new Response(
        JSON.stringify({ received: true, error: 'No order ID provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Fetch existing order
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', supabaseOrderId)
      .single();

    if (fetchError || !order) {
      console.error('❌ Order not found:', supabaseOrderId, fetchError);
      return new Response(
        JSON.stringify({ received: true, error: 'Order not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Check for duplicate webhook (idempotency)
    const eventKey = `${payload.request_id}_${webhookType}_${Date.now()}`;
    const existingEvents = order.zinc_timeline_events || [];
    
    const isDuplicate = existingEvents.some((evt: any) => 
      evt.request_id === payload.request_id && 
      evt.event_type === webhookType &&
      Math.abs(new Date(evt.timestamp).getTime() - Date.now()) < 60000 // Within 1 minute
    );

    if (isDuplicate) {
      console.log('⚠️ Duplicate webhook detected, skipping');
      return new Response(
        JSON.stringify({ received: true, duplicate: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Prepare update based on webhook type
    let updateData: any = {
      updated_at: new Date().toISOString(),
      zinc_timeline_events: [
        ...existingEvents,
        {
          event_type: webhookType,
          request_id: payload.request_id,
          timestamp: new Date().toISOString(),
          payload: payload
        }
      ]
    };

    // Handle different webhook types
    switch (webhookType) {
      case 'request_succeeded':
        console.log('✅ Zinc order request succeeded');
        updateData.status = 'processing';
        updateData.zinc_status = 'submitted';
        
        if (payload.merchant_order_ids && payload.merchant_order_ids.length > 0) {
          updateData.zinc_order_id = payload.merchant_order_ids[0].merchant_order_id;
          console.log('🔖 Merchant order ID:', payload.merchant_order_ids[0].merchant_order_id);
        }
        
        if (payload.price_components) {
          updateData.total_amount = payload.price_components.total / 100;
          console.log('💰 Total amount:', updateData.total_amount);
        }
        break;

      case 'request_failed':
        console.error('❌ Zinc order request failed:', payload.message);
        updateData.status = 'failed';
        updateData.zinc_status = 'failed';
        updateData.zma_error = JSON.stringify({
          code: payload.code,
          message: payload.message,
          data: payload.data,
          timestamp: new Date().toISOString()
        });
        break;

      case 'tracking_obtained':
        console.log('📍 Tracking obtained');
        if (payload.tracking && payload.tracking.length > 0) {
          const trackingInfo = payload.tracking[0];
          updateData.tracking_number = trackingInfo.tracking_number;
          updateData.status = 'shipped';
          updateData.zinc_status = 'shipped';
          
          // Store full tracking details in merchant_tracking_data
          updateData.merchant_tracking_data = {
            tracking_number: trackingInfo.tracking_number,
            retailer_tracking_number: trackingInfo.retailer_tracking_number,
            carrier: trackingInfo.carrier,
            tracking_url: trackingInfo.tracking_url,
            retailer_tracking_url: trackingInfo.retailer_tracking_url,
            obtained_at: trackingInfo.obtained_at
          };
          
          console.log('🚚 Tracking:', trackingInfo.tracking_number);
        }
        break;

      case 'tracking_updated':
        console.log('🔄 Tracking updated');
        if (payload.tracking && payload.tracking.length > 0) {
          const trackingInfo = payload.tracking[0];
          
          // Check if delivered
          if (trackingInfo.delivery_status === 'Delivered') {
            updateData.status = 'delivered';
            updateData.zinc_status = 'delivered';
            
            // Update merchant tracking data with delivery proof
            updateData.merchant_tracking_data = {
              ...(order.merchant_tracking_data || {}),
              delivery_status: 'Delivered',
              delivery_proof_image: trackingInfo.delivery_proof_image,
              delivered_at: new Date().toISOString()
            };
            
            console.log('✅ Order delivered');
          } else {
            updateData.zinc_status = trackingInfo.delivery_status;
            console.log('📦 Delivery status:', trackingInfo.delivery_status);
          }
        }
        break;

      case 'status_updated':
        console.log('🔄 Status updated');
        if (payload.tracking && payload.tracking.length > 0) {
          const trackingInfo = payload.tracking[0];
          if (trackingInfo.delivery_status === 'Delivered') {
            updateData.status = 'delivered';
            updateData.zinc_status = 'delivered';
            
            // Update merchant tracking data with delivery proof
            updateData.merchant_tracking_data = {
              ...(order.merchant_tracking_data || {}),
              delivery_status: 'Delivered',
              delivery_proof_image: trackingInfo.delivery_proof_image,
              delivered_at: new Date().toISOString()
            };
            
            console.log('✅ Order delivered');
          }
        }
        break;

      default:
        console.log('⚠️ Unknown webhook type:', webhookType);
    }

    // Update order in database
    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', supabaseOrderId);

    if (updateError) {
      console.error('❌ Failed to update order:', updateError);
      console.error('Webhook details:', { order_id: supabaseOrderId, webhook_type: webhookType, request_id: payload.request_id });
      
      // Still return 200 to Zinc so they don't retry immediately
      return new Response(
        JSON.stringify({ received: true, error: updateError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log('✅ Order updated successfully:', supabaseOrderId);

    // Return 200 OK immediately (Zinc expects this)
    return new Response(
      JSON.stringify({ 
        received: true, 
        order_id: supabaseOrderId,
        webhook_type: webhookType,
        request_id: payload.request_id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('❌ Webhook processing error:', error);
    
    // Always return 200 to prevent Zinc from retrying
    return new Response(
      JSON.stringify({ 
        received: true, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  }
});
