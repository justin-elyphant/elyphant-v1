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
    const { orderId, triggerSource = 'stripe-webhook', isScheduled = false, scheduledDeliveryDate, isAutoGift = false, autoGiftContext } = body;

    console.log(`🚀 SIMPLE ORDER PROCESSOR: Processing order ${orderId} from ${triggerSource}`);

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