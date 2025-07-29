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
    const { order_id, orderId, products, shipping_address, retryAttempt } = requestBody;
    
    // Handle both order_id and orderId for compatibility
    const finalOrderId = order_id || orderId;
    
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
            price
          )
        `)
        .eq('id', finalOrderId)
        .single();

      if (orderError || !orderData) {
        console.error(`❌ Failed to fetch order data:`, orderError);
        throw new Error('Order not found');
      }

      // Use order data from database
      var order_id = finalOrderId;
      var products = orderData.order_items?.map((item: any) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        max_price: item.price
      })) || [];
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
      .single();

    if (accountError || !zmaAccount) {
      console.error(`❌ No active ZMA account found:`, accountError);
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

    // Process order through PriceYak API (ZMA)
    const zmaOrderRequest = {
      products: products.map((product: any) => ({
        product_id: product.product_id,
        quantity: product.quantity,
        max_price: product.max_price
      })),
      shipping_address: {
        first_name: shipping_address.first_name,
        last_name: shipping_address.last_name,
        address_line1: shipping_address.address_line1,
        address_line2: shipping_address.address_line2 || '',
        zip_code: shipping_address.zip_code,
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