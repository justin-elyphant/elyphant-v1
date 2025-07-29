import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  console.log('🚀 Function started');
  
  try {
    console.log('🔧 Creating Supabase client');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    console.log('✅ Supabase client created');

    console.log('📥 Parsing request body');

    const requestBody = await req.json();
    console.log(`🔍 Raw request body:`, JSON.stringify(requestBody, null, 2));
    
    // Quick test response to verify CORS is working
    return new Response(
      JSON.stringify({
        success: true,
        message: 'CORS test successful - ZMA function is reachable',
        receivedData: requestBody
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
    
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

    // Initialize variables
    let order_id = finalOrderId;
    let finalProducts = products;
    let finalShippingAddress = shipping_address;
    let zmaAccount = null;

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

      console.log(`📋 Order data retrieved:`, {
        id: orderData.id,
        status: orderData.status,
        zma_order_id: orderData.zma_order_id,
        hasExistingZmaId: !!orderData.zma_order_id
      });

      // Get ZMA account first for potential retry operations
      const { data: zmaAccountData, error: accountError } = await supabase
        .from('zma_accounts')
        .select('*')
        .eq('is_default', true)
        .eq('account_status', 'active')
        .maybeSingle();

      if (accountError) {
        console.error(`❌ Error fetching ZMA account:`, accountError);
        throw new Error(`Database error: ${accountError.message}`);
      }

      if (!zmaAccountData) {
        console.error(`❌ No active ZMA account found`);
        throw new Error('No active ZMA account available');
      }

      zmaAccount = zmaAccountData;
      console.log(`📱 Using ZMA account: ${zmaAccount.account_name}`);

      // Check if this is a true retry (order already has ZMA order ID) vs reprocessing
      if (retryAttempt && orderData.zma_order_id) {
        console.log(`🔄 True retry detected - using Zinc retry API for ZMA order: ${orderData.zma_order_id}`);
        
        // For true retries, use Zinc's retry API endpoint
        const retryResponse = await fetch(`https://api.zinc.io/v1/orders/${orderData.zma_order_id}/retry`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(zmaAccount.api_key + ':')}`
          }
        });

        const retryResult = await retryResponse.json();
        console.log(`🔄 Zinc retry API response:`, JSON.stringify(retryResult, null, 2));

        if (!retryResponse.ok) {
          console.error(`❌ Zinc retry failed:`, retryResult);
          
          await supabase
            .from('orders')
            .update({
              status: 'failed',
              notes: `Zinc retry failed: ${retryResult.message || 'Unknown error'}`
            })
            .eq('id', finalOrderId);

          throw new Error(`Zinc retry failed: ${retryResult.message || 'Unknown error'}`);
        }

        // Update order with retry response
        const { error: retryUpdateError } = await supabase
          .from('orders')
          .update({
            status: 'processing',
            zinc_status: 'retried',
            notes: `Order retried successfully. New request ID: ${retryResult.request_id}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', finalOrderId); // Use finalOrderId instead of order_id to ensure it's valid

        if (retryUpdateError) {
          console.error(`❌ Failed to update order after retry:`, retryUpdateError);
        }

        console.log(`✅ Order ${finalOrderId} retried successfully. New request ID: ${retryResult.request_id}`);

        return new Response(
          JSON.stringify({
            success: true,
            request_id: retryResult.request_id,
            message: 'Order retried successfully via Zinc retry API',
            retry: true
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      console.log(`🆕 ${retryAttempt ? 'Reprocessing order without external ID' : 'Processing new order'}`);

      // Handle both new format (order_items) and legacy format (products in order)
      if (orderData.order_items && orderData.order_items.length > 0) {
        // New format: separate order_items table
        finalProducts = orderData.order_items.map((item: any) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          max_price: item.unit_price
        }));
      } else if (orderData.products && Array.isArray(orderData.products)) {
        // Legacy format: products stored directly in orders table
        console.log(`📦 Using legacy order format for order ${finalOrderId}`);
        finalProducts = orderData.products.map((item: any) => ({
          product_id: item.product_id || item.id,
          quantity: item.quantity || 1,
          max_price: item.price || item.unit_price || item.max_price
        }));
      } else {
        console.error(`❌ No product data found in order ${finalOrderId}`);
        throw new Error('No product data found in order');
      }
      
      finalShippingAddress = orderData.shipping_info;
    }

    // Get ZMA account if not already fetched
    if (!zmaAccount) {
      const { data: zmaAccountData, error: accountError } = await supabase
        .from('zma_accounts')
        .select('*')
        .eq('is_default', true)
        .eq('account_status', 'active')
        .maybeSingle();

      if (accountError) {
        console.error(`❌ Error fetching ZMA account:`, accountError);
        throw new Error(`Database error: ${accountError.message}`);
      }

      if (!zmaAccountData) {
        console.error(`❌ No active ZMA account found`);
        throw new Error('No active ZMA account available');
      }

      zmaAccount = zmaAccountData;
      console.log(`📱 Using ZMA account: ${zmaAccount.account_name}`);
    }

    // Update order with ZMA method - use finalOrderId for consistency
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        order_method: 'zma',
        zma_account_used: zmaAccount.account_name,
        status: 'processing'
      })
      .eq('id', finalOrderId);

    if (updateError) {
      console.error(`❌ Failed to update order:`, updateError);
      throw updateError;
    }

    // Debug: Log the data we're working with
    console.log(`🔍 Order ID: ${finalOrderId}`);
    console.log(`🔍 Products:`, JSON.stringify(finalProducts, null, 2));
    console.log(`🔍 Shipping address:`, JSON.stringify(finalShippingAddress, null, 2));

    // Process order through PriceYak API (ZMA)
    const zmaOrderRequest = {
      products: finalProducts.map((product: any) => ({
        product_id: product.product_id,
        quantity: product.quantity,
        max_price: product.max_price
      })),
      shipping_address: {
        first_name: finalShippingAddress.first_name || finalShippingAddress.name?.split(' ')[0] || 'Unknown',
        last_name: finalShippingAddress.last_name || finalShippingAddress.name?.split(' ').slice(1).join(' ') || 'Unknown',
        address_line1: finalShippingAddress.address_line1 || finalShippingAddress.address,
        address_line2: finalShippingAddress.address_line2 || finalShippingAddress.addressLine2 || '',
        zip_code: finalShippingAddress.zip_code || finalShippingAddress.zipCode,
        city: finalShippingAddress.city,
        state: finalShippingAddress.state,
        country: finalShippingAddress.country
      },
      retailer: 'amazon',
      max_price: finalProducts.reduce((sum: number, p: any) => sum + (p.max_price * p.quantity), 0)
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
        .eq('id', finalOrderId);

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
      .eq('id', finalOrderId);

    if (finalUpdateError) {
      console.error(`❌ Failed to update order with ZMA details:`, finalUpdateError);
    }

    console.log(`✅ ZMA order ${finalOrderId} processed successfully. ZMA Order ID: ${zmaResult.id}`);

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