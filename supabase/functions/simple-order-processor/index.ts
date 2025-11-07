import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ZMAOrderRequest {
  orderId: string;
  isScheduled?: boolean;
  scheduledDeliveryDate?: string;
  isAutoGift?: boolean;
  autoGiftContext?: any;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    const { orderId, triggerSource = 'stripe-webhook', isScheduled = false, scheduledDeliveryDate, isAutoGift = false, autoGiftContext, bypassFundingCheck = false } = body;

    console.log(`🚀 SIMPLE ORDER PROCESSOR: Processing order ${orderId} from ${triggerSource}${bypassFundingCheck ? ' (BYPASS FUNDING CHECK)' : ''}`);

    if (!orderId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Order ID is required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id, status, zinc_status, zinc_order_id, payment_status, user_id,
        order_items (
          id, product_id, quantity, price, zinc_product_id, recipient_assignment
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error(`❌ Order ${orderId} not found:`, orderError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Order not found'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Simple idempotency check using Stripe's payment_intent or order status
    if (order.zinc_order_id || order.status === 'completed' || order.status === 'shipped') {
      console.log(`✅ Order ${orderId} already processed`);
      return new Response(JSON.stringify({
        success: true,
        message: 'Order already processed',
        orderId,
        zincOrderId: order.zinc_order_id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify payment before processing
    if (order.payment_status !== 'succeeded') {
      console.log(`⏳ Order ${orderId} payment not confirmed yet`);
      return new Response(JSON.stringify({
        success: false,
        error: 'Payment not confirmed'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Simple rate limiting check (in-memory for now, could be enhanced)
    const { data: rateLimitCheck } = await supabase
      .rpc('check_zma_order_rate_limit', { user_uuid: order.user_id });

    if (!rateLimitCheck) {
      console.error(`🚫 Rate limit exceeded for user ${order.user_id}`);
      await supabase.from('order_notes').insert({
        order_id: orderId,
        note_content: 'Order blocked due to rate limiting',
        note_type: 'rate_limit',
        is_internal: true
      });

      return new Response(JSON.stringify({
        success: false,
        error: 'Rate limit exceeded'
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ZMA FUNDING CHECK: Check if we have enough balance before processing
    // BYPASS: Force process orders (VIP override) skip this check
    if (bypassFundingCheck) {
      console.log(`🚨 BYPASS: Skipping funding check for order ${orderId} (force processed)`);
      
      // Mark as funded immediately
      await supabase
        .from('orders')
        .update({
          funding_status: 'funded',
          funding_allocated_at: new Date().toISOString()
        })
        .eq('id', orderId);
    } else {
      console.log(`💰 Checking ZMA balance for order ${orderId}...`);
      
      try {
        // Get current ZMA balance
        const { data: balanceData, error: balanceError } = await supabase.functions.invoke('manage-zma-accounts', {
          body: { action: 'checkBalance' }
        });

        if (balanceError) {
          console.error(`❌ Failed to check ZMA balance:`, balanceError);
          // Fallback: Mark as funded and proceed (admin can handle manually if needed)
          console.warn(`⚠️ FALLBACK: Proceeding without balance check for order ${orderId}`);
          await supabase
            .from('orders')
            .update({
              funding_status: 'funded',
              funding_allocated_at: new Date().toISOString()
            })
            .eq('id', orderId);
          
          await supabase.from('order_notes').insert({
            order_id: orderId,
            note_content: 'Warning: Processed without funding check due to balance API error',
            note_type: 'funding_warning',
            is_internal: true
          });
        } else {
          const currentBalance = balanceData?.balance || 0;
          
          // Get pending orders value
          const { data: pendingOrders } = await supabase
            .from('orders')
            .select('total_amount')
            .eq('funding_status', 'awaiting_funds');
          
          const pendingValue = pendingOrders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
          const availableBalance = currentBalance - pendingValue;
          
          // Get total amount for current order
          const { data: orderTotal } = await supabase
            .from('orders')
            .select('total_amount')
            .eq('id', orderId)
            .single();
          
          const orderAmount = orderTotal?.total_amount || 0;
          
          console.log(`💰 ZMA Balance: $${currentBalance}, Pending: $${pendingValue}, Available: $${availableBalance}, Order: $${orderAmount}`);
          
          if (availableBalance < orderAmount) {
            console.warn(`⚠️ Insufficient ZMA balance for order ${orderId} - scheduling for later`);
            
            // Calculate expected funding date (Stripe settlement = 4 days)
            const expectedFundingDate = new Date();
            expectedFundingDate.setDate(expectedFundingDate.getDate() + 4);
            const expectedFundingDateStr = expectedFundingDate.toISOString().split('T')[0];
            
            // Calculate scheduled delivery date (funding date + 1 day for processing)
            const scheduledDeliveryDate = new Date(expectedFundingDate);
            scheduledDeliveryDate.setDate(scheduledDeliveryDate.getDate() + 1);
            const scheduledDeliveryDateStr = scheduledDeliveryDate.toISOString().split('T')[0];
            
            // Update order to awaiting funds
            await supabase
              .from('orders')
              .update({
                status: 'scheduled',
                funding_status: 'awaiting_funds',
                funding_hold_reason: 'Insufficient ZMA balance - waiting for Stripe payout',
                expected_funding_date: expectedFundingDateStr,
                scheduled_delivery_date: scheduledDeliveryDateStr,
                updated_at: new Date().toISOString()
              })
              .eq('id', orderId);
            
            // Log funding hold
            await supabase.from('order_notes').insert({
              order_id: orderId,
              note_content: `Order scheduled for ${scheduledDeliveryDateStr} - awaiting ZMA funding (shortfall: $${(orderAmount - availableBalance).toFixed(2)})`,
              note_type: 'funding_hold',
              is_internal: true
            });
            
            // Trigger funding check to create alert
            await supabase.functions.invoke('check-zma-funding-status', {
              body: { triggerSource: 'order_processor' }
            });
            
            return new Response(JSON.stringify({
              success: true,
              message: 'Order scheduled - awaiting ZMA funding',
              orderId,
              status: 'scheduled',
              funding_status: 'awaiting_funds',
              expected_funding_date: expectedFundingDateStr,
              scheduled_delivery_date: scheduledDeliveryDateStr
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          
          // Mark order as funded
          await supabase
            .from('orders')
            .update({
              funding_status: 'funded',
              funding_allocated_at: new Date().toISOString()
            })
            .eq('id', orderId);
          
          console.log(`✅ ZMA funding confirmed for order ${orderId}`);
        }
      } catch (fundingError) {
        console.error(`🚨 Funding check error for order ${orderId}:`, fundingError);
        // Fallback: Proceed but log error
        await supabase.from('order_notes').insert({
          order_id: orderId,
          note_content: `Funding check error: ${fundingError instanceof Error ? fundingError.message : 'Unknown error'}`,
          note_type: 'funding_error',
          is_internal: true
        });
      }
    }

    // Update order status to processing
    await supabase
      .from('orders')
      .update({ 
        status: 'processing',
        zinc_status: 'submitting',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    // Log processing start
    await supabase.from('order_notes').insert({
      order_id: orderId,
      note_content: `Order processing started via ${triggerSource}${isScheduled ? ' (scheduled delivery)' : ''}${isAutoGift ? ' (auto-gift)' : ''}`,
      note_type: 'processing_start',
      is_internal: true
    });

    // Prepare ZMA order request
    const zmaOrderData = {
      order_id: orderId,
      items: order.order_items.map((item: any) => ({
        zinc_product_id: item.zinc_product_id,
        quantity: item.quantity,
        price: item.price,
        recipient_assignment: item.recipient_assignment
      })),
      scheduled_delivery_date: scheduledDeliveryDate,
      is_auto_gift: isAutoGift,
      auto_gift_context: autoGiftContext
    };

    // Get ZMA credentials
    const { data: apiKeys } = await supabase
      .from('api_keys')
      .select('key')
      .eq('user_id', order.user_id)
      .limit(1);

    if (!apiKeys || apiKeys.length === 0) {
      throw new Error('No ZMA API key found for user');
    }

    // Generate webhook token for this order
    const webhookToken = btoa(JSON.stringify({
      orderId,
      timestamp: Date.now(),
      nonce: crypto.randomUUID().substring(0, 12)
    }));

    // Save webhook token to database
    await supabase
      .from('orders')
      .update({ webhook_token: webhookToken })
      .eq('id', orderId);

    const baseWebhookUrl = `https://dmkxtkvlispxeqfzlczr.supabase.co/functions/v1/zinc-webhook-handler?token=${webhookToken}&orderId=${orderId}`;

    // Make ZMA API call
    console.log(`📞 Calling ZMA API for order ${orderId}`);
    const zmaResponse = await fetch('https://api.zinc.io/v1/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(apiKeys[0].key + ':')}`
      },
      body: JSON.stringify({
        idempotency_key: orderId,
        webhooks: {
          tracking_obtained: baseWebhookUrl,
          tracking_updated: baseWebhookUrl,
          status_updated: baseWebhookUrl,
          request_succeeded: baseWebhookUrl,
          request_failed: baseWebhookUrl
        },
        ...zmaOrderData
      })
    });

    const zmaResult = await zmaResponse.json();

    if (!zmaResponse.ok) {
      console.error(`❌ ZMA API error for order ${orderId}:`, zmaResult);
      
      // Update order status to failed
      await supabase
        .from('orders')
        .update({ 
          status: 'failed',
          zinc_status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      // Log the error
      await supabase.from('order_notes').insert({
        order_id: orderId,
        note_content: `ZMA API error: ${JSON.stringify(zmaResult)}`,
        note_type: 'zma_error',
        is_internal: true
      });

      return new Response(JSON.stringify({
        success: false,
        error: 'ZMA API error',
        details: zmaResult
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Success! Update order with ZMA order ID
    await supabase
      .from('orders')
      .update({ 
        zinc_order_id: zmaResult.request_id,
        zinc_status: 'submitted',
        status: isScheduled ? 'scheduled' : 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    // Log success
    await supabase.from('order_notes').insert({
      order_id: orderId,
      note_content: `Order successfully submitted to ZMA. Zinc Order ID: ${zmaResult.request_id}`,
      note_type: 'zma_success',
      is_internal: false
    });

    // Track cost
    if (zmaResult.price_components?.total) {
      await supabase.rpc('track_zma_cost', {
        user_uuid: order.user_id,
        order_uuid: orderId,
        cost: zmaResult.price_components.total
      });
    }

    // Track wishlist purchases (triggers email notification automatically)
    console.log(`📋 Checking for wishlist purchases in order ${orderId}`);
    for (const item of order.order_items) {
      if (!item.product_id) continue;
      
      // Find if this product is on anyone's wishlist
      const { data: wishlistItems } = await supabase
        .from('wishlist_items')
        .select('id, wishlist_id, wishlists(user_id)')
        .eq('product_id', item.product_id);
      
      if (wishlistItems && wishlistItems.length > 0) {
        for (const wishlistItem of wishlistItems) {
          // Don't track if user bought their own wishlist item
          if (wishlistItem.wishlists?.user_id === order.user_id) continue;
          
          console.log(`💝 Tracking wishlist purchase: product ${item.product_id} from wishlist ${wishlistItem.wishlist_id}`);
          
          // Get purchaser name
          const { data: purchaserProfile } = await supabase
            .from('profiles')
            .select('display_name, full_name, email')
            .eq('id', order.user_id)
            .single();
          
          const purchaserName = purchaserProfile?.display_name || 
                               purchaserProfile?.full_name || 
                               purchaserProfile?.email || 
                               'Someone';
          
          // Insert into wishlist_item_purchases (trigger will queue email)
          await supabase.from('wishlist_item_purchases').insert({
            wishlist_id: wishlistItem.wishlist_id,
            item_id: wishlistItem.id,
            product_id: item.product_id,
            purchaser_user_id: order.user_id,
            purchaser_name: purchaserName,
            is_anonymous: false,
            order_id: orderId,
            quantity: item.quantity || 1,
            price_paid: item.price,
            purchased_at: new Date().toISOString()
          });
          
          console.log(`✅ Wishlist purchase tracked - email notification queued`);
        }
      }
    }

    console.log(`✅ Order ${orderId} successfully processed. ZMA Order ID: ${zmaResult.request_id}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Order processed successfully',
      orderId,
      zincOrderId: zmaResult.request_id,
      triggerSource,
      isScheduled,
      isAutoGift
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('🚨 SIMPLE ORDER PROCESSOR ERROR:', error);
    
    // Try to update order status to failed if we have an orderId
    const body = await req.json().catch(() => ({}));
    if (body.orderId) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabase
        .from('orders')
        .update({ 
          status: 'failed',
          zinc_status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', body.orderId);

      await supabase.from('order_notes').insert({
        order_id: body.orderId,
        note_content: `Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        note_type: 'processing_error',
        is_internal: true
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});