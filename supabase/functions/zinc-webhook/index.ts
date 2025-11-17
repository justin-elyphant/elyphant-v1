import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ZincWebhookPayload {
  type: 'request_succeeded' | 'request_failed' | 'tracking_obtained' | 'tracking_updated' | 'status_updated' | 'case_updated';
  request_id: string;
  order_id?: string;
  merchant_order_id?: string;
  tracking?: {
    tracking_number: string;
    carrier: string;
    tracking_url?: string;
  };
  status?: string;
  case_details?: any;
  error?: {
    code: string;
    message: string;
    data?: any;
  };
  client_notes?: {
    order_id: string;
    order_number: string;
    user_id: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: ZincWebhookPayload = await req.json();
    
    console.log('🔔 Zinc webhook received:', {
      type: payload.type,
      request_id: payload.request_id,
      order_id: payload.order_id,
    });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // Extract our internal order ID from client_notes or find by zinc_request_id
    let internalOrderId = payload.client_notes?.order_id;
    
    if (!internalOrderId) {
      // Fallback: lookup by zinc_request_id
      const { data: order } = await supabase
        .from('orders')
        .select('id')
        .eq('zinc_request_id', payload.request_id)
        .single();
      
      internalOrderId = order?.id;
    }

    if (!internalOrderId) {
      console.error('❌ Could not find order for request_id:', payload.request_id);
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    console.log(`📦 Processing webhook for order: ${internalOrderId}`);

    // Handle different webhook types
    switch (payload.type) {
      case 'request_succeeded':
        console.log('✅ Zinc order succeeded');
        await handleRequestSucceeded(supabase, internalOrderId, payload);
        break;

      case 'request_failed':
        console.log('❌ Zinc order failed');
        await handleRequestFailed(supabase, internalOrderId, payload);
        break;

      case 'tracking_obtained':
      case 'tracking_updated':
        console.log('📮 Tracking info received');
        await handleTrackingUpdate(supabase, internalOrderId, payload);
        break;

      case 'status_updated':
        console.log('🔄 Status update received');
        await handleStatusUpdate(supabase, internalOrderId, payload);
        break;

      case 'case_updated':
        console.log('📋 Case update received (return/cancellation)');
        await handleCaseUpdate(supabase, internalOrderId, payload);
        break;

      default:
        console.log('⚠️ Unknown webhook type:', payload.type);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('❌ Zinc webhook error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function handleRequestSucceeded(supabase: any, orderId: string, payload: ZincWebhookPayload) {
  const { error } = await supabase
    .from('orders')
    .update({
      zinc_order_id: payload.merchant_order_id || payload.order_id,
      status: 'processing',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (error) {
    console.error('❌ Failed to update order on request_succeeded:', error);
  } else {
    console.log(`✅ Order ${orderId} marked as placed with Zinc order ID: ${payload.merchant_order_id || payload.order_id}`);
  }
}

async function handleRequestFailed(supabase: any, orderId: string, payload: ZincWebhookPayload) {
  const errorMessage = payload.error?.message || 'Unknown Zinc error';
  const errorCode = payload.error?.code;

  const { error } = await supabase
    .from('orders')
    .update({
      status: 'failed',
      notes: {
        zinc_error: {
          code: errorCode,
          message: errorMessage,
          data: payload.error?.data,
          timestamp: new Date().toISOString(),
        },
        funding_hold_reason: `Zinc ZMA error: ${errorCode} - ${errorMessage}`,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (error) {
    console.error('❌ Failed to update order on request_failed:', error);
  } else {
    console.log(`✅ Order ${orderId} marked as failed: ${errorMessage}`);
  }

  // Queue failure notification email
  try {
    const { data: order } = await supabase
      .from('orders')
      .select('customer_email, order_number, shipping_address')
      .eq('id', orderId)
      .single();

    if (order?.customer_email || order?.shipping_address?.email) {
      await supabase.from('email_queue').insert({
        recipient_email: order.customer_email || order.shipping_address.email,
        event_type: 'order_failed',
        template_variables: {
          order_number: order.order_number,
          error_message: errorMessage,
        },
        priority: 'high',
        scheduled_for: new Date().toISOString(),
        status: 'pending',
      });
    }
  } catch (emailErr) {
    console.error('⚠️ Failed to queue failure email:', emailErr);
  }
}

async function handleTrackingUpdate(supabase: any, orderId: string, payload: ZincWebhookPayload) {
  if (!payload.tracking) {
    console.log('⚠️ Tracking update received but no tracking data in payload');
    return;
  }

  const { error } = await supabase
    .from('orders')
    .update({
      tracking_number: payload.tracking.tracking_number,
      status: 'shipped',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (error) {
    console.error('❌ Failed to update tracking:', error);
  } else {
    console.log(`✅ Tracking updated for order ${orderId}: ${payload.tracking.tracking_number}`);
  }

  // Queue shipping notification email
  try {
    const { data: order } = await supabase
      .from('orders')
      .select('customer_email, order_number, shipping_address')
      .eq('id', orderId)
      .single();

    if (order?.customer_email || order?.shipping_address?.email) {
      await supabase.from('email_queue').insert({
        recipient_email: order.customer_email || order.shipping_address.email,
        event_type: 'order_shipped',
        template_variables: {
          order_number: order.order_number,
          tracking_number: payload.tracking.tracking_number,
          carrier: payload.tracking.carrier,
          tracking_url: payload.tracking.tracking_url,
        },
        priority: 'normal',
        scheduled_for: new Date().toISOString(),
        status: 'pending',
      });
    }
  } catch (emailErr) {
    console.error('⚠️ Failed to queue shipping email:', emailErr);
  }
}

async function handleStatusUpdate(supabase: any, orderId: string, payload: ZincWebhookPayload) {
  const statusMap: Record<string, string> = {
    'placed': 'processing',
    'shipped': 'shipped',
    'delivered': 'delivered',
    'cancelled': 'cancelled',
    'returned': 'returned',
  };

  const newStatus = statusMap[payload.status || ''] || 'processing';

  const { error } = await supabase
    .from('orders')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (error) {
    console.error('❌ Failed to update status:', error);
  } else {
    console.log(`✅ Status updated for order ${orderId}: ${payload.status} → ${newStatus}`);
  }
}

async function handleCaseUpdate(supabase: any, orderId: string, payload: ZincWebhookPayload) {
  const { error } = await supabase
    .from('orders')
    .update({
      status: 'requires_attention',
      updated_at: new Date().toISOString(),
      notes: {
        case_details: payload.case_details,
        case_updated_at: new Date().toISOString(),
      },
    })
    .eq('id', orderId);

  if (error) {
    console.error('❌ Failed to update case:', error);
  } else {
    console.log(`✅ Case update recorded for order ${orderId}`);
  }
}
