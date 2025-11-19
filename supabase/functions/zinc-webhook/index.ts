import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

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

  // Manual test endpoint for debugging
  const url = new URL(req.url);
  const isTestMode = url.searchParams.get('test') === 'true';

  try {
    const payload: ZincWebhookPayload = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // Extract internal order ID early for logging
    let internalOrderId = payload.client_notes?.order_id;
    if (!internalOrderId) {
      const { data: order } = await supabase
        .from('orders')
        .select('id')
        .eq('zinc_request_id', payload.request_id)
        .single();
      internalOrderId = order?.id;
    }

    // 🔒 IDEMPOTENCY CHECK: Prevent duplicate processing
    const { data: existingLog, error: checkError } = await supabase
      .from('webhook_delivery_log')
      .select('id, delivery_status')
      .eq('event_id', payload.request_id)
      .eq('event_type', isTestMode ? `test_${payload.type}` : payload.type)
      .maybeSingle();

    if (existingLog && existingLog.delivery_status === 'completed') {
      console.log(`⚠️ Duplicate webhook detected: ${payload.type} for ${payload.request_id} - already processed`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Already processed',
          original_log_id: existingLog.id 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // 📊 DATABASE LOGGING: Log webhook receipt (idempotent)
    const logEntry = {
      event_type: isTestMode ? `test_${payload.type}` : payload.type,
      event_id: payload.request_id,
      order_id: internalOrderId || null,
      delivery_status: 'received',
      metadata: payload,
      created_at: new Date().toISOString(),
    };

    const { error: logError } = await supabase
      .from('webhook_delivery_log')
      .upsert(
        logEntry,
        { 
          onConflict: 'event_id,event_type',
          ignoreDuplicates: false
        }
      );

    if (logError) {
      console.error('❌ Failed to log webhook:', logError);
      // Continue processing even if logging fails
    }
    
    console.log(`📊 Webhook logged to database: ${payload.type} for order ${internalOrderId || 'unknown'}`);
    
    if (isTestMode) {
      console.log('🧪 TEST MODE: Webhook received and logged, skipping processing');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Test webhook logged successfully',
          logged_entry: logEntry 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    console.log('🔔 Zinc webhook received:', {
      type: payload.type,
      request_id: payload.request_id,
      order_id: payload.order_id,
    });

    if (!internalOrderId) {
      console.error('❌ Could not find order for request_id:', payload.request_id);
      
      // Log failure to database
      await supabase.from('webhook_delivery_log').insert({
        event_type: payload.type,
        event_id: payload.request_id,
        order_id: null,
        delivery_status: 'failed',
        error_message: 'Order not found',
        metadata: payload,
        created_at: new Date().toISOString(),
      });
      
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

    // Handle cancellation-specific logic if this is a cancellation webhook
    if (payload.client_notes?.cancellation_source === 'admin_trunkline') {
      console.log('🚫 Detected cancellation webhook');
      await handleCancellationWebhook(supabase, internalOrderId, payload);
    }

    // 📊 DATABASE LOGGING: Mark webhook as completed
    await supabase
      .from('webhook_delivery_log')
      .update({ 
        delivery_status: 'completed',
        updated_at: new Date().toISOString() 
      })
      .eq('event_id', payload.request_id)
      .eq('event_type', payload.type);

    // ✅ Mark webhook as successfully received in orders table
    await supabase
      .from('orders')
      .update({ 
        webhook_received_at: new Date().toISOString() 
      })
      .eq('id', internalOrderId);

    console.log(`✅ Webhook processing completed and logged for order ${internalOrderId}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed and logged' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('❌ Zinc webhook error:', error.message);
    
    // 📊 DATABASE LOGGING: Log error
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') || '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
      );
      
      const payload: ZincWebhookPayload = await req.json();
      
      await supabase.from('webhook_delivery_log').insert({
        event_type: payload.type || 'unknown',
        event_id: payload.request_id || 'unknown',
        order_id: null,
        delivery_status: 'failed',
        error_message: error.message,
        metadata: payload || {},
        created_at: new Date().toISOString(),
      });
    } catch (logError) {
      console.error('Failed to log error to database:', logError);
    }
    
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

  // Queue failure notification email with fallback
  try {
    const { data: order } = await supabase
      .from('orders')
      .select('customer_email, order_number, shipping_address, user_id')
      .eq('id', orderId)
      .single();

    const { data: profile } = await supabase
      .from('profiles')
      .select('email, name')
      .eq('id', order?.user_id)
      .single();

    const toEmail = order?.shipping_address?.email || order?.customer_email || profile?.email || null;
    const recipientName = order?.shipping_address?.name || profile?.name || 'Customer';

    console.log(`[email-queue] order_failed toEmail=${toEmail} order=${order?.order_number}`);

    if (!toEmail) {
      console.warn(`⚠️ No recipient email for failed order ${order?.order_number}`);
    } else {
      await supabase.from('email_queue').insert({
        recipient_email: toEmail,
        recipient_name: recipientName,
        event_type: 'order_failed',
        template_variables: {
          order_number: order.order_number,
          customer_name: recipientName,
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

  // Queue shipping notification email with fallback
  try {
    const { data: order } = await supabase
      .from('orders')
      .select('customer_email, order_number, shipping_address, user_id')
      .eq('id', orderId)
      .single();

    const { data: profile } = await supabase
      .from('profiles')
      .select('email, name')
      .eq('id', order?.user_id)
      .single();

    const toEmail = order?.shipping_address?.email || order?.customer_email || profile?.email || null;
    const recipientName = order?.shipping_address?.name || profile?.name || 'Customer';

    console.log(`[email-queue] order_shipped toEmail=${toEmail} order=${order?.order_number}`);

    if (!toEmail) {
      console.warn(`⚠️ No recipient email for shipped order ${order?.order_number}`);
    } else {
      await supabase.from('email_queue').insert({
        recipient_email: toEmail,
        recipient_name: recipientName,
        event_type: 'order_shipped',
        template_variables: {
          order_number: order.order_number,
          customer_name: recipientName,
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

async function handleCancellationWebhook(supabase: any, orderId: string, payload: ZincWebhookPayload) {
  /**
   * Handles cancellation-specific webhook responses from Zinc.
   * Updates order status based on success/failure of cancellation.
   */
  
  if (payload.type === 'request_succeeded') {
    console.log('✅ Cancellation succeeded for order:', orderId);
    
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        notes: {
          cancellation_confirmed_at: new Date().toISOString(),
          zinc_cancellation_status: 'succeeded',
        }
      })
      .eq('id', orderId);

    if (error) {
      console.error('Failed to update cancelled order:', error);
    }
    
  } else if (payload.type === 'request_failed') {
    console.log('❌ Cancellation failed for order:', orderId);
    
    // Get current order to preserve existing data
    const { data: order } = await supabase
      .from('orders')
      .select('notes, status')
      .eq('id', orderId)
      .single();
    
    const currentNotes = order?.notes || {};
    
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'processing', // Revert to processing since cancellation failed
        notes: {
          ...currentNotes,
          cancellation_failed_at: new Date().toISOString(),
          zinc_cancellation_status: 'failed',
          cancellation_error: payload.error?.message || 'Cancellation attempt failed',
          cancellation_error_code: payload.error?.code,
        }
      })
      .eq('id', orderId);

    if (error) {
      console.error('Failed to update failed cancellation:', error);
    }
  }
}
