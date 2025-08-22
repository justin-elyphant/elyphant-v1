import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ZMA Security Validation Functions
async function performZmaSecurityValidation(context, supabase) {
  const result = {
    passed: true,
    blocked: false,
    warnings: [],
    errors: [],
    metadata: {}
  };

  try {
    console.log('🔍 Running rate limit check...');
    // 1. Rate Limiting Check
    const { data: canOrder } = await supabase
      .rpc('check_zma_order_rate_limit', { user_uuid: context.userId });
    
    if (!canOrder) {
      result.blocked = true;
      result.passed = false;
      result.errors.push('Rate limit exceeded');
      
      await logZmaSecurityEvent('rate_limit_exceeded', {
        userId: context.userId,
        orderId: context.orderId
      }, 'warning', supabase);
    }

    console.log('🔍 Running cost limit check...');
    // 2. Cost Limit Check
    const { data: costData } = await supabase
      .from('zma_cost_tracking')
      .select('daily_total, monthly_total')
      .eq('user_id', context.userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const dailySpent = costData?.daily_total || 0;
    const monthlySpent = costData?.monthly_total || 0;
    const dailyLimit = 500;
    const monthlyLimit = 2000;
    const orderAmount = context.orderData.total_amount;
    
    if ((dailySpent + orderAmount) > dailyLimit || (monthlySpent + orderAmount) > monthlyLimit) {
      result.blocked = true;
      result.passed = false;
      result.errors.push('Cost limit exceeded');
      
      await logZmaSecurityEvent('cost_limit_exceeded', {
        userId: context.userId,
        orderId: context.orderId,
        orderAmount,
        dailySpent,
        monthlySpent
      }, 'critical', supabase);
    }

    console.log('🔍 Running order validation...');
    // 3. Order Validation (duplicates, suspicious patterns)
    const orderHash = btoa(JSON.stringify({
      products: context.orderData.products?.map(p => ({ id: p.product_id, quantity: p.quantity })),
      shipping: context.orderData.shipping_info,
      amount: context.orderData.total_amount
    }));

    const { data: validationResult } = await supabase
      .rpc('validate_zma_order', {
        user_uuid: context.userId,
        order_hash_param: orderHash,
        order_amount: context.orderData.total_amount
      });

    if (!validationResult?.is_valid) {
      if (validationResult?.is_suspicious_pattern) {
        result.blocked = true;
        result.passed = false;
        result.errors.push('Suspicious order pattern detected');
      } else if (validationResult?.is_duplicate) {
        result.warnings.push('Duplicate order detected');
      }
      
      await logZmaSecurityEvent('validation_failed', {
        userId: context.userId,
        orderId: context.orderId,
        validationData: validationResult
      }, validationResult?.is_suspicious_pattern ? 'critical' : 'warning', supabase);
    }

    console.log('🔍 Running retry abuse check...');
    // 4. Retry Abuse Check
    if (context.isRetry) {
      const { data: rateLimitData } = await supabase
        .from('zma_order_rate_limits')
        .select('consecutive_failures')
        .eq('user_id', context.userId)
        .maybeSingle();

      const consecutiveFailures = rateLimitData?.consecutive_failures || 0;
      const retryCount = context.retryCount || 0;
      
      if (retryCount > 3 || consecutiveFailures > 5) {
        result.blocked = true;
        result.passed = false;
        result.errors.push('Retry abuse detected');
        
        await logZmaSecurityEvent('retry_abuse', {
          userId: context.userId,
          orderId: context.orderId,
          retryCount,
          consecutiveFailures
        }, 'critical', supabase);
      }
    }

  } catch (error) {
    console.error('Security validation error:', error);
    result.warnings.push('Security check system error');
  }

  return result;
}

async function logZmaSecurityEvent(eventType, eventData, severity, supabase) {
  try {
    await supabase
      .from('zma_security_events')
      .insert({
        user_id: eventData.userId,
        order_id: eventData.orderId || null,
        event_type: eventType,
        event_data: eventData,
        severity
      });

    console.warn(`ZMA Security Event [${severity.toUpperCase()}]: ${eventType}`, eventData);
  } catch (error) {
    console.error('Failed to log ZMA security event:', error);
  }
}

async function trackZmaOrderSuccess(userId, orderId, cost, supabase) {
  try {
    // Track the cost
    await supabase.rpc('track_zma_cost', {
      user_uuid: userId,
      order_uuid: orderId,
      cost,
      cost_type_param: 'order'
    });

    // Reset consecutive failures on success
    await supabase
      .from('zma_order_rate_limits')
      .update({ 
        consecutive_failures: 0, 
        updated_at: new Date().toISOString() 
      })
      .eq('user_id', userId);

  } catch (error) {
    console.error('Failed to track ZMA order success:', error);
  }
}

async function trackZmaOrderFailure(userId, orderId, errorType, errorDetails, supabase) {
  try {
    // Increment consecutive failures
    const { data: currentData } = await supabase
      .from('zma_order_rate_limits')
      .select('consecutive_failures')
      .eq('user_id', userId)
      .maybeSingle();
    
    const newCount = (currentData?.consecutive_failures || 0) + 1;
    
    await supabase
      .from('zma_order_rate_limits')
      .update({ 
        consecutive_failures: newCount, 
        updated_at: new Date().toISOString() 
      })
      .eq('user_id', userId);

    // Log security event
    await logZmaSecurityEvent('order_failure', {
      userId,
      orderId,
      errorType,
      errorDetails,
      consecutiveFailures: newCount
    }, newCount > 3 ? 'warning' : 'info', supabase);

  } catch (error) {
    console.error('Failed to track ZMA order failure:', error);
  }
}

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

    const { orderId, isTestMode, debugMode, retryAttempt } = body;
    
    if (!orderId) {
      console.log('❌ No order ID provided');
      throw new Error('Order ID is required');
    }

    console.log(`🔍 Processing order: ${orderId}, test mode: ${isTestMode}, debug: ${debugMode}, retry: ${retryAttempt}`);

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

    // Step 5: ZMA Security Validation
    console.log('🛡️ Step 5: Running ZMA security checks...');
    
    // Perform comprehensive security validation
    const securityCheckResult = await performZmaSecurityValidation({
      userId: orderData.user_id,
      orderId: orderId,
      orderData: {
        ...orderData,
        products: orderItems,
        total_amount: orderData.total_amount
      },
      isRetry: retryAttempt || false,
      retryCount: orderData.retry_count || 0
    }, supabase);

    if (securityCheckResult.blocked) {
      console.error('🚨 Security check failed - order blocked:', securityCheckResult.errors);
      
      // Update order status to blocked
      await supabase
        .from('orders')
        .update({
          status: 'blocked',
          zinc_status: 'security_blocked',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      return new Response(JSON.stringify({
        success: false,
        error: 'Order blocked by security checks',
        details: securityCheckResult.errors,
        blocked: true
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (securityCheckResult.warnings.length > 0) {
      console.warn('⚠️ Security warnings detected:', securityCheckResult.warnings);
    }

    console.log('✅ Security checks passed');

    // Step 6: Get ZMA credentials
    console.log('📥 Step 5: Getting ZMA credentials...');
    const { data: zmaAccount, error: credError } = await supabase
      .from('zma_accounts')
      .select('*')
      .eq('is_default', true)
      .eq('account_status', 'active')
      .limit(1)
      .single();

    if (credError || !zmaAccount) {
      console.error('❌ ZMA credentials error:', credError);
      throw new Error('No active default ZMA account found');
    }

    console.log(`✅ ZMA credentials retrieved - API Key: ${zmaAccount.api_key.substring(0, 8)}...`);

    // Step 6: Prepare Zinc API order data
    console.log('📥 Step 6: Preparing Zinc API request...');
    console.log(`🔍 Order items to process: ${orderItems.length}`);
    orderItems.forEach((item, index) => {
      console.log(`  Item ${index + 1}: ${item.product_id} (qty: ${item.quantity})`);
    });
    
    // Extract billing information
    let billingInfo = null;
    if (orderData.billing_info && typeof orderData.billing_info === 'object') {
      billingInfo = orderData.billing_info;
      console.log('📄 Found billing info:', JSON.stringify(billingInfo, null, 2));
    } else {
      console.log('⚠️ No billing info found in order data');
    }
    
    // Prepare shipping address
    if (!orderData.shipping_info) {
      throw new Error('Missing shipping information in order');
    }
    
    const shippingAddress = {
      first_name: orderData.shipping_info.name?.split(' ')[0] || 'Customer',
      last_name: orderData.shipping_info.name?.split(' ').slice(1).join(' ') || 'Name',
      address_line1: orderData.shipping_info.address || '',
      address_line2: orderData.shipping_info.addressLine2 || '',
      zip_code: orderData.shipping_info.zipCode || '',
      city: orderData.shipping_info.city || '',
      state: orderData.shipping_info.state || '',
      country: orderData.shipping_info.country === 'United States' ? 'US' : (orderData.shipping_info.country || 'US'),
      phone_number: orderData.shipping_info.phone || '5551234567' // Use order phone or default
    };
    
    // Prepare billing address - use billing info if available, otherwise fallback to shipping
    let billingAddress;
    if (billingInfo && billingInfo.billingAddress) {
      // Use the provided billing address
      billingAddress = {
        first_name: billingInfo.billingAddress.name?.split(' ')[0] || billingInfo.cardholderName?.split(' ')[0] || shippingAddress.first_name,
        last_name: billingInfo.billingAddress.name?.split(' ').slice(1).join(' ') || billingInfo.cardholderName?.split(' ').slice(1).join(' ') || shippingAddress.last_name,
        address_line1: billingInfo.billingAddress.address || shippingAddress.address_line1,
        address_line2: '',
        zip_code: billingInfo.billingAddress.zipCode || shippingAddress.zip_code,
        city: billingInfo.billingAddress.city || shippingAddress.city,
        state: billingInfo.billingAddress.state || shippingAddress.state,
        country: billingInfo.billingAddress.country || shippingAddress.country,
        phone_number: shippingAddress.phone_number
      };
    } else if (billingInfo && billingInfo.cardholderName) {
      // Use cardholder name with shipping address
      billingAddress = {
        first_name: billingInfo.cardholderName.split(' ')[0] || shippingAddress.first_name,
        last_name: billingInfo.cardholderName.split(' ').slice(1).join(' ') || shippingAddress.last_name,
        address_line1: shippingAddress.address_line1,
        address_line2: shippingAddress.address_line2,
        zip_code: shippingAddress.zip_code,
        city: shippingAddress.city,
        state: shippingAddress.state,
        country: shippingAddress.country,
        phone_number: shippingAddress.phone_number
      };
    } else {
      // Fallback to shipping address only
      billingAddress = {
        first_name: shippingAddress.first_name,
        last_name: shippingAddress.last_name,
        address_line1: shippingAddress.address_line1,
        address_line2: shippingAddress.address_line2,
        zip_code: shippingAddress.zip_code,
        city: shippingAddress.city,
        state: shippingAddress.state,
        country: shippingAddress.country,
        phone_number: shippingAddress.phone_number
      };
    }
    
    console.log('🔍 Billing address constructed:', JSON.stringify(billingAddress, null, 2));
    
    // Validate required fields before sending to Zinc
    const requiredShippingFields = ['first_name', 'last_name', 'address_line1', 'city', 'state', 'zip_code', 'country'];
    const requiredBillingFields = ['first_name', 'last_name', 'address_line1', 'city', 'state', 'zip_code', 'country'];
    
    console.log('🔍 Validating shipping address fields...');
    for (const field of requiredShippingFields) {
      if (!shippingAddress[field]) {
        console.error(`❌ Missing shipping field: ${field}`, shippingAddress);
        throw new Error(`Missing required shipping field: ${field}`);
      }
    }
    console.log('✅ Shipping address validation passed');
    
    console.log('🔍 Validating billing address fields...');
    for (const field of requiredBillingFields) {
      if (!billingAddress[field]) {
        console.error(`❌ Missing billing field: ${field}`, billingAddress);
        throw new Error(`Missing required billing field: ${field}`);
      }
    }
    
    // For ZMA orders, exclude payment_method, billing_address, and retailer_credentials
    const zincOrderData = {
      retailer: "amazon",
      products: orderItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity
      })),
      max_price: Math.round((orderData.total_amount + 10) * 100), // Add buffer and convert to cents
      shipping_address: shippingAddress,
      is_gift: orderData.is_gift || false,
      gift_message: orderData.gift_message || '',
      client_notes: {
        our_internal_order_id: orderData.order_number,
        supabase_order_id: orderId,
        created_via: 'elyphant_zma_system',
        zma_account_id: zmaAccount.account_id
      }
    };
    
    console.log('✅ Zinc order data prepared with billing address');
    console.log('📄 Shipping Address:', JSON.stringify(shippingAddress, null, 2));
    console.log('📄 Billing Address:', JSON.stringify(billingAddress, null, 2));

    console.log('✅ Zinc order data prepared');

    // Step 7: Call Zinc API
    console.log('📥 Step 7: Calling Zinc API...');
    if (!zmaAccount.api_key) {
      console.error('❌ ZMA account API key not configured');
      throw new Error('ZMA account API key not configured');
    }
    
    console.log(`🔐 Using API key: ${zmaAccount.api_key.substring(0, 8)}... for Zinc API call`);

    const zincResponse = await fetch('https://api.zinc.io/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(zmaAccount.api_key + ':')}`
      },
      body: JSON.stringify(zincOrderData)
    });

    const zincResult = await zincResponse.json();
    console.log('📤 Zinc API response:', JSON.stringify(zincResult));

    // Check for Zinc API errors (both HTTP status and response type)
    const isZincError = !zincResponse.ok || 
                       (zincResult._type && zincResult._type === 'error') ||
                       (zincResult.code && zincResult.code.includes('invalid')) ||
                       zincResult.error;

    if (isZincError) {
      console.error('❌ Zinc API rejected the order:', zincResult);
      
      // Update order status to failed with error details
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'failed',
          zma_error: JSON.stringify(zincResult),
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('❌ Failed to update order status to failed:', updateError);
      }

      throw new Error(`Zinc API rejected order: ${zincResult.message || zincResult.data?.validator_errors?.[0]?.message || 'Unknown validation error'}`);
    }

    // Only proceed if Zinc actually accepted the order
    if (!zincResult.request_id) {
      console.error('❌ Zinc API response missing request_id:', zincResult);
      throw new Error('Zinc API response missing request_id - order may not have been accepted');
    }

    // Step 8: Update order with Zinc request ID (only on success)
    console.log('📥 Step 8: Updating order with Zinc data...');
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        zma_order_id: zincResult.request_id,
        status: 'processing',
        zma_account_used: zmaAccount.account_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('❌ Order update error:', updateError);
      throw new Error(`Failed to update order: ${updateError.message}`);
    }

    // Track successful order for security metrics
    await trackZmaOrderSuccess(orderData.user_id, orderId, orderData.total_amount, supabase);
    
    console.log('✅ Order successfully submitted to Zinc and updated');
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Order successfully submitted to ZMA/Zinc!',
      orderId: orderId,
      zincRequestId: zincResult.request_id,
      zmaAccount: zmaAccount.account_id,
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
    
    // Track failure for security metrics (if we have order data)
    try {
      const orderId = req.url.includes('orderId') ? new URLSearchParams(req.url.split('?')[1])?.get('orderId') : null;
      if (orderId) {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.45.0');
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        
        const { data: orderData } = await supabase
          .from('orders')
          .select('user_id')
          .eq('id', orderId)
          .single();
        
        if (orderData?.user_id) {
          await trackZmaOrderFailure(orderData.user_id, orderId, 'processing_error', error.message, supabase);
        }
      }
    } catch (trackingError) {
      console.error('Failed to track order failure:', trackingError);
    }
    
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