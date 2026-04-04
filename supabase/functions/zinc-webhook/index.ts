import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { classifyZmaError } from '../shared/zmaErrorClassification.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrackingEntry {
  tracking_number?: string;
  retailer_tracking_number?: string;
  carrier?: string;
  tracking_url?: string;
  retailer_tracking_url?: string;
  delivery_status?: string;
  delivery_proof_image?: string;
  merchant_order_id?: string;
  product_id?: string;
  product_ids?: string[];
  obtained_at?: string;
  zinc_tracking_number?: string;
}

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
  tracking?: TrackingEntry | TrackingEntry[];
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
 * Normalizes Zinc's tracking data which can be a single object or an array.
 * Returns the most relevant tracking entry with delivery status info.
 */
function resolveTrackingData(payload: ZincWebhookPayload): {
  trackingNumber: string | null;
  carrier: string | null;
  trackingUrl: string | null;
  deliveryStatus: string | null;
  deliveryProofImage: string | null;
  merchantOrderId: string | null;
  allEntries: TrackingEntry[];
} | null {
  const tracking = payload.tracking;
  if (!tracking) return null;

  const entries: TrackingEntry[] = Array.isArray(tracking) ? tracking : [tracking];
  if (entries.length === 0) return null;

  // Find the most advanced entry: prefer one with delivery_status === 'Delivered', else first with tracking number
  const deliveredEntry = entries.find(e => e.delivery_status?.toLowerCase() === 'delivered');
  const best = deliveredEntry || entries.find(e => e.tracking_number || e.retailer_tracking_number) || entries[0];

  return {
    trackingNumber: best.tracking_number || best.retailer_tracking_number || best.zinc_tracking_number || null,
    carrier: best.carrier || null,
    trackingUrl: best.retailer_tracking_url || best.tracking_url || null,
    deliveryStatus: best.delivery_status || null,
    deliveryProofImage: best.delivery_proof_image || null,
    merchantOrderId: best.merchant_order_id || null,
    allEntries: entries,
  };
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
  
  // _type: 'error' can be a real failure OR just 'request_processing' (in-progress)
  if (payload._type === 'error') {
    // request_processing is NOT a failure — order is still being placed
    if (payload.code === 'request_processing') return 'request_processing';
    return 'request_failed';
  }

  // Detect root-level tracking array (Zinc sends tracking_updated this way)
  if (Array.isArray(payload.tracking) && payload.tracking.length > 0) return 'tracking_updated';
  if (payload.tracking) return 'tracking_obtained';

  return payload._type || 'unknown';
}

/**
 * Merges new notes into existing order notes (JSONB-safe).
 * Fetches existing notes from the order, spreads them, and adds new fields.
 */
async function mergeOrderNotes(supabase: any, orderId: string, newNotes: Record<string, any>): Promise<Record<string, any>> {
  const { data: order } = await supabase
    .from('orders')
    .select('notes')
    .eq('id', orderId)
    .single();

  const existing = (typeof order?.notes === 'object' && order?.notes !== null) ? order.notes : {};
  return { ...existing, ...newNotes };
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

      case 'request_processing':
        console.log('⏳ Zinc order still processing (not a failure). No action needed.');
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

  if (estimatedDelivery) {
    updateData.estimated_delivery = estimatedDelivery;
  }

  // Also check if tracking data is already present in the success payload
  const resolved = resolveTrackingData(payload);
  const notesMerge: Record<string, any> = {};
  if (trackingUrl) notesMerge.zinc_tracking_url = trackingUrl;
  if (payload.price_components) notesMerge.zinc_price_components = payload.price_components;
  if (merchantInfo) notesMerge.zinc_merchant_info = merchantInfo;
  if (resolved?.trackingNumber) notesMerge.tracking_number = resolved.trackingNumber;
  if (resolved?.deliveryProofImage) notesMerge.delivery_proof_image = resolved.deliveryProofImage;

  // If tracking shows delivered already, update status accordingly
  if (resolved?.deliveryStatus?.toLowerCase() === 'delivered') {
    updateData.status = 'delivered';
    updateData.fulfilled_at = new Date().toISOString();
    if (resolved.trackingNumber) updateData.tracking_number = resolved.trackingNumber;
    notesMerge.delivery_detected_via = 'request_succeeded_webhook';
    notesMerge.delivery_status = resolved.deliveryStatus;
  }

  updateData.notes = await mergeOrderNotes(supabase, orderId, notesMerge);

  const { error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId);

  if (error) {
    console.error('❌ Failed to update order on request_succeeded:', error);
  } else {
    console.log(`✅ Order ${orderId} marked as ${updateData.status} with merchant order ID: ${merchantOrderId}`);
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
      // Pass orderId via metadata so the orchestrator's DB-fetch logic
      // populates items, photos, and full order context automatically
      await supabase.from('email_queue').insert({
        recipient_email: toEmail,
        recipient_name: recipientName,
        event_type: 'order_failed',
        metadata: { orderId: orderId },
        template_variables: {},
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
  const resolved = resolveTrackingData(payload);

  if (!resolved) {
    console.log('⚠️ Tracking update received but no tracking data could be resolved from payload');
    return;
  }

  const isDelivered = resolved.deliveryStatus?.toLowerCase() === 'delivered';
  console.log(`📦 Tracking resolved: number=${resolved.trackingNumber}, status=${resolved.deliveryStatus}, delivered=${isDelivered}`);

  // Build update with proper status based on delivery_status
  const updateData: any = {
    status: isDelivered ? 'delivered' : 'shipped',
    updated_at: new Date().toISOString(),
  };

  if (resolved.trackingNumber) {
    updateData.tracking_number = resolved.trackingNumber;
  }

  if (isDelivered) {
    updateData.fulfilled_at = new Date().toISOString();
  }

  // Merge tracking info into notes (JSONB-safe)
  const notesMerge: Record<string, any> = {
    tracking_updated_at: new Date().toISOString(),
  };
  if (resolved.trackingUrl) notesMerge.zinc_tracking_url = resolved.trackingUrl;
  if (resolved.carrier) notesMerge.carrier = resolved.carrier;
  if (resolved.deliveryProofImage) notesMerge.delivery_proof_image = resolved.deliveryProofImage;
  if (resolved.deliveryStatus) notesMerge.zinc_delivery_status = resolved.deliveryStatus;
  if (resolved.merchantOrderId) notesMerge.zinc_merchant_order_id = resolved.merchantOrderId;
  notesMerge.delivery_detected_via = 'tracking_webhook';

  updateData.notes = await mergeOrderNotes(supabase, orderId, notesMerge);

  const { error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId);

  if (error) {
    console.error('❌ Failed to update tracking:', error);
  } else {
    console.log(`✅ Order ${orderId} → ${updateData.status} (tracking: ${resolved.trackingNumber})`);
  }

  // Queue appropriate notification email
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

    const emailEventType = isDelivered ? 'order_delivered' : 'order_shipped';
    console.log(`[email-queue] ${emailEventType} toEmail=${toEmail} order=${order?.order_number}`);

    if (!toEmail) {
      console.warn(`⚠️ No recipient email for ${emailEventType} order ${order?.order_number}`);
    } else {
      // Pass orderId via metadata so the orchestrator's DB-fetch logic
      // populates items, photos, pricing, and shipping address automatically
      await supabase.from('email_queue').insert({
        recipient_email: toEmail,
        recipient_name: recipientName,
        event_type: emailEventType,
        metadata: { orderId: orderId },
        template_variables: {},
        priority: 'normal',
        scheduled_for: new Date().toISOString(),
        status: 'pending',
      });
    }
  } catch (emailErr) {
    console.error('⚠️ Failed to queue notification email:', emailErr);
  }
}

async function handleStatusUpdate(supabase: any, orderId: string, payload: ZincWebhookPayload) {
  // First check if tracking array has delivery info (Zinc sometimes embeds it here)
  const resolved = resolveTrackingData(payload);
  if (resolved?.deliveryStatus?.toLowerCase() === 'delivered') {
    console.log('📦 status_updated contains delivered tracking data — delegating to handleTrackingUpdate');
    return handleTrackingUpdate(supabase, orderId, payload);
  }

  const statusMap: Record<string, string> = {
    'placed': 'processing',
    'shipped': 'shipped',
    'delivered': 'delivered',
    'cancelled': 'cancelled',
    'returned': 'returned',
  };

  const newStatus = statusMap[payload.status || ''] || 'processing';

  const updateData: any = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  if (newStatus === 'delivered') {
    updateData.fulfilled_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('orders')
    .update(updateData)
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
    const mergedNotes = await mergeOrderNotes(supabase, orderId, {
      case_details: payload.case_details,
      case_updated_at: new Date().toISOString(),
      awaiting_zma_refund: true,
    });
    await supabase.from('orders').update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
      notes: mergedNotes,
    }).eq('id', orderId);
    return;
  }

  // Default: mark as requires_attention for manual review
  const mergedNotes = await mergeOrderNotes(supabase, orderId, {
    case_details: payload.case_details,
    case_updated_at: new Date().toISOString(),
  });

  const { error } = await supabase
    .from('orders')
    .update({
      status: 'requires_attention',
      updated_at: new Date().toISOString(),
      notes: mergedNotes,
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

  const mergedNotes = await mergeOrderNotes(supabase, orderId, {
    cancellation_reason: cancellationReason,
    cancelled_at: new Date().toISOString(),
    awaiting_zma_refund: cancellationReason === 'payment',
  });

  const { error } = await supabase
    .from('orders')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
      notes: mergedNotes,
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

  // Update order status with merged notes
  const currentNotes = (typeof order.notes === 'object' && order.notes !== null) ? order.notes : {};
  await supabase.from('orders').update({
    status: 'cancelled',
    updated_at: new Date().toISOString(),
    notes: {
      ...currentNotes,
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
  if (eventType === 'request_succeeded') {
    console.log('✅ Cancellation succeeded for order:', orderId);
    
    const mergedNotes = await mergeOrderNotes(supabase, orderId, {
      cancellation_confirmed_at: new Date().toISOString(),
      zinc_cancellation_status: 'succeeded',
    });

    const { error } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        notes: mergedNotes,
      })
      .eq('id', orderId);

    if (error) {
      console.error('Failed to update cancelled order:', error);
    }
    
  } else if (eventType === 'request_failed') {
    console.log('❌ Cancellation failed for order:', orderId);
    
    const mergedNotes = await mergeOrderNotes(supabase, orderId, {
      cancellation_failed_at: new Date().toISOString(),
      zinc_cancellation_status: 'failed',
      cancellation_error: payload.error?.message || 'Cancellation attempt failed',
      cancellation_error_code: payload.error?.code,
    });

    const { error } = await supabase
      .from('orders')
      .update({
        status: 'processing',
        notes: mergedNotes,
      })
      .eq('id', orderId);

    if (error) {
      console.error('Failed to update failed cancellation:', error);
    }
  }
}
