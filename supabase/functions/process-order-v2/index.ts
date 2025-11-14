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

  let orderId: string | null = null;

  try {
    const body = await req.json();
    orderId = body.orderId;
    
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

    // Fetch order items
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', orderId);

    if (itemsError || !orderItems || orderItems.length === 0) {
      throw new Error(`No order items found for order: ${orderId}`);
    }

    // Validate shipping info completeness
    console.log('🔍 Validating shipping information...');
    const shippingInfo = order.shipping_info;

    if (!shippingInfo) {
      throw new Error('No shipping information provided');
    }

    const requiredFields = {
      name: shippingInfo.name,
      address: shippingInfo.address_line1 || shippingInfo.address,
      city: shippingInfo.city,
      state: shippingInfo.state,
      zip_code: shippingInfo.zip_code || shippingInfo.zipCode,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value || (typeof value === 'string' && value.trim() === ''))
      .map(([key, _]) => key);

    if (missingFields.length > 0) {
      console.error('❌ Incomplete shipping address:', missingFields);
      
      // Update order to failed status with clear error
      await supabase
        .from('orders')
        .update({
          status: 'failed',
          zma_error: JSON.stringify({
            error_code: 'incomplete_shipping_address',
            missing_fields: missingFields,
            message: `Cannot submit to Zinc: missing ${missingFields.join(', ')}`,
            timestamp: new Date().toISOString(),
          }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      throw new Error(
        `Incomplete shipping address. Missing required fields: ${missingFields.join(', ')}`
      );
    }

    console.log('✅ Shipping information validated');

    // Build Zinc API request
    const zincRequest = buildZincRequest(order, orderItems);
    
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
        zinc_status: 'pending',
        last_zinc_update: new Date().toISOString(),
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
    if (orderId) {
      try {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') || '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
        );
        
        // Check if error was already set (e.g., by shipping validation)
        const { data: currentOrder } = await supabase
          .from('orders')
          .select('zma_error')
          .eq('id', orderId)
          .single();

        // Only update error if not already set (preserves structured errors)
        const updateData: any = {
          status: 'failed',
          updated_at: new Date().toISOString(),
        };

        if (!currentOrder?.zma_error) {
          updateData.zma_error = error.message;
        }

        await supabase
          .from('orders')
          .update(updateData)
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

function buildZincRequest(order: any, orderItems: any[]) {
  const shippingInfo = order.shipping_info;
  
  // Split name into first/last (shipping_info stores full name)
  const nameParts = (shippingInfo.name || '').split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  return {
    retailer: 'amazon',
    products: orderItems.map((item: any) => ({
      product_id: item.product_id,
      quantity: item.quantity,
    })),
    max_price: order.total_amount * 100, // Zinc expects cents
    shipping_address: {
      first_name: firstName,
      last_name: lastName,
      address_line1: shippingInfo.address_line1 || shippingInfo.address,
      address_line2: shippingInfo.address_line2 || shippingInfo.addressLine2 || '',
      zip_code: shippingInfo.zip_code || shippingInfo.zipCode,
      city: shippingInfo.city,
      state: shippingInfo.state,
      country: 'US',
      phone_number: shippingInfo.phone || '5551234567',
    },
    is_gift: order.is_gift || false,
    gift_message: order.gift_message || order.gift_options?.message || '',
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
      supabase_order_id: order.id,
      payment_intent_id: order.payment_intent_id,
      checkout_session_id: order.checkout_session_id,
    },
  };
}
