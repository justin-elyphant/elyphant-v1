import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Query 1: Existing logic - orders with zinc_order_id (webhook received)
    const { data: processingOrders, error: fetchError1 } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'processing')
      .not('zinc_order_id', 'is', null)
      .order('created_at', { ascending: true });

    if (fetchError1) {
      throw fetchError1;
    }

    // Query 2: NEW - orders missing webhooks (zinc_request_id exists but no zinc_order_id)
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

    const allOrders = [
      ...(processingOrders || []),
      ...(webhookTimeoutOrders || [])
    ];

    console.log(`📦 Monitoring ${processingOrders?.length || 0} processing orders + ${webhookTimeoutOrders?.length || 0} webhook-timeout orders`);

    const results = {
      updated: [] as string[],
      stuck: [] as string[],
      failed: [] as { orderId: string; error: string }[],
    };

    for (const order of allOrders) {
      try {
        // Use zinc_request_id if zinc_order_id is missing (webhook timeout case)
        const zincIdentifier = order.zinc_order_id || order.zinc_request_id;
        const isWebhookTimeout = !order.zinc_order_id && order.zinc_request_id;

        console.log(`🔍 Checking Zinc status for order: ${order.id} (${zincIdentifier}${isWebhookTimeout ? ' - WEBHOOK TIMEOUT' : ''})`);

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
        
        // Update order based on Zinc status
        const updates: any = {
          updated_at: new Date().toISOString(),
        };

        // Parse Zinc response - handle actual API structure
        // Zinc returns: _type: 'order_response', merchant_order_ids: [{merchant_order_id, tracking_url}], delivery_dates: [{date}]
        const isSuccessful = zincData._type === 'order_response' ||
          zincData.status_updates?.some((u: any) => u.type === 'request.finished' && u.data?.success);
        
        // Extract merchant order ID from correct nested location
        const merchantOrderId = zincData.merchant_order_ids?.[0]?.merchant_order_id ||
          zincData.merchant_order_id;
        
        // Extract delivery date from correct location
        const estimatedDelivery = zincData.delivery_dates?.[0]?.date ||
          zincData.tracking?.estimated_delivery;
        
        // Extract tracking info
        const trackingUrl = zincData.merchant_order_ids?.[0]?.tracking_url ||
          zincData.tracking?.tracking_url;
        
        const trackingNumber = zincData.tracking?.tracking_number;
        
        // Check for failed status
        const isFailed = zincData.code === 'failed' || zincData.code === 'cancelled' ||
          zincData._type === 'error';

        // NEW: If we found the order via polling (webhook timeout), populate zinc_order_id
        if (isWebhookTimeout && merchantOrderId) {
          console.log(`🔄 WEBHOOK TIMEOUT RECOVERY: Found order via polling for ${order.id}`);
          updates.zinc_order_id = merchantOrderId;
          updates.webhook_received_at = null; // Indicate this was caught by polling, not webhook
          
          // Add metadata about recovery method
          updates.notes = order.notes 
            ? `${order.notes} | Recovered via polling (webhook timeout)` 
            : 'Recovered via polling (webhook timeout)';
        }

        if (isSuccessful && merchantOrderId) {
          updates.status = 'shipped';
          updates.zinc_order_id = merchantOrderId;
          if (trackingNumber) updates.tracking_number = trackingNumber;
          if (estimatedDelivery) updates.estimated_delivery = estimatedDelivery;
          if (trackingUrl) {
            // Store tracking URL in notes or a dedicated field
            const trackingNote = `Tracking: ${trackingUrl}`;
            updates.notes = updates.notes ? `${updates.notes} | ${trackingNote}` : trackingNote;
          }
          
          console.log(`✅ Order ${order.id} placed with merchant: ${merchantOrderId}, delivery: ${estimatedDelivery}`);
          results.updated.push(order.id);
          
          // Queue shipped email (mirrors zinc-webhook behavior)
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
                event_type: 'order_shipped',
                template_variables: {
                  order_number: order.order_number,
                  customer_name: recipientName,
                  tracking_number: trackingNumber || null,
                  tracking_url: trackingUrl || null,
                  estimated_delivery: estimatedDelivery || null,
                },
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
        else if (zincData.code === 'delivered') {
          updates.status = 'delivered';
          updates.fulfilled_at = new Date().toISOString();
          
          console.log(`📬 Order ${order.id} delivered`);
          results.updated.push(order.id);
        }
        else if (isFailed) {
          updates.status = 'failed';
          updates.notes = zincData.message || zincData.error?.message || 'Order failed in Zinc';
          
          console.log(`❌ Order ${order.id} failed in Zinc: ${updates.notes}`);
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
          
          // Send notification
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
        monitored: processingOrders?.length || 0,
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
