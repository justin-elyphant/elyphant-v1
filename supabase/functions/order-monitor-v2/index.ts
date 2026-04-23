import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/** Status hierarchy — higher index = more advanced. Never downgrade. */
const STATUS_RANK: Record<string, number> = {
  'pending': 0,
  'scheduled': 1,
  'processing': 2,
  'requires_attention': 3,
  'shipped': 4,
  'delivered': 5,
  'completed': 6,
  'cancelled': 7,
  'failed': 8,
  'returned': 9,
};

const RETRYABLE_ZINC_ERROR_CODES = new Set([
  'zma_temporarily_overloaded',
  'internal_error',
]);

const POST_PURCHASE_CHECK_DELAY_MINUTES = 5;
const POST_PURCHASE_CHECK_WINDOW_MINUTES = 90;

function classifyNonRetryableZincFailure(code: string, message: string) {
  if (code === 'insufficient_zma_balance') {
    return {
      status: 'requires_attention',
      classification: 'account_critical',
      alertLevel: 'critical',
      message: message || 'ZMA account balance is insufficient',
    };
  }

  if (code === 'max_price_exceeded') {
    return {
      status: 'requires_attention',
      classification: 'manual_review',
      alertLevel: 'warning',
      message: message || 'Zinc max price was exceeded',
    };
  }

  if (code === 'product_unavailable' || code === 'invalid_product_id') {
    return {
      status: 'failed',
      classification: 'catalog_or_product_issue',
      alertLevel: 'warning',
      message: message || `Zinc returned ${code}`,
    };
  }

  return {
    status: 'failed',
    classification: 'manual_review',
    alertLevel: 'warning',
    message: message || 'Order failed in Zinc',
  };
}

function getZincErrorCode(notes: Record<string, any>, zincData?: any): string {
  return zincData?.code || notes.zinc_error?.code || notes.zinc_error_code || '';
}

function getZincErrorMessage(notes: Record<string, any>, zincData?: any): string {
  const noteError = notes.zinc_error;
  return zincData?.message || zincData?.data?.message ||
    (typeof noteError === 'string' ? noteError : noteError?.message) || '';
}

function isRetryableZincFailure(notes: Record<string, any>, zincData?: any): boolean {
  const code = getZincErrorCode(notes, zincData);
  const message = getZincErrorMessage(notes, zincData).toLowerCase();

  return notes.zinc_retry_classification === 'retryable_system' ||
    RETRYABLE_ZINC_ERROR_CODES.has(code) ||
    code.includes('timeout') ||
    code.includes('server_error') ||
    code.includes('unavailable') ||
    code.includes('network') ||
    message.includes('temporarily unable to process') ||
    message.includes('high volume of orders') ||
    message.includes('temporarily overloaded');
}

function getRetryPolicy(notes: Record<string, any>, zincData?: any) {
  const code = getZincErrorCode(notes, zincData);
  if (code === 'zma_temporarily_overloaded') return { delaySeconds: 3600, maxRetries: 3 };
  if (code === 'internal_error') return { delaySeconds: 7200, maxRetries: 2 };
  return {
    delaySeconds: Number(notes.zinc_next_retry_delay_seconds || 1800),
    maxRetries: Number(notes.zinc_retry_max || 2),
  };
}

function getRetryBaseTimestamp(notes: Record<string, any>, zincData?: any, order?: any): string {
  return zincData?._created_at ||
    notes.zinc_error?.timestamp ||
    notes.zinc_error_at ||
    order?.updated_at ||
    order?.created_at ||
    new Date().toISOString();
}

function parseOrderNotes(notes: unknown): Record<string, any> {
  if (typeof notes === 'object' && notes !== null && !Array.isArray(notes)) return notes as Record<string, any>;
  if (typeof notes === 'string') {
    try {
      const parsed = JSON.parse(notes);
      return (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

/** Returns true if transitioning from currentStatus to newStatus would be a downgrade. */
function isStatusDowngrade(currentStatus: string, newStatus: string): boolean {
  const current = STATUS_RANK[currentStatus] ?? -1;
  const next = STATUS_RANK[newStatus] ?? -1;
  // Special: never downgrade delivered/completed to shipped
  if ((currentStatus === 'delivered' || currentStatus === 'completed') && newStatus === 'shipped') return true;
  return next < current;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json().catch(() => ({}));
    const postPurchaseOnly = requestBody?.postPurchaseCheck === true;

    console.log(postPurchaseOnly ? '👁️ Running post-purchase Zinc health check...' : '👁️ Running order monitor...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    const now = Date.now();
    const postPurchaseReadyBefore = new Date(now - POST_PURCHASE_CHECK_DELAY_MINUTES * 60 * 1000).toISOString();
    const postPurchaseWindowStart = new Date(now - POST_PURCHASE_CHECK_WINDOW_MINUTES * 60 * 1000).toISOString();

    // Query 0: Freshly submitted orders, checked once 5+ minutes after Zinc submission.
    const { data: freshPurchaseOrders, error: freshPurchaseError } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'processing')
      .not('zinc_request_id', 'is', null)
      .gte('updated_at', postPurchaseWindowStart)
      .lte('updated_at', postPurchaseReadyBefore)
      .order('updated_at', { ascending: true });

    if (freshPurchaseError) {
      console.warn('⚠️ Error fetching fresh purchase orders:', freshPurchaseError);
    }

    const postPurchaseOrders = (freshPurchaseOrders || []).filter((order: any) => {
      const notes = parseOrderNotes(order.notes);
      return notes.post_purchase_monitor_request_id !== order.zinc_request_id;
    });

    // Query 1: Processing orders with zinc_order_id (webhook received)
    const { data: processingOrders, error: fetchError1 } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'processing')
      .not('zinc_order_id', 'is', null)
      .order('created_at', { ascending: true });

    if (fetchError1) {
      throw fetchError1;
    }

    // Keep retry metadata honest after process-order-v2 successfully re-submits.
    const inflightRetryOrders = (processingOrders || []).filter((order: any) => {
      const notes = parseOrderNotes(order.notes);
      return notes.zinc_retry_status === 'resubmitting';
    });

    for (const order of inflightRetryOrders) {
      const notes = parseOrderNotes(order.notes);
      await supabase
        .from('orders')
        .update({
          notes: {
            ...notes,
            zinc_retry_status: 'resubmitted',
            zinc_retry_confirmed_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);
    }

    // Query 2: Orders missing webhooks (zinc_request_id exists but no zinc_order_id)
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    
    const { data: webhookTimeoutOrders, error: fetchError2 } = await supabase
      .from('orders')
      .select('*')
      .not('zinc_request_id', 'is', null)
      .is('zinc_order_id', null)
      .gte('created_at', fourHoursAgo)
      .or(`last_polling_check_at.is.null,last_polling_check_at.lt.${fifteenMinutesAgo}`);

    if (fetchError2) {
      console.warn('⚠️ Error fetching webhook-timeout orders:', fetchError2);
    }

    // Query 3: NEW — Shipped orders to detect delivery transitions
    const { data: shippedOrders, error: fetchError3 } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'shipped')
      .not('zinc_request_id', 'is', null)
      .or(`last_polling_check_at.is.null,last_polling_check_at.lt.${fifteenMinutesAgo}`)
      .order('created_at', { ascending: true });

    if (fetchError3) {
      console.warn('⚠️ Error fetching shipped orders:', fetchError3);
    }

    // Query 4: Retryable Zinc failures held in requires_attention or failed.
    // Webhooks usually set requires_attention; polling may have already marked retryable errors failed.
    const { data: retryableAttentionOrders, error: fetchError4 } = await supabase
      .from('orders')
      .select('*')
      .in('status', ['requires_attention', 'failed'])
      .not('notes', 'is', null)
      .gte('created_at', oneDayAgo)
      .order('updated_at', { ascending: true });

    if (fetchError4) {
      console.warn('⚠️ Error fetching retryable requires_attention orders:', fetchError4);
    }

    const allOrders = [
      // Put retryable failures first so orders that also match webhook-timeout
      // are re-submitted instead of repeatedly polling the old failed Zinc request.
      ...(retryableAttentionOrders || []),
      ...(processingOrders || []),
      ...(webhookTimeoutOrders || []),
      ...(shippedOrders || []),
    ];

    // Deduplicate by order id (an order could match multiple queries)
    const seen = new Set<string>();
    const uniqueOrders = allOrders.filter(o => {
      if (seen.has(o.id)) return false;
      seen.add(o.id);
      return true;
    });

    console.log(`📦 Monitoring ${processingOrders?.length || 0} processing + ${webhookTimeoutOrders?.length || 0} webhook-timeout + ${shippedOrders?.length || 0} shipped + ${retryableAttentionOrders?.length || 0} retryable-attention orders (${uniqueOrders.length} unique)`);

    const results = {
      updated: [] as string[],
      stuck: [] as string[],
      retried: [] as string[],
      failed: [] as { orderId: string; error: string }[],
    };

    for (const order of uniqueOrders) {
      try {
        const existingNotes = parseOrderNotes(order.notes);

        // Automatically re-submit transient Zinc failures after their configured delay.
        if ((order.status === 'requires_attention' || order.status === 'failed') && isRetryableZincFailure(existingNotes)) {
          const retryCount = Number(existingNotes.zinc_retry_count || 0);
          const { delaySeconds: retryDelaySeconds, maxRetries } = getRetryPolicy(existingNotes);
          const lastFailureAt = getRetryBaseTimestamp(existingNotes, undefined, order);
          const nextRetryAt = new Date(new Date(lastFailureAt).getTime() + retryDelaySeconds * 1000);
          const lastRetryAttemptAt = existingNotes.zinc_retry_last_attempt_at
            ? new Date(existingNotes.zinc_retry_last_attempt_at).getTime()
            : 0;
          const retryInFlight = existingNotes.zinc_retry_status === 'resubmitting' &&
            Date.now() - lastRetryAttemptAt < 30 * 60 * 1000;

          if (!maxRetries || retryCount >= maxRetries) {
            console.log(`⏭️ Skipping retry for order ${order.id} - retry limit reached (${retryCount}/${maxRetries})`);
            continue;
          }

          if (retryInFlight) {
            console.log(`⏭️ Skipping retry for order ${order.id} - prior retry still in flight`);
            await supabase
              .from('orders')
              .update({ last_polling_check_at: new Date().toISOString() })
              .eq('id', order.id);
            continue;
          }

          if (Date.now() < nextRetryAt.getTime()) {
            console.log(`⏳ Retry not due for order ${order.id}. Next retry at ${nextRetryAt.toISOString()}`);
            await supabase
              .from('orders')
              .update({ last_polling_check_at: new Date().toISOString() })
              .eq('id', order.id);
            continue;
          }

          console.log(`🔄 Auto re-submitting retryable Zinc order ${order.id} (attempt ${retryCount + 1}/${maxRetries}, reason: ${getZincErrorCode(existingNotes) || 'unknown'})`);

          const retryAttemptAt = new Date().toISOString();
          const { data: lockedRetry, error: lockError } = await supabase
            .from('orders')
            .update({
              last_polling_check_at: retryAttemptAt,
              notes: {
                ...existingNotes,
                zinc_retry_count: retryCount + 1,
                zinc_retry_last_attempt_at: retryAttemptAt,
                zinc_retry_status: 'resubmitting',
              },
              updated_at: retryAttemptAt,
            })
            .eq('id', order.id)
            .in('status', ['requires_attention', 'failed'])
            .select('id')
            .maybeSingle();

          if (lockError || !lockedRetry) {
            console.log(`⏭️ Skipping retry for order ${order.id} - retry lock not acquired`);
            continue;
          }

          const { data: retryResult, error: retryError } = await supabase.functions.invoke('process-order-v2', {
            body: { orderId: order.id },
          });

          if (retryError || retryResult?.success === false) {
            const message = retryError?.message || retryResult?.error || 'Unknown retry error';
            console.warn(`⚠️ Auto re-submit failed for order ${order.id}: ${message}`);
            await supabase
              .from('orders')
              .update({
                notes: {
                  ...existingNotes,
                  zinc_retry_last_attempt_at: retryAttemptAt,
                  zinc_retry_last_error: message,
                  zinc_retry_status: 'resubmit_failed',
                },
                updated_at: new Date().toISOString(),
              })
              .eq('id', order.id);
            results.failed.push({ orderId: order.id, error: message });
          } else {
            console.log(`✅ Auto re-submit accepted for order ${order.id}: ${retryResult?.zinc_request_id || 'submitted'}`);
            results.retried.push(order.id);
          }

          continue;
        }

        if (!order.zinc_request_id) {
          console.log(`⏭️ Skipping order ${order.id} - no zinc_request_id available`);
          continue;
        }
        const zincIdentifier = order.zinc_request_id;
        const isWebhookTimeout = !order.zinc_order_id;

        console.log(`🔍 Checking Zinc status for order: ${order.id} (request_id: ${zincIdentifier}, current_status: ${order.status}${isWebhookTimeout ? ' - WEBHOOK TIMEOUT' : ''})`);

        // Check Zinc API for order status
        const zincResponse = await fetch(
          `https://api.zinc.io/v1/orders/${zincIdentifier}`,
          {
            headers: {
              'Authorization': `Basic ${btoa(Deno.env.get('ZINC_API_KEY') + ':')}`,
            },
          }
        );

        // Update last_polling_check_at regardless of response
        await supabase
          .from('orders')
          .update({ last_polling_check_at: new Date().toISOString() })
          .eq('id', order.id);

        if (!zincResponse.ok) {
          if (zincResponse.status === 404 && isWebhookTimeout) {
            console.log(`⏳ Order ${order.id} still in Zinc queue (request_id: ${order.zinc_request_id})`);
            continue;
          }
          console.warn(`⚠️ Failed to fetch Zinc status for ${zincIdentifier}: ${zincResponse.status}`);
          continue;
        }

        const zincData = await zincResponse.json();
        console.log(`📋 Zinc response for ${order.id}:`, JSON.stringify(zincData).substring(0, 500));
        
        // Handle request_processing - Zinc is actively working on it (NOT a failure)
        if (zincData._type === 'error' && zincData.code === 'request_processing') {
          console.log(`⏳ Order ${order.id} still processing in Zinc queue (request_processing state)`);
          continue;
        }
        
        const updates: any = {
          updated_at: new Date().toISOString(),
        };

        // Parse Zinc response
        const isSuccessful = zincData._type === 'order_response' ||
          zincData.status_updates?.some((u: any) => u.type === 'request.finished' && u.data?.success);
        
        const merchantOrderId = zincData.merchant_order_ids?.[0]?.merchant_order_id ||
          zincData.merchant_order_id;
        
        const estimatedDelivery = zincData.delivery_dates?.[0]?.date ||
          zincData.tracking?.estimated_delivery;
        
        const trackingUrl = zincData.merchant_order_ids?.[0]?.tracking_url;
        
        // NEW: Check tracking[] array for delivery status (the correct Zinc format)
        const trackingEntries: any[] = Array.isArray(zincData.tracking) ? zincData.tracking : [];
        const deliveredEntry = trackingEntries.find((t: any) => t.delivery_status?.toLowerCase() === 'delivered');
        const isDelivered = !!deliveredEntry;
        const bestTracking = deliveredEntry || trackingEntries[0];
        const trackingNumber = bestTracking?.tracking_number || bestTracking?.retailer_tracking_number || 
          (typeof zincData.tracking === 'object' && !Array.isArray(zincData.tracking) ? zincData.tracking?.tracking_number : null);
        
        // Check for actual failed status
        const isFailed = zincData.code === 'failed' || 
          zincData.code === 'cancelled' ||
          zincData.code === 'out_of_stock' ||
          zincData.code === 'payment_failed' ||
          (zincData._type === 'error' && 
           zincData.code !== 'request_processing' &&
           zincData.code !== 'pending');

        // NEW: If we found the order via polling (webhook timeout), populate zinc_order_id
        if (isWebhookTimeout && merchantOrderId) {
          console.log(`🔄 WEBHOOK TIMEOUT RECOVERY: Found order via polling for ${order.id}`);
          updates.zinc_order_id = merchantOrderId;
          updates.webhook_received_at = null;
          updates.notes = { ...existingNotes, recovered_via: 'polling', recovered_at: new Date().toISOString() };
        }

        if (isDelivered) {
          // DELIVERY DETECTED — highest priority status
          if (isStatusDowngrade(order.status, 'delivered')) {
            console.log(`⚠️ Skipping: order ${order.id} already at ${order.status}, won't downgrade to delivered`);
          } else {
            updates.status = 'delivered';
            updates.fulfilled_at = new Date().toISOString();
            if (merchantOrderId) updates.zinc_order_id = merchantOrderId;
            if (trackingNumber) updates.tracking_number = trackingNumber;
            if (estimatedDelivery) updates.estimated_delivery = estimatedDelivery;
            
            updates.notes = {
              ...existingNotes,
              ...(updates.notes || {}),
              zinc_delivery_status: 'Delivered',
              delivery_detected_via: 'polling',
              delivery_detected_at: new Date().toISOString(),
              ...(deliveredEntry?.delivery_proof_image ? { delivery_proof_image: deliveredEntry.delivery_proof_image } : {}),
              ...(deliveredEntry?.tracking_url || deliveredEntry?.retailer_tracking_url ? { zinc_tracking_url: deliveredEntry.retailer_tracking_url || deliveredEntry.tracking_url } : {}),
              ...(trackingUrl ? { merchant_tracking_url: trackingUrl } : {}),
            };

            console.log(`📬 Order ${order.id} DELIVERED (detected via polling)`);
            results.updated.push(order.id);

            // Queue delivery email
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('email, name')
                .eq('id', order.user_id)
                .single();

              const shippingAddr = order.shipping_address as any;
              const toEmail = shippingAddr?.email || profile?.email;
              const recipientName = shippingAddr?.name || profile?.name || 'Customer';

              if (toEmail) {
                // Pass orderId via metadata so the orchestrator's DB-fetch logic
                // populates items, photos, and full context automatically
                await supabase.from('email_queue').insert({
                  recipient_email: toEmail,
                  recipient_name: recipientName,
                  event_type: 'order_delivered',
                  metadata: { orderId: order.id },
                  template_variables: {},
                  priority: 'normal',
                  scheduled_for: new Date().toISOString(),
                  status: 'pending',
                });
                console.log(`📧 Queued delivery email for order ${order.id} to ${toEmail}`);
              }
            } catch (emailErr) {
              console.error('⚠️ Failed to queue delivery email:', emailErr);
            }
          }
        } else if (isSuccessful && merchantOrderId) {
          const newStatus = 'shipped';

          // Guard against status downgrade
          if (isStatusDowngrade(order.status, newStatus)) {
            console.log(`⚠️ Skipping: order ${order.id} already at ${order.status}, won't downgrade to ${newStatus}`);
          } else {
            updates.status = newStatus;
            updates.zinc_order_id = merchantOrderId;
            if (trackingNumber) updates.tracking_number = trackingNumber;
            if (estimatedDelivery) updates.estimated_delivery = estimatedDelivery;
            
            // JSONB merge for tracking info
            const trackingNotes: Record<string, any> = {};
            if (trackingUrl) trackingNotes.zinc_tracking_url = trackingUrl;
            if (bestTracking?.tracking_url || bestTracking?.retailer_tracking_url) {
              trackingNotes.tracking_url = bestTracking.retailer_tracking_url || bestTracking.tracking_url;
            }
            updates.notes = { ...existingNotes, ...(updates.notes || {}), ...trackingNotes };
            
            console.log(`✅ Order ${order.id} placed with merchant: ${merchantOrderId}, delivery: ${estimatedDelivery}`);
            results.updated.push(order.id);
            
            // Queue shipped email only if transitioning from non-shipped
            if (order.status !== 'shipped') {
              try {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('email, name')
                  .eq('id', order.user_id)
                  .single();

                const shippingAddr = order.shipping_address as any;
                const toEmail = shippingAddr?.email || profile?.email;
                const recipientName = shippingAddr?.name || profile?.name || 'Customer';

              if (toEmail) {
                  // Pass orderId via metadata so the orchestrator's DB-fetch logic
                  // populates items, photos, pricing, and address automatically
                  await supabase.from('email_queue').insert({
                    recipient_email: toEmail,
                    recipient_name: recipientName,
                    event_type: 'order_shipped',
                    metadata: { orderId: order.id },
                    template_variables: {},
                    priority: 'normal',
                    scheduled_for: new Date().toISOString(),
                    status: 'pending',
                  });
                  console.log(`📧 Queued shipped email for order ${order.id} to ${toEmail}`);
                }
              } catch (emailErr) {
                console.error('⚠️ Failed to queue shipped email:', emailErr);
              }
            }
          }
        } 
        else if (isFailed) {
          if (isRetryableZincFailure(existingNotes, zincData)) {
            const { delaySeconds, maxRetries } = getRetryPolicy(existingNotes, zincData);
            updates.status = 'requires_attention';
            updates.notes = {
              ...existingNotes,
              zinc_error: {
                code: getZincErrorCode(existingNotes, zincData),
                message: getZincErrorMessage(existingNotes, zincData) || 'Retryable Zinc failure',
                timestamp: getRetryBaseTimestamp(existingNotes, zincData, order),
              },
              zinc_retry_classification: 'retryable_system',
              zinc_next_retry_delay_seconds: delaySeconds,
              zinc_retry_max: maxRetries,
              failed_detected_via: 'polling',
            };
          } else {
            updates.status = 'failed';
            updates.notes = { ...existingNotes, zinc_error: zincData.message || zincData.error?.message || 'Order failed in Zinc', failed_detected_via: 'polling' };
          }
          
          console.log(`❌ Order ${order.id} failed in Zinc: ${zincData.message || 'unknown'}`);
          results.updated.push(order.id);

          // Queue order_failed email with orderId for full context
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('email, name')
              .eq('id', order.user_id)
              .single();

            const shippingAddr = order.shipping_address as any;
            const toEmail = shippingAddr?.email || profile?.email;
            const recipientName = shippingAddr?.name || profile?.name || 'Customer';

            if (toEmail) {
              await supabase.from('email_queue').insert({
                recipient_email: toEmail,
                recipient_name: recipientName,
                event_type: 'order_failed',
                metadata: { orderId: order.id },
                template_variables: {},
                priority: 'high',
                scheduled_for: new Date().toISOString(),
                status: 'pending',
              });
              console.log(`📧 Queued failed email for order ${order.id} to ${toEmail}`);
            }
          } catch (emailErr) {
            console.error('⚠️ Failed to queue failure email:', emailErr);
          }
        }
        else {
          console.log(`⏳ Order ${order.id} still processing (no final status yet)`);
        }

        // Check if order is stuck (>24 hours in processing)
        const orderAge = Date.now() - new Date(order.created_at).getTime();
        const hoursSinceCreated = orderAge / (1000 * 60 * 60);
        
        if (hoursSinceCreated > 24 && order.status === 'processing') {
          console.warn(`⚠️ Order ${order.id} stuck for ${hoursSinceCreated.toFixed(1)} hours`);
          results.stuck.push(order.id);
          
          await supabase.from('notifications').insert({
            user_id: order.user_id,
            type: 'order_delayed',
            title: 'Order delayed',
            message: `Your order is taking longer than expected. Our team is investigating.`,
            data: {
              order_id: order.id,
              hours_stuck: hoursSinceCreated,
            },
          });
        }

        // Apply updates
        if (Object.keys(updates).length > 1) {
          await supabase
            .from('orders')
            .update(updates)
            .eq('id', order.id);
        }

      } catch (error: any) {
        console.error(`❌ Failed to monitor order ${order.id}:`, error);
        results.failed.push({
          orderId: order.id,
          error: error.message,
        });
      }
    }

    console.log('📊 Order monitoring complete:', results);

    return new Response(
      JSON.stringify({
        success: true,
        monitored: uniqueOrders.length,
        processing: processingOrders?.length || 0,
        shipped_polled: shippedOrders?.length || 0,
        webhook_timeout: webhookTimeoutOrders?.length || 0,
        updated: results.updated.length,
        stuck: results.stuck.length,
        failed: results.failed.length,
        details: results,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('❌ Order monitor error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
