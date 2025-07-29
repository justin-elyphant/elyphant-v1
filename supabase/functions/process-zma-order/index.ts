import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight handled');
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🚀 ZMA Function - Debug Version Started');
  
  try {
    // Step 1: Parse request
    console.log('📥 Step 1: Parsing request body...');
    let body;
    try {
      body = await req.json();
      console.log('✅ Request body parsed:', JSON.stringify(body));
    } catch (parseError) {
      console.error('❌ JSON parsing failed:', parseError);
      throw new Error(`Invalid JSON: ${parseError.message}`);
    }

    const { orderId, cardholderName } = body;
    
    if (!orderId) {
      console.log('❌ No order ID provided');
      throw new Error('Order ID is required');
    }

    console.log(`🔍 Processing order: ${orderId}, cardholder: ${cardholderName}`);

    // Step 2: Create Supabase client
    console.log('📥 Step 2: Creating Supabase client...');
    let supabase;
    try {
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.45.0');
      supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      console.log('✅ Supabase client created');
    } catch (supabaseError) {
      console.error('❌ Supabase client creation failed:', supabaseError);
      throw new Error(`Supabase setup failed: ${supabaseError.message}`);
    }

    // Step 3: Get full order data
    console.log('📥 Step 3: Getting full order data...');
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !orderData) {
      console.error('❌ Order lookup error:', orderError);
      throw new Error(`Order not found: ${orderError?.message || 'Unknown error'}`);
    }

    console.log(`✅ Order found: ${orderData.order_number}`);

    // Step 4: Get order items
    console.log('📥 Step 4: Getting order items...');
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (itemsError || !orderItems || orderItems.length === 0) {
      console.error('❌ Order items error:', itemsError);
      throw new Error('No order items found');
    }

    console.log(`✅ Found ${orderItems.length} order items`);

    // Step 5: Get ZMA credentials
    console.log('📥 Step 5: Getting ZMA credentials...');
    const { data: zmaCredentials, error: credError } = await supabase
      .from('elyphant_amazon_credentials')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (credError || !zmaCredentials) {
      console.error('❌ ZMA credentials error:', credError);
      throw new Error('No active ZMA credentials found');
    }

    console.log('✅ ZMA credentials retrieved');

    // Step 6: Prepare Zinc API order data
    console.log('📥 Step 6: Preparing Zinc API request...');
    const zincOrderData = {
      retailer: "amazon",
      products: orderItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity
      })),
      max_price: Math.round((orderData.total_amount + 10) * 100), // Add buffer and convert to cents
      shipping_address: {
        first_name: orderData.shipping_info.name.split(' ')[0] || 'Customer',
        last_name: orderData.shipping_info.name.split(' ').slice(1).join(' ') || 'Name',
        address_line1: orderData.shipping_info.address,
        address_line2: orderData.shipping_info.addressLine2 || '',
        zip_code: orderData.shipping_info.zipCode,
        city: orderData.shipping_info.city,
        state: orderData.shipping_info.state,
        country: orderData.shipping_info.country === 'United States' ? 'US' : orderData.shipping_info.country,
        phone_number: '5551234567' // Default phone for now
      },
      is_gift: orderData.is_gift || false,
      gift_message: orderData.gift_message || '',
      retailer_credentials: {
        email: zmaCredentials.email,
        password: zmaCredentials.encrypted_password,
        totp_2fa_key: zmaCredentials.totp_2fa_key || undefined
      },
      client_notes: {
        our_internal_order_id: orderData.order_number,
        supabase_order_id: orderId,
        created_via: 'elyphant_zma_system'
      }
    };

    console.log('✅ Zinc order data prepared');

    // Step 7: Call Zinc API
    console.log('📥 Step 7: Calling Zinc API...');
    const zincApiKey = Deno.env.get('ZINC_API_KEY');
    if (!zincApiKey) {
      throw new Error('ZINC_API_KEY not configured');
    }

    const zincResponse = await fetch('https://api.zinc.io/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(zincApiKey + ':')}`
      },
      body: JSON.stringify(zincOrderData)
    });

    const zincResult = await zincResponse.json();
    console.log('📤 Zinc API response:', JSON.stringify(zincResult));

    if (!zincResponse.ok) {
      console.error('❌ Zinc API error:', zincResult);
      throw new Error(`Zinc API error: ${zincResult.message || 'Unknown error'}`);
    }

    // Step 8: Update order with Zinc request ID
    console.log('📥 Step 8: Updating order with Zinc data...');
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        zma_order_id: zincResult.request_id,
        status: 'processing',
        zma_account_used: zmaCredentials.email,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('❌ Order update error:', updateError);
      throw new Error(`Failed to update order: ${updateError.message}`);
    }

    console.log('✅ Order successfully submitted to Zinc and updated');
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Order successfully submitted to ZMA/Zinc!',
      orderId: orderId,
      zincRequestId: zincResult.request_id,
      zmaAccount: zmaCredentials.email,
      debug: {
        step1_parseRequest: '✅ Success',
        step2_supabaseClient: '✅ Success', 
        step3_orderExists: '✅ Success',
        step4_orderItems: '✅ Success',
        step5_zmaCredentials: '✅ Success',
        step6_prepareZincData: '✅ Success',
        step7_callZincAPI: '✅ Success',
        step8_updateOrder: '✅ Success'
      },
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('🚨 ZMA Debug Error:', error);
    console.error('🚨 Error stack:', error.stack);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      debug: 'Check the edge function logs for detailed debugging info'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});