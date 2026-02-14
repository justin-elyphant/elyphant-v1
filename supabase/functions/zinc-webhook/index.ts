import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { classifyZmaError } from '../shared/zmaErrorClassification.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ZincWebhookPayload {
  type?: string;
  _type?: string;
  request_id: string;
  order_id?: string;
  merchant_order_id?: string;
  merchant_order_ids?: Array<{
    merchant_order_id: string;
    tracking_url?: string;
    merchant?: string;
    placed_at?: string;
    product_ids?: string[];
  }>;
  delivery_dates?: Array<{
    date: string;
    days?: number;
    delivery_date?: string;
  }>;
  tracking?: {
    tracking_number: string;
    carrier: string;
    tracking_url?: string;
  };
  status?: string;
  case_details?: {
    type?: string;
    message?: string;
    refund_amount?: number;
  };
  status_updates?: Array<{
    type: string;
    data?: {
      reason?: string;
    };
  }>;
  error?: {
  code: string;
    message: string;
    data?: any;
  };
  // Root-level error fields (Zinc puts these at root, not nested under .error)
  code?: string;
  message?: string;
  data?: any;
  client_notes?: {
    order_id: string;
    order_number: string;
    user_id: string;
    cancellation_source?: string;
  };
  price_components?: any;
}

/**
 * Resolves the event type from Zinc's payload.
 * Zinc sends `_type` (with underscore), not `type`.
 * Maps Zinc's internal types to our expected event names.
 */
function resolveEventType(payload: ZincWebhookPayload): string {
  // If standard `type` field exists, use it directly
  if (payload.type) return payload.type;

  // Map Zinc's `_type` to our event names
  if (payload._type === 'order_response') return 'request_succeeded';
  if (payload._type === 'error') return 'request_failed';

  // Fallback: infer from payload shape
  if (payload.tracking) return 'tracking_obtained';

  return payload._type || 'unknown';
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
    
    // Resolve the event type early (handles Zinc's _type field)
    const eventType = resolveEventType(payload);
    console.log(`🔔 Zinc webhook received: resolved type="${eventType}" (_type="${payload._type}", type="${payload.type}")`);
    
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
    const logEventType = isTestMode ? `test_${eventType}` : eventType;
    
    const { data: existingLog, error: checkError } = await supabase
      .from('webhook_delivery_log')
      .select('id, delivery_status')
      .eq('event_id', payload.request_id)
      .eq('event_type', logEventType)
      .maybeSingle();

    if (existingLog && existingLog.delivery_status === 'completed') {
      console.log(`⚠️ Duplicate webhook detected: ${eventType} for ${payload.request_id} - already processed`);
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
      event_type: logEventType,
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
    
    console.log(`📊 Webhook logged to database: ${eventType} for order ${internalOrderId || 'unknown'}`);
    
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
    
    console.log('🔔 Zinc webhook details:', {
      type: eventType,
      request_id: payload.request_id,
      order_id: payload.order_id,
    });

    if (!internalOrderId) {
      console.error('❌ Could not find order for request_id:', payload.request_id);
      
      // Log failure to database
      await supabase.from('webhook_delivery_log').insert({
        event_type: eventType,
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

    // Handle different webhook types using resolved eventType
    switch (eventType) {
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

      case 'order.cancelled':
        console.log('🚫 Order cancelled by retailer');
        await handleOrderCancelled(supabase, internalOrderId, payload);
        break;

      default:
        console.log('⚠️ Unknown webhook type:', eventType);
    }

    // Handle cancellation-specific logic if this is a cancellation webhook
    if (payload.client_notes?.cancellation_source === 'admin_trunkline') {
      console.log('🚫 Detected cancellation webhook');
      await handleCancellationWebhook(supabase, internalOrderId, payload, eventType);
    }

    // 📊 DATABASE LOGGING: Mark webhook as completed
    await supabase
      .from('webhook_delivery_log')
      .update({ 
        delivery_status: 'completed',
        updated_at: new Date().toISOString() 
      })
      .eq('event_id', payload.request_id)
      .eq('event_type', logEventType);

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
      
      // Try to parse the body again for logging - may fail if already consumed
      let errorEventType = 'unknown';
      let errorEventId = 'unknown';
      try {
        const errorPayload = await req.json();
        errorEventType = resolveEventType(errorPayload);
        errorEventId = errorPayload.request_id || 'unknown';
      } catch (_) {
        // Body already consumed, use defaults
      }
      
      await supabase.from('webhook_delivery_log').insert({
        event_type: errorEventType,
        event_id: errorEventId,
        order_id: null,
        delivery_status: 'failed',
        error_message: error.message,
        metadata: {},
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
  // Extract from Zinc's nested structure (merchant_order_ids array)
  const merchantInfo = payload.merchant_order_ids?.[0];
  const merchantOrderId = merchantInfo?.merchant_order_id 
    || payload.merchant_order_id 
    || payload.order_id;
  const trackingUrl = merchantInfo?.tracking_url;
  const estimatedDelivery = payload.delivery_dates?.[0]?.date;

  console.log(`📦 Extracted merchant data: order_id=${merchantOrderId}, tracking_url=${trackingUrl ? 'yes' : 'no'}, delivery=${estimatedDelivery}`);

  const updateData: any = {
    zinc_order_id: merchantOrderId,
    status: 'processing',
    updated_at: new Date().toISOString(),
  };

  // Save tracking URL in notes (no tracking_url column exists)
  // tracking_url will be stored in notes.zinc_tracking_url

  // Save estimated delivery date if available
  if (estimatedDelivery) {
    updateData.estimated_delivery = estimatedDelivery;
  }

  // Save tracking URL, price components, and merchant info in notes
  {
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('notes')
      .eq('id', orderId)
      .single();

    updateData.notes = {
      ...(existingOrder?.notes || {}),
      ...(trackingUrl ? { zinc_tracking_url: trackingUrl } : {}),
      ...(payload.price_components ? { zinc_price_components: payload.price_components } : {}),
      ...(merchantInfo ? { zinc_merchant_info: merchantInfo } : {}),
    };
  }

  const { error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId);

  if (error) {
    console.error('❌ Failed to update order on request_succeeded:', error);
  } else {
    console.log(`✅ Order ${orderId} marked as placed with merchant order ID: ${merchantOrderId}, tracking: ${trackingUrl || 'none'}, delivery: ${estimatedDelivery || 'unknown'}`);
  }
}

async function handleRequestFailed(supabase: any, orderId: string, payload: ZincWebhookPayload) {
  // Extract error from root-level fields first (Zinc's actual format), fallback to nested .error
  const errorCode = payload.code || payload.error?.code || 'unknown';
  const errorMessage = payload.message || payload.error?.message || 'Unknown Zinc error';
  const errorData = payload.data || payload.error?.data;

  console.log(`🔍 Error classification: code=${errorCode}, message=${errorMessage}`);

  // Classify the error to determine if it's retryable
  const classification = classifyZmaError({ code: errorCode, message: errorMessage });
  console.log(`🔍 Classification: type=${classification.type}, shouldRetry=${classification.shouldRetry}, maxRetries=${classification.maxRetries}`);

  // Get current order to check existing retry count
  const { data: order } = await supabase
    .from('orders')
    .select('notes, customer_email, order_number, shipping_address, user_id')
    .eq('id', orderId)
    .single();

  const currentNotes = order?.notes || {};
  const currentRetryCount = currentNotes.zinc_retry_count || 0;
  const maxRetries = classification.maxRetries || 0;

  // If retryable and under max retries, set requires_attention and skip customer email
  if (classification.shouldRetry && currentRetryCount < maxRetries) {
    const newRetryCount = currentRetryCount + 1;
    console.log(`🔄 Retryable error (attempt ${newRetryCount}/${maxRetries}). Setting requires_attention, skipping customer email.`);

    const { error } = await supabase
      .from('orders')
      .update({
        status: 'requires_attention',
        notes: {
          ...currentNotes,
          zinc_error: {
            code: errorCode,
            message: errorMessage,
            data: errorData,
            timestamp: new Date().toISOString(),
          },
          zinc_retry_count: newRetryCount,
          zinc_retry_max: maxRetries,
          zinc_retry_classification: classification.type,
          zinc_next_retry_delay_seconds: classification.retryDelay,
          funding_hold_reason: `Retryable Zinc error (attempt ${newRetryCount}/${maxRetries}): ${errorCode}`,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) {
      console.error('❌ Failed to update order for retry:', error);
    } else {
      console.log(`✅ Order ${orderId} set to requires_attention for auto-retry (attempt ${newRetryCount}/${maxRetries})`);
    }

    // Create admin alert for visibility
    await supabase.from('admin_alerts').insert({
      alert_type: 'zinc_retryable_error',
      severity: classification.alertLevel || 'warning',
      message: `Order ${order?.order_number || orderId}: ${errorCode} - auto-retry ${newRetryCount}/${maxRetries} pending`,
      order_id: orderId,
      requires_action: false,
      metadata: {
        error_code: errorCode,
        error_message: errorMessage,
        retry_count: newRetryCount,
        max_retries: maxRetries,
        classification: classification.type,
        retry_delay_seconds: classification.retryDelay,
      },
    });

    return; // Do NOT send failure email - retry is pending
  }

  // Terminal failure: max retries exhausted or non-retryable error
  if (classification.shouldRetry && currentRetryCount >= maxRetries) {
    console.log(`❌ Max retries exhausted (${currentRetryCount}/${maxRetries}). Marking as failed.`);
  } else {
    console.log(`❌ Non-retryable error: ${classification.type}. Marking as failed.`);
  }

  const { error } = await supabase
    .from('orders')
    .update({
      status: 'failed',
      notes: {
        ...currentNotes,
        zinc_error: {
          code: errorCode,
          message: errorMessage,
          data: errorData,
          timestamp: new Date().toISOString(),
        },
        zinc_retry_count: currentRetryCount,
        zinc_retry_exhausted: classification.shouldRetry,
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
          error_message: classification.userFriendlyMessage,
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
  const caseType = payload.case_details?.type;
  console.log(`📋 Case type: ${caseType}`);

  // Handle refund cases - create pending refund request for admin approval
  if (caseType === 'case.refund.full' || caseType === 'case.refund.partial') {
    console.log(`💰 ZMA refund detected: ${caseType}`);
    await createPendingRefund(supabase, orderId, payload, caseType === 'case.refund.partial' ? 'partial' : 'full');
    return;
  }

  // Handle forced cancellation - order was cancelled, ZMA refund may follow
  if (caseType === 'case.opened.cancel.forced_cancellation') {
    console.log('🚫 Forced cancellation case - ZMA refund expected');
    await supabase.from('orders').update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
      notes: {
        case_details: payload.case_details,
        case_updated_at: new Date().toISOString(),
        awaiting_zma_refund: true,
      },
    }).eq('id', orderId);
    return;
  }

  // Default: mark as requires_attention for manual review
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

async function handleOrderCancelled(supabase: any, orderId: string, payload: ZincWebhookPayload) {
  const cancellationReason = payload.status_updates?.find(u => u.type === 'order.cancelled')?.data?.reason;
  console.log(`🚫 Order cancelled, reason: ${cancellationReason}`);

  // Get current order notes
  const { data: order } = await supabase
    .from('orders')
    .select('notes')
    .eq('id', orderId)
    .single();

  const currentNotes = order?.notes || {};

  const { error } = await supabase
    .from('orders')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
      notes: {
        ...currentNotes,
        cancellation_reason: cancellationReason,
        cancelled_at: new Date().toISOString(),
        awaiting_zma_refund: cancellationReason === 'payment',
      },
    })
    .eq('id', orderId);

  if (error) {
    console.error('❌ Failed to update cancelled order:', error);
  } else {
    console.log(`✅ Order ${orderId} marked as cancelled`);
  }
}

async function createPendingRefund(supabase: any, orderId: string, payload: ZincWebhookPayload, refundType: 'full' | 'partial') {
  // Get order details
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, order_number, total_amount, payment_intent_id, user_id, customer_email, shipping_address, notes')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    console.error('❌ Failed to fetch order for refund:', orderError);
    return;
  }

  // Calculate refund amount
  const refundAmount = payload.case_details?.refund_amount || (refundType === 'full' ? order.total_amount : 0);
  
  if (!refundAmount || refundAmount <= 0) {
    console.error('❌ Invalid refund amount:', refundAmount);
    return;
  }

  // Check for existing pending refund request
  const { data: existingRefund } = await supabase
    .from('refund_requests')
    .select('id')
    .eq('order_id', orderId)
    .eq('status', 'pending')
    .maybeSingle();

  if (existingRefund) {
    console.log('⚠️ Pending refund already exists for order:', orderId);
    return;
  }

  // Create pending refund request
  const { error: refundError } = await supabase
    .from('refund_requests')
    .insert({
      order_id: orderId,
      amount: refundAmount,
      reason: `ZMA refunded by Zinc: ${payload.case_details?.message || refundType + ' refund'}`,
      status: 'pending',
      refund_type: refundType,
      metadata: {
        zinc_case_type: payload.case_details?.type,
        zinc_request_id: payload.request_id,
        original_payment_intent: order.payment_intent_id,
      },
    });

  if (refundError) {
    console.error('❌ Failed to create refund request:', refundError);
    return;
  }

  console.log(`✅ Pending refund request created for order ${orderId}: $${refundAmount}`);

  // Update order status
  await supabase.from('orders').update({
    status: 'cancelled',
    updated_at: new Date().toISOString(),
    notes: {
      ...order.notes,
      zma_refunded: true,
      zma_refund_amount: refundAmount,
      pending_customer_refund: true,
    },
  }).eq('id', orderId);

  // Get customer info for email
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, name')
    .eq('id', order.user_id)
    .single();

  const customerEmail = order.shipping_address?.email || order.customer_email || profile?.email;
  const customerName = order.shipping_address?.name || profile?.name || 'Customer';

  // Queue admin approval email
  await supabase.from('email_queue').insert({
    recipient_email: 'justin@elyphant.com',
    recipient_name: 'Justin',
    event_type: 'refund_approval_required',
    template_variables: {
      order_number: order.order_number,
      customer_name: customerName,
      customer_email: customerEmail,
      refund_amount: refundAmount.toFixed(2),
      refund_reason: payload.case_details?.message || 'ZMA refunded by retailer',
      trunkline_url: 'https://elyphant.com/trunkline/refunds',
    },
    priority: 'high',
    scheduled_for: new Date().toISOString(),
    status: 'pending',
  });

  console.log(`📧 Admin approval email queued for refund on order ${order.order_number}`);
}

async function handleCancellationWebhook(supabase: any, orderId: string, payload: ZincWebhookPayload, eventType: string) {
  /**
   * Handles cancellation-specific webhook responses from Zinc.
   * Uses resolved eventType instead of payload.type directly.
   */
  
  if (eventType === 'request_succeeded') {
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
    
  } else if (eventType === 'request_failed') {
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
