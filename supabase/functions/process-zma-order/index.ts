import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestBody = await req.json();
    console.log(`🔍 Raw request body:`, JSON.stringify(requestBody, null, 2));
    
    const { order_id, orderId, products, shipping_address, retryAttempt } = requestBody;
    
    // Handle both order_id and orderId for compatibility
    const finalOrderId = order_id || orderId;
    
    // Validate that we have a valid UUID
    if (!finalOrderId || finalOrderId === 'undefined' || typeof finalOrderId !== 'string') {
      console.error(`❌ Invalid order ID received:`, { 
        order_id, 
        orderId, 
        finalOrderId, 
        requestBody: JSON.stringify(requestBody, null, 2) 
      });
      throw new Error(`Invalid order ID: ${finalOrderId}`);
    }
    
    // Validate UUID format (basic check)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(finalOrderId)) {
      console.error(`❌ Invalid UUID format:`, finalOrderId);
      throw new Error(`Invalid UUID format: ${finalOrderId}`);
    }
    
    console.log(`🔄 Processing ZMA order ${finalOrderId}${retryAttempt ? ' (retry)' : ''}`);

    // If orderId is provided without products, fetch order details from database
    if (finalOrderId && !products) {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_id,
            quantity,
            unit_price
          )
        `)
        .eq('id', finalOrderId)
        .maybeSingle();

      if (orderError) {
        console.error(`❌ Database error fetching order:`, orderError);
        throw new Error(`Database error: ${orderError.message}`);
      }

      if (!orderData) {
        console.error(`❌ Order not found: ${finalOrderId}`);
        throw new Error('Order not found');
      }

      // Use order data from database
      var order_id = finalOrderId;
      
      // Handle both new format (order_items) and legacy format (products in order)
      if (orderData.order_items && orderData.order_items.length > 0) {
        // New format: separate order_items table
        var products = orderData.order_items.map((item: any) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          max_price: item.unit_price
        }));
      } else if (orderData.products && Array.isArray(orderData.products)) {
        // Legacy format: products stored directly in orders table
        console.log(`📦 Using legacy order format for order ${finalOrderId}`);
        var products = orderData.products.map((item: any) => ({
          product_id: item.product_id || item.id,
          quantity: item.quantity || 1,
          max_price: item.price || item.unit_price || item.max_price
        }));
      } else {
        console.error(`❌ No product data found in order ${finalOrderId}`);
        throw new Error('No product data found in order');
      }
      
      var shipping_address = orderData.shipping_info;
    } else {
      var order_id = finalOrderId;
    }

    // Get default ZMA account
    const { data: zmaAccount, error: accountError } = await supabase
      .from('zma_accounts')
      .select('*')
      .eq('is_default', true)
      .eq('account_status', 'active')
      .maybeSingle();

    if (accountError) {
      console.error(`❌ Error fetching ZMA account:`, accountError);
      throw new Error(`Database error: ${accountError.message}`);
    }

    if (!zmaAccount) {
      console.error(`❌ No active ZMA account found`);
      throw new Error('No active ZMA account available');
    }

    console.log(`📱 Using ZMA account: ${zmaAccount.account_name}`);

    // Update order with ZMA method
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        order_method: 'zma',
        zma_account_used: zmaAccount.account_name,
        status: 'processing'
      })
      .eq('id', order_id);

    if (updateError) {
      console.error(`❌ Failed to update order:`, updateError);
      throw updateError;
    }

    // Debug: Log the data we're working with
    console.log(`🔍 Order ID: ${order_id}`);
    console.log(`🔍 Products:`, JSON.stringify(products, null, 2));
    console.log(`🔍 Shipping address:`, JSON.stringify(shipping_address, null, 2));

    // Process order through PriceYak API (ZMA)
    const zmaOrderRequest = {
      products: products.map((product: any) => ({
        product_id: product.product_id,
        quantity: product.quantity,
        max_price: product.max_price
      })),
      shipping_address: {
        first_name: shipping_address.first_name || shipping_address.name?.split(' ')[0] || 'Unknown',
        last_name: shipping_address.last_name || shipping_address.name?.split(' ').slice(1).join(' ') || 'Unknown',
        address_line1: shipping_address.address_line1 || shipping_address.address,
        address_line2: shipping_address.address_line2 || shipping_address.addressLine2 || '',
        zip_code: shipping_address.zip_code || shipping_address.zipCode,
        city: shipping_address.city,
        state: shipping_address.state,
        country: shipping_address.country
      },
      retailer: 'amazon',
      max_price: products.reduce((sum: number, p: any) => sum + (p.max_price * p.quantity), 0)
    };

    console.log(`🛒 ZMA order request:`, JSON.stringify(zmaOrderRequest, null, 2));

    // Call PriceYak API
    const priceYakResponse = await fetch('https://api.priceyak.com/v2/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${zmaAccount.api_key}`
      },
      body: JSON.stringify(zmaOrderRequest)
    });

    const zmaResult = await priceYakResponse.json();
    console.log(`📦 ZMA API response:`, JSON.stringify(zmaResult, null, 2));

    if (!priceYakResponse.ok) {
      console.error(`❌ ZMA order failed:`, zmaResult);
      
      // Update order status to failed
      await supabase
        .from('orders')
        .update({
          status: 'failed',
          notes: `ZMA processing failed: ${zmaResult.message || 'Unknown error'}`
        })
        .eq('id', order_id);

      throw new Error(`ZMA order failed: ${zmaResult.message || 'Unknown error'}`);
    }

    // Update order with ZMA order ID and success status
    const { error: finalUpdateError } = await supabase
      .from('orders')
      .update({
        zma_order_id: zmaResult.id,
        status: 'completed',
        zinc_status: 'placed',
        notes: `ZMA order placed successfully. ZMA Order ID: ${zmaResult.id}`
      })
      .eq('id', order_id);

    if (finalUpdateError) {
      console.error(`❌ Failed to update order with ZMA details:`, finalUpdateError);
    }

    console.log(`✅ ZMA order ${order_id} processed successfully. ZMA Order ID: ${zmaResult.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        zma_order_id: zmaResult.id,
        message: 'ZMA order processed successfully',
        order_details: zmaResult
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ ZMA order processing error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: 'Failed to process ZMA order'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});