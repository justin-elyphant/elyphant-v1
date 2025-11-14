import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();
    
    console.log('📦 Processing order v2:', orderId);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    // Validate payment status
    if (order.payment_status !== 'paid') {
      throw new Error(`Order payment not confirmed: ${order.payment_status}`);
    }

    // Validate order not already processing
    if (order.zinc_request_id) {
      console.log('⚠️ Order already submitted to Zinc:', order.zinc_request_id);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Order already processing',
          zinc_request_id: order.zinc_request_id 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build Zinc API request
    const zincRequest = buildZincRequest(order);
    
    console.log('🔵 Submitting to Zinc API...');

    // Submit to Zinc
    const zincResponse = await fetch('https://api.zinc.io/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(Deno.env.get('ZINC_API_KEY') + ':')}`,
      },
      body: JSON.stringify(zincRequest),
    });

    const zincData = await zincResponse.json();

    if (!zincResponse.ok) {
      throw new Error(`Zinc API error: ${JSON.stringify(zincData)}`);
    }

    console.log('✅ Zinc order submitted:', zincData.request_id);

    // Update order with Zinc details
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        zinc_request_id: zincData.request_id,
        status: 'processing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('❌ Failed to update order:', updateError);
      throw updateError;
    }

    console.log('✅ Order updated to processing status');

    return new Response(
      JSON.stringify({ 
        success: true,
        zinc_request_id: zincData.request_id,
        order_id: orderId,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('❌ Error processing order:', error);
    
    // Update order status to failed
    if (req.body) {
      try {
        const { orderId } = await req.json();
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') || '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
        );
        
        await supabase
          .from('orders')
          .update({
            status: 'failed',
            notes: error.message,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);
      } catch (updateError) {
        console.error('❌ Failed to update order to failed status:', updateError);
      }
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

function buildZincRequest(order: any) {
  const lineItems = order.line_items;
  const shippingAddress = order.shipping_address;

  return {
    retailer: 'amazon',
    products: lineItems.map((item: any) => ({
      product_id: item.product_id,
      quantity: item.quantity,
    })),
    max_price: order.total_amount * 100, // Zinc expects cents
    shipping_address: {
      first_name: shippingAddress.firstName || shippingAddress.first_name,
      last_name: shippingAddress.lastName || shippingAddress.last_name,
      address_line1: shippingAddress.line1 || shippingAddress.address_line1,
      address_line2: shippingAddress.line2 || shippingAddress.address_line2 || '',
      zip_code: shippingAddress.zip || shippingAddress.zip_code,
      city: shippingAddress.city,
      state: shippingAddress.state,
      country: shippingAddress.country || 'US',
    },
    is_gift: order.is_auto_gift || false,
    gift_message: order.gift_options?.message || '',
    shipping: {
      order_by: 'price',
      max_days: 5,
      max_price: 1000, // $10 max shipping
    },
    webhooks: {
      request_succeeded: `${Deno.env.get('SUPABASE_URL')}/functions/v1/zinc-webhook?orderId=${order.id}`,
      request_failed: `${Deno.env.get('SUPABASE_URL')}/functions/v1/zinc-webhook?orderId=${order.id}`,
      tracking_obtained: `${Deno.env.get('SUPABASE_URL')}/functions/v1/zinc-webhook?orderId=${order.id}`,
      tracking_updated: `${Deno.env.get('SUPABASE_URL')}/functions/v1/zinc-webhook?orderId=${order.id}`,
      status_updated: `${Deno.env.get('SUPABASE_URL')}/functions/v1/zinc-webhook?orderId=${order.id}`,
    },
    client_notes: {
      order_id: order.id,
      payment_intent_id: order.payment_intent_id,
    },
  };
}
