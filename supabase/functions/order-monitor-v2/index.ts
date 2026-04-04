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
    console.log('👁️ Running order monitor...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

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

    // Query 2: Orders missing webhooks (zinc_request_id exists but no zinc_order_id)
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
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

    const allOrders = [
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

    console.log(`📦 Monitoring ${processingOrders?.length || 0} processing + ${webhookTimeoutOrders?.length || 0} webhook-timeout + ${shippedOrders?.length || 0} shipped orders (${uniqueOrders.length} unique)`);

    const results = {
      updated: [] as string[],
      stuck: [] as string[],
      failed: [] as { orderId: string; error: string }[],
    };

    for (const order of uniqueOrders) {
      try {
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

        // Build existing notes as proper object
        const existingNotes = (typeof order.notes === 'object' && order.notes !== null) ? order.notes : {};

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
          updates.status = 'failed';
          updates.notes = { ...existingNotes, zinc_error: zincData.message || zincData.error?.message || 'Order failed in Zinc', failed_detected_via: 'polling' };
          
          console.log(`❌ Order ${order.id} failed in Zinc: ${zincData.message || 'unknown'}`);
          results.updated.push(order.id);
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
