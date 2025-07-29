import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🚀 ZMA Function - Full Processing Version');
  
  try {
    const { orderId, cardholderName, isTestMode = false } = await req.json();
    console.log(`📥 Processing order: ${orderId}, cardholder: ${cardholderName}`);
    
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get order with items
    console.log('📋 Fetching order and items...');
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*)
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderError?.message}`);
    }

    console.log(`✅ Order found: ${order.order_number} with ${order.order_items?.length || 0} items`);

    // Update billing info if provided
    if (cardholderName) {
      console.log(`💳 Updating billing info with: ${cardholderName}`);
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          billing_info: { ...order.billing_info, cardholderName },
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('❌ Billing update error:', updateError);
      } else {
        console.log('✅ Billing info updated');
        order.billing_info = { ...order.billing_info, cardholderName };
      }
    }

    // Get ZMA account
    console.log('🔐 Fetching ZMA account...');
    const { data: zmaAccounts, error: zmaError } = await supabase
      .from('zma_accounts')
      .select('*')
      .eq('is_default', true);

    if (zmaError || !zmaAccounts || zmaAccounts.length === 0) {
      throw new Error('No default ZMA account found');
    }

    const zmaAccount = zmaAccounts[0];
    console.log(`🔐 Using ZMA account: ${zmaAccount.account_name}`);

    // Prepare order data for ZMA API
    const shippingAddress = order.shipping_info;
    const nameParts = (shippingAddress.name || "").split(" ");
    const firstName = nameParts[0] || "Customer";
    const lastName = nameParts.slice(1).join(" ") || "Name";

    const orderData = {
      retailer: "amazon",
      products: order.order_items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity
      })),
      shipping_address: {
        first_name: firstName,
        last_name: lastName,
        address_line1: shippingAddress.address,
        address_line2: shippingAddress.addressLine2 || "",
        zip_code: shippingAddress.zipCode,
        city: shippingAddress.city,
        state: shippingAddress.state,
        country: "US"
      },
      is_gift: order.is_gift || false,
      gift_message: order.gift_message || "",
      is_test: isTestMode
    };

    console.log(`📦 Prepared order for ${orderData.products.length} products`);

    // Call ZMA API
    console.log('📡 Calling ZMA API...');
    const zmaResponse = await fetch('https://api.priceyak.com/v2/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${zmaAccount.api_key}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Elyphant-ZMA/1.0'
      },
      body: JSON.stringify(orderData)
    });

    console.log(`⏱️ ZMA API responded: ${zmaResponse.status}`);

    if (zmaResponse.ok) {
      const zmaOrder = await zmaResponse.json();
      const zmaOrderId = zmaOrder.request_id || zmaOrder.id;
      
      console.log(`✅ ZMA order created: ${zmaOrderId}`);

      // Update order in database
      await supabase
        .from('orders')
        .update({
          zma_order_id: zmaOrderId,
          zma_account_used: zmaAccount.account_name,
          status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      // Add order note
      await supabase
        .from('order_notes')
        .insert({
          order_id: orderId,
          note_content: `ZMA order successfully submitted. ZMA Order ID: ${zmaOrderId}. Account: ${zmaAccount.account_name}.`,
          note_type: 'system',
          is_internal: true
        });

      console.log('✅ Database updated successfully');

      return new Response(JSON.stringify({
        success: true,
        zmaOrderId,
        orderId,
        zmaAccount: zmaAccount.account_name,
        message: 'Order successfully submitted to ZMA'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

    } else {
      const errorText = await zmaResponse.text();
      console.error(`❌ ZMA API error: ${zmaResponse.status} - ${errorText}`);
      
      // Log error to database
      await supabase
        .from('order_notes')
        .insert({
          order_id: orderId,
          note_content: `ZMA order submission failed. Status: ${zmaResponse.status}. Error: ${errorText}`,
          note_type: 'error',
          is_internal: true
        });

      throw new Error(`ZMA API error: ${zmaResponse.status} - ${errorText}`);
    }

  } catch (error) {
    console.error('🚨 ZMA function error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});