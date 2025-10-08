import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ZincWebhookPayload {
  request_id: string;
  status_updates: Array<{
    _created_at: string;
    type: string;
    message: string;
    data: any;
  }>;
  merchant_order_ids?: Array<{
    merchant: string;
    merchant_order_id: string;
    tracking_url?: string;
    shipping_address?: string;
    placed_at?: string;
  }>;
  delivery_dates?: Array<{
    date: string;
    delivery_date: string;
    products: Array<{
      product_id: string;
      quantity: number;
    }>;
  }>;
}

const supabase = createClient(
  "https://dmkxtkvlispxeqfzlczr.supabase.co",
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ""
);

function mapZincStatusToOrderStatus(zincStatusType: string): string {
  const statusMap: Record<string, string> = {
    'request.placed': 'pending',
    'request.finished': 'processing',
    'shipment.shipped': 'shipped',
    'shipment.delivered': 'delivered',
    'request.failed': 'failed',
    'request.cancelled': 'cancelled'
  };
  
  return statusMap[zincStatusType] || 'processing';
}

function createTimelineEvents(statusUpdates: any[], merchantOrderIds: any[] = []): any[] {
  const events = statusUpdates.map(update => ({
    id: `zinc_${update.type}_${update._created_at}`,
    type: update.type,
    title: getEventTitle(update.type),
    description: update.message,
    timestamp: update._created_at,
    status: 'completed',
    data: update.data,
    source: 'zinc'
  }));

  // Add merchant tracking info if available
  if (merchantOrderIds.length > 0) {
    merchantOrderIds.forEach(merchant => {
      if (merchant.tracking_url) {
        events.push({
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
  }

  return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

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

async function updateOrderWithZincData(payload: ZincWebhookPayload) {
  console.log(`Processing webhook for request_id: ${payload.request_id}`);
  
  // Find the order by zinc request_id
  const { data: order, error: findError } = await supabase
    .from('orders')
    .select('*')
    .eq('zinc_order_id', payload.request_id)
    .single();

  if (findError || !order) {
    console.error('Order not found for request_id:', payload.request_id, findError);
    return { success: false, error: 'Order not found' };
  }

  // Get the latest status update to determine current order status
  const latestUpdate = payload.status_updates[payload.status_updates.length - 1];
  const newStatus = mapZincStatusToOrderStatus(latestUpdate.type);
  
  // Check if this is an error response (request.failed or internal_error)
  const isErrorResponse = latestUpdate.type === 'request.failed' || 
                          (payload as any).code === 'internal_error';
  
  // Create timeline events from status updates
  const timelineEvents = createTimelineEvents(
    payload.status_updates, 
    payload.merchant_order_ids
  );

  // Prepare merchant tracking data
  const merchantTracking = {
    merchant_order_ids: payload.merchant_order_ids || [],
    delivery_dates: payload.delivery_dates || [],
    last_update: new Date().toISOString()
  };

  // Prepare update object - handle error responses differently
  const updateData: any = {
    zinc_status: latestUpdate.type,
    zinc_timeline_events: timelineEvents,
    merchant_tracking_data: merchantTracking,
    last_zinc_update: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // If error response, check if it's retryable
  if (isErrorResponse) {
    const errorCode = (payload as any).code || 'unknown_error';
    const errorMessage = (payload as any).message || latestUpdate.message;
    
    // Store full error data
    updateData.zinc_error_data = {
      code: errorCode,
      message: errorMessage,
      data: (payload as any).data,
      timestamp: new Date().toISOString()
    };

    // Check if internal_error (retryable system error)
    if (errorCode === 'internal_error') {
      console.log('⚠️ Internal error detected - marking for retry');
      updateData.status = 'retry_pending';
      updateData.next_retry_at = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours
      updateData.retry_count = (order.retry_count || 0);
    } else {
      // Other errors - mark as failed
      updateData.status = 'failed';
    }
  } else {
    // Normal status update
    updateData.status = newStatus;
  }

  // Update the order with new data
  const { data: updatedOrder, error: updateError } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', order.id)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating order:', updateError);
    return { success: false, error: updateError.message };
  }

  console.log(`Order ${order.id} updated successfully with status: ${newStatus}`);

  // Trigger notification if status changed significantly
  if (newStatus !== order.status && ['shipped', 'delivered'].includes(newStatus)) {
    await triggerOrderNotification(updatedOrder, newStatus, latestUpdate);
  }

  return { success: true, order: updatedOrder };
}

async function triggerOrderNotification(order: any, newStatus: string, statusUpdate: any) {
  try {
    // Call the existing email orchestrator for order status notifications
    const { error } = await supabase.functions.invoke('ecommerce-email-orchestrator', {
      body: {
        eventType: 'order_status_update',
        orderId: order.id,
        newStatus: newStatus,
        statusData: statusUpdate.data
      }
    });

    if (error) {
      console.error('Error sending notification:', error);
    } else {
      console.log(`Notification sent for order ${order.id} status change to ${newStatus}`);
    }
  } catch (error) {
    console.error('Error triggering notification:', error);
  }
}

serve(async (req: Request) => {
  console.log(`Zinc webhook received: ${req.method} ${req.url}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract and validate security token from URL params
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const orderId = url.searchParams.get('orderId');

    if (!token || !orderId) {
      console.error('Missing security token or orderId in webhook URL');
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required security parameters'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Validate the webhook token
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('webhook_token, id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order not found for webhook validation:', orderId);
      return new Response(JSON.stringify({
        success: false,
        error: 'Order not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    if (order.webhook_token !== token) {
      console.error('Invalid webhook token for order:', orderId);
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid security token'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    console.log('✅ Webhook security validation passed for order:', orderId);

    const payload: ZincWebhookPayload = await req.json();
    console.log('Webhook payload:', JSON.stringify(payload, null, 2));

    // Validate payload has required fields
    if (!payload.request_id || !payload.status_updates) {
      throw new Error('Missing required fields: request_id or status_updates');
    }

    const result = await updateOrderWithZincData(payload);

    // Log successful webhook processing
    if (result.success) {
      console.log(`✅ Successfully processed webhook for order ${orderId} with ${payload.status_updates.length} status updates`);
    }

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Zinc webhook error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
});