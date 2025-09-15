import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { classifyZmaError } from '../shared/zmaErrorClassification.ts';

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

function collectGiftMessage(orderItems, orderData) {
  // First check if there's a direct gift message on the order
  if (orderData.gift_message) {
    console.log('📝 Using gift message from order:', orderData.gift_message);
    return orderData.gift_message;
  }

  // Collect gift messages from order items
  const giftMessages = orderItems
    .map(item => item.recipient_gift_message)
    .filter(message => message && message.trim() !== '');

  if (giftMessages.length === 0) {
    console.log('📝 No gift message found in order or items');
    return '';
  }

  // If all messages are the same, use it once
  const uniqueMessages = [...new Set(giftMessages)];
  if (uniqueMessages.length === 1) {
    console.log('📝 Using gift message from order items:', uniqueMessages[0]);
    return uniqueMessages[0];
  }

  // If multiple different messages, combine them
  const combinedMessage = uniqueMessages.join(' | ');
  console.log('📝 Multiple gift messages found, combining:', combinedMessage);
  return combinedMessage;
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

// Enhanced payment verification function with UUID validation
async function verifyPaymentStatus(orderId, supabase) {
  console.log('💳 Verifying payment status before ZMA processing...');
  
  // Validate orderId format
  if (!orderId || typeof orderId !== 'string') {
    throw new Error('Invalid order ID provided');
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(orderId)) {
    throw new Error(`Invalid UUID format for order ID: ${orderId}`);
  }
  
  const { data: orderData, error } = await supabase
    .from('orders')
    .select('payment_status, stripe_payment_intent_id, total_amount, user_id, status')
    .eq('id', orderId)
    .single();

  if (error) {
    console.error('❌ Database error fetching order:', error);
    throw new Error(`Failed to fetch order payment status: ${error.message}`);
  }
  
  if (!orderData) {
    throw new Error(`Order not found: ${orderId}`);
  }

  // Enhanced payment status validation with better error messages
  const validPaymentStatuses = ['succeeded', 'test_succeeded'];
  const isTestPayment = orderData.stripe_payment_intent_id?.includes('test') || 
                       orderData.stripe_payment_intent_id?.includes('pi_test_auto_gift') ||
                       orderData.stripe_payment_intent_id?.startsWith('pi_test_auto_gift_');
  
  console.log('🔍 Payment validation details:', {
    paymentStatus: orderData.payment_status,
    isTestPayment,
    stripePaymentIntentId: orderData.stripe_payment_intent_id?.substring(0, 20) + '...',
    totalAmount: orderData.total_amount
  });
  
  if (!validPaymentStatuses.includes(orderData.payment_status) && !isTestPayment) {
    // More specific error message based on payment status
    const errorMessages = {
      'pending': 'Payment is still being processed. Please wait for payment confirmation.',
      'failed': 'Payment has failed. Please use a different payment method.',
      'canceled': 'Payment was canceled. Please retry the payment.',
      'requires_action': 'Payment requires additional authentication. Please complete the payment process.',
      'payment_verification_failed': 'Payment could not be verified. Please contact support.'
    };
    
    const errorMessage = errorMessages[orderData.payment_status] || 
                        `Payment status "${orderData.payment_status}" is not valid for processing.`;
    
    throw new Error(`${errorMessage} Cannot process order until payment is successful.`);
  }

  console.log(`✅ Payment verified: ${orderData.payment_status} for amount $${orderData.total_amount}`);
  
  // Enhanced Stripe verification with better error handling
  if (orderData.stripe_payment_intent_id && (orderData.payment_status === 'pending' || orderData.payment_status === 'payment_verification_failed')) {
    console.log('🔍 Additional Stripe payment verification...');
    try {
      const stripe = (await import('https://esm.sh/stripe@14.21.0')).default(
        Deno.env.get('STRIPE_SECRET_KEY') || '',
        { apiVersion: '2023-10-16' }
      );
      
      // Validate payment intent ID format before calling Stripe
      if (!orderData.stripe_payment_intent_id.startsWith('pi_') && !orderData.stripe_payment_intent_id.includes('test')) {
        throw new Error('Invalid payment intent ID format');
      }
      
      const paymentIntent = await stripe.paymentIntents.retrieve(orderData.stripe_payment_intent_id);
      console.log(`💳 Stripe verification result: ${paymentIntent.status} for amount: ${paymentIntent.amount}`);
      
      if (paymentIntent.status === 'succeeded') {
        // Update payment status in database with enhanced data
        const { error: updateError } = await supabase
          .from('orders')
          .update({ 
            payment_status: 'succeeded',
            status: 'payment_confirmed',
            stripe_payment_method_id: paymentIntent.payment_method,
            payment_verified_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);
        
        if (updateError) {
          console.error('⚠️ Failed to update payment status:', updateError);
        } else {
          console.log('✅ Updated payment status to succeeded based on Stripe verification');
          // Update the local orderData to reflect the successful payment
          orderData.payment_status = 'succeeded';
        }
      } else if (['payment_failed', 'canceled', 'failed'].includes(paymentIntent.status)) {
        throw new Error(`Payment failed in Stripe: ${paymentIntent.status}`);
      } else {
        console.log(`⏳ Payment still in progress: ${paymentIntent.status}`);
        throw new Error(`Payment is still processing. Current status: ${paymentIntent.status}`);
      }
    } catch (stripeError) {
      console.error('❌ Stripe verification failed:', stripeError.message);
      
      // Log verification failure for audit but don't change order status to failed immediately
      // This prevents premature failure states during transient Stripe issues
      await supabase
        .from('order_notes')
        .insert({
          order_id: orderId,
          note_content: `Payment verification attempt failed: ${stripeError.message}`,
          note_type: 'system_error',
          is_internal: true,
          admin_user_id: null
        })
        .then(({ error }) => {
          if (error) console.error('Failed to log verification failure:', error);
        });
      
      // Only set payment_verification_failed for definitive failures, not transient issues
      const isDefinitiveFailure = stripeError.message?.includes('No such payment_intent') ||
                                 stripeError.message?.includes('invalid') ||
                                 stripeError.message?.includes('not found');
      
      if (isDefinitiveFailure) {
        await supabase
          .from('orders')
          .update({
            status: 'payment_verification_failed',
            payment_verification_error: stripeError.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);
      }
      
      throw stripeError;
    }
  }

  return {
    verified: true,
    paymentStatus: orderData.payment_status,
    amount: orderData.total_amount
  };
}

// Error classification now handled by shared utility

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight handled');
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🚀 ZMA Function - Enhanced with Duplicate Charge Prevention');
  
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

    const { orderId, isTestMode, debugMode, retryAttempt, scheduledProcessing, scheduledDeliveryDate, packageSchedulingData, hasMultiplePackages } = body;
    
    if (!orderId) {
      console.log('❌ No order ID provided');
      throw new Error('Order ID is required');
    }

    console.log(`🔍 Processing order: ${orderId}, test mode: ${isTestMode}, debug: ${debugMode}, retry: ${retryAttempt}, scheduled: ${scheduledProcessing}, packages: ${hasMultiplePackages ? 'multiple' : 'single'}`);

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

    // Step 3: CRITICAL - Verify payment status before any ZMA processing
    console.log('💳 Step 3: Verifying payment status...');
    try {
      const paymentVerification = await verifyPaymentStatus(orderId, supabase);
      console.log('✅ Payment verification passed:', paymentVerification);
    } catch (paymentError) {
      console.error('❌ Payment verification failed:', paymentError);
      
      // Update order with payment verification failure
      await supabase
        .from('orders')
        .update({
          status: 'payment_verification_failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      return new Response(JSON.stringify({
        success: false,
        error: 'Payment verification failed',
        details: paymentError.message,
        preventDuplicateCharge: true
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Step 4: Enhanced atomic duplicate check and processing lock
    console.log('📥 Step 4: Atomic duplicate check and processing lock...');
    
    // Generate request fingerprint for duplicate detection
    const requestFingerprint = btoa(JSON.stringify({
      orderId,
      timestamp: Math.floor(Date.now() / 60000), // 1-minute window
      isRetry: retryAttempt,
      processType: 'zma-order'
    }));
    
    // Check request fingerprint first
    const { data: fingerprintCheck } = await supabase
      .rpc('check_request_fingerprint', {
        fingerprint_param: requestFingerprint,
        user_uuid: null, // Will be set from order data
        order_uuid: orderId
      });
    
    if (fingerprintCheck?.is_duplicate && !retryAttempt) {
      console.log('🛑 Duplicate request detected by fingerprint');
      return new Response(JSON.stringify({
        success: false,
        error: 'Duplicate request detected',
        message: 'This exact request was already processed recently',
        duplicateRequestDetected: true
      }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Start atomic processing with enhanced duplicate prevention
    const { data: processingResult } = await supabase
      .rpc('start_order_processing', {
        order_uuid: orderId,
        processing_user: null // Service role processing
      });
    
    if (!processingResult?.success) {
      console.log('🛑 Order processing blocked:', processingResult?.error);
      
      if (processingResult?.error === 'already_processed') {
        return new Response(JSON.stringify({
          success: true,
          message: 'Order already processed successfully',
          zinc_order_id: processingResult.zinc_order_id,
          current_status: processingResult.current_status,
          preventDuplicateProcessing: true
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      if (processingResult?.error === 'already_processing') {
        return new Response(JSON.stringify({
          success: false,
          error: 'Order currently being processed',
          message: 'Another process is currently handling this order',
          retryAfter: 30
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({
        success: false,
        error: processingResult.error,
        message: processingResult.message
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log('✅ Order processing lock acquired successfully');
    
    // Get full order data after acquiring lock
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !orderData) {
      console.error('❌ Order lookup error:', orderError);
      // Release processing lock on error
      await supabase.rpc('complete_order_processing', {
        order_uuid: orderId,
        final_status: 'failed',
        error_message: 'Order not found after acquiring lock'
      });
      throw new Error(`Order not found: ${orderError?.message || 'Unknown error'}`);
    }

    console.log(`✅ Order found: ${orderData.order_number} - Processing lock active`);

    // Final safety check - if somehow order has zinc_order_id after lock, something is wrong
    if (orderData.zinc_order_id && !retryAttempt && orderData.status !== 'failed') {
      console.error('🚨 CRITICAL: Order has zinc_order_id despite processing lock!');
      
      // Release lock and exit
      await supabase.rpc('complete_order_processing', {
        order_uuid: orderId,
        final_status: orderData.status,
        error_message: 'Duplicate detected after lock acquisition'
      });
      
      return new Response(JSON.stringify({
        success: true,
          message: 'Order already processed successfully',
          orderId: orderId,
          zincRequestId: orderData.zinc_order_id,
          status: orderData.status,
          duplicatePrevented: true,
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        });
      }
    }

    // If this is a retry, verify the order is actually in retry_pending status
    if (retryAttempt && orderData.status !== 'retry_pending' && orderData.status !== 'failed') {
      console.log(`⚠️ Retry attempted on order ${orderId} but status is ${orderData.status}, not retry_pending`);
      
      // If order is already successful, return success
      if (['processing', 'shipped', 'delivered', 'completed'].includes(orderData.status)) {
        return new Response(JSON.stringify({
          success: true,
          message: 'Order already successfully processed',
          orderId: orderId,
          zincRequestId: orderData.zinc_order_id,
          status: orderData.status,
          retryNotNeeded: true,
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        });
      }
    }
    
    // Log scheduled delivery information if present
    if (scheduledDeliveryDate || orderData.scheduled_delivery_date) {
      const deliveryDate = scheduledDeliveryDate || orderData.scheduled_delivery_date;
      const currentDate = new Date();
      const scheduledDate = new Date(deliveryDate);
      const daysDifference = Math.ceil((scheduledDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
      
      console.log(`📅 [ZMA-ORDER] Scheduled delivery processing:`, {
        scheduled_delivery_date: deliveryDate,
        days_until_delivery: daysDifference,
        processing_trigger: scheduledProcessing ? 'daily_scheduler' : 'immediate',
        optimal_timing: daysDifference <= 4 ? 'YES' : 'EARLY'
      });
      
      // Validation: Don't process orders too early unless forced
      if (!scheduledProcessing && daysDifference > 6) {
        console.warn(`⚠️ [ZMA-ORDER] Processing order ${daysDifference} days early - may not align with delivery window`);
      }
    }

    // Step 5: Get order items
    console.log('📥 Step 5: Getting order items...');
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (itemsError || !orderItems || orderItems.length === 0) {
      console.error('❌ Order items error:', itemsError);
      throw new Error('No order items found');
    }

    console.log(`✅ Found ${orderItems.length} order items`);

    // Step 6: ZMA Security Validation
    console.log('🛡️ Step 6: Running ZMA security checks...');
    
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

    // Step 7: Get ZMA credentials
    console.log('📥 Step 7: Getting ZMA credentials...');
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

    // Step 8: Prepare Zinc API order data
    console.log('📥 Step 8: Preparing Zinc API request...');
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
    
    // Handle name field splitting - check for first_name/last_name or split name field
    let firstName = orderData.shipping_info.first_name;
    let lastName = orderData.shipping_info.last_name;
    
    if (!firstName || !lastName) {
      // Try to split the name field if first_name/last_name are not provided
      const fullName = orderData.shipping_info.name || '';
      const nameParts = fullName.trim().split(' ');
      firstName = firstName || nameParts[0] || 'Customer';
      lastName = lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Name');
    }
    
    const shippingAddress = {
      first_name: firstName,
      last_name: lastName,
      address_line1: orderData.shipping_info.address_line1 || '',
      address_line2: orderData.shipping_info.address_line2 || '',
      zip_code: orderData.shipping_info.zip_code || '',
      city: orderData.shipping_info.city || '',
      state: orderData.shipping_info.state || '',
      country: orderData.shipping_info.country === 'United States' ? 'US' : (orderData.shipping_info.country || 'US'),
      phone_number: orderData.shipping_info.phone_number || '5551234567'
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
      addax: true, // CRITICAL: Enables ZMA ordering
      products: orderItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        variants: [] // Required field for ZMA
      })),
      max_price: Math.round((orderData.total_amount + 10) * 100), // Add buffer and convert to cents
      shipping_address: shippingAddress,
      shipping_method: "cheapest", // Required field
      is_gift: orderData.is_gift || false,
      gift_message: collectGiftMessage(orderItems, orderData),
      addax: true, // Required for ZMA orders
      client_notes: {
        our_internal_order_id: orderData.order_number,
        supabase_order_id: orderId,
        created_via: 'elyphant_zma_system',
        zma_account_id: zmaAccount.account_id
      }
    };
    
    // Add scheduled delivery windows if delivery date is specified
    const finalDeliveryDate = scheduledDeliveryDate || orderData.scheduled_delivery_date;
    if (finalDeliveryDate) {
      const deliveryDate = new Date(finalDeliveryDate);
      // Create delivery window for Zinc: target date ± 1 day using root-level fields
      const startDate = new Date(deliveryDate);
      startDate.setDate(startDate.getDate() - 1);
      const endDate = new Date(deliveryDate);
      endDate.setDate(endDate.getDate() + 1);
      
      // Use root-level start/end fields as per ZMA API docs
      zincOrderData.start = startDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      zincOrderData.end = endDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      console.log(`📅 [ZMA-ORDER] Added scheduled delivery window to Zinc request:`, {
        target_date: finalDeliveryDate,
        delivery_window: { start_date: zincOrderData.start, end_date: zincOrderData.end }
      });
    }
    
    // Validate that we don't send undefined values to Zinc
    Object.keys(zincOrderData).forEach(key => {
      if (zincOrderData[key] === undefined) {
        console.warn(`⚠️ Removing undefined field from Zinc request: ${key}`);
        delete zincOrderData[key];
      }
    });
    
    console.log('✅ Zinc order data prepared with billing address');
    console.log('📄 Shipping Address:', JSON.stringify(shippingAddress, null, 2));
    console.log('📄 Billing Address:', JSON.stringify(billingAddress, null, 2));

    console.log('✅ Zinc order data prepared');

    // ATOMIC SUBMISSION LOCK - Prevents duplicate Zinc order submissions
    console.log('🔒 Attempting atomic submission lock...');
    const { data: lockAcquired, error: lockError } = await supabase
      .rpc('acquire_order_submission_lock', { order_uuid: orderId });

    if (lockError) {
      console.error('❌ Failed to acquire atomic submission lock:', lockError);
      throw new Error(`Submission lock error: ${lockError.message}`);
    }

    if (!lockAcquired) {
      console.warn('🛑 DUPLICATE PREVENTION: Another process is already submitting this order. Aborting to prevent duplicate Zinc order.');
      console.log(`📊 Order ${orderId} - Lock acquisition failed - returning success to prevent retry loops`);
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Order submission already in progress by another process. Duplicate submission prevented.',
        orderId: orderId,
        duplicatePrevented: true,
        lockAcquired: false
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    console.log(`✅ Successfully acquired atomic submission lock for order ${orderId}`);
    console.log(`📊 PROCESS-ZMA-ORDER: Starting Zinc submission for order ${orderId} - lock acquired successfully`);

    // Step 9: Call Zinc API
    console.log('📥 Step 9: Calling Zinc API...');
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
      
      // Classify the error for retry logic
      const errorClassification = classifyZmaError(zincResult);
      console.log('🔍 Error classification:', errorClassification);
      
      // Extract error message
      const errorMessage = zincResult.message || zincResult.data?.validator_errors?.[0]?.message || 'Unknown validation error';
      
      // Handle retryable vs non-retryable errors differently
      if (errorClassification.shouldRetry) {
        console.log('🔄 Setting order to retry_pending status for automatic retry...');
        
        // Complete processing with retry status using atomic function
        const { data: retryResult } = await supabase
          .rpc('complete_order_processing', {
            order_uuid: orderId,
            final_status: 'retry_pending',
            error_message: `${errorClassification.type}: ${errorMessage}`
          });

        if (!retryResult?.success) {
          console.error('❌ Failed to complete order processing for retry:', retryResult);
        }

        // Update retry metadata (non-atomic, can be done after completion)
        const { error: metadataError } = await supabase
          .from('orders')
          .update({
            zinc_status: 'awaiting_retry',
            zma_error: JSON.stringify(zincResult),
            retry_count: (orderData.retry_count || 0) + 1,
            next_retry_at: new Date(Date.now() + (errorClassification.retryDelay * 1000)).toISOString(),
            retry_reason: errorClassification.type,
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);

        if (metadataError) {
          console.warn('⚠️ Failed to update retry metadata (non-critical):', metadataError);
        }

        // Track as retryable failure
        await trackZmaOrderFailure(orderData.user_id, orderId, 'retryable_zinc_error', errorMessage, supabase);

        // For auto-gift executions, keep them in processing (don't reset to pending_approval)
        if (body.isAutoGift && body.executionMetadata?.execution_id) {
          console.log('🔄 Keeping auto-gift execution in processing for retry...');
          await supabase
            .from('automated_gift_executions')
            .update({
              status: 'processing',
              error_message: `${errorClassification.userFriendlyMessage} Retry scheduled.`,
              updated_at: new Date().toISOString()
            })
            .eq('id', body.executionMetadata.execution_id);
          
          console.log(`✅ Auto-gift execution ${body.executionMetadata.execution_id} kept in processing for retry`);
        }

        return new Response(JSON.stringify({
          success: false,
          error: errorClassification.userFriendlyMessage,
          retryable: true,
          retryScheduled: true,
          nextRetryAt: new Date(Date.now() + (errorClassification.retryDelay * 1000)).toISOString(),
          details: errorMessage
        }), {
          status: 202, // Accepted for retry
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else {
        // Non-retryable error - fail permanently
        console.log('❌ Non-retryable error - failing order permanently...');
        
        // Complete processing with failed status using atomic function
        const { data: failureResult } = await supabase
          .rpc('complete_order_processing', {
            order_uuid: orderId,
            final_status: 'failed',
            error_message: `Non-retryable error: ${errorMessage}`
          });

        if (!failureResult?.success) {
          console.error('❌ Failed to complete order processing for failure:', failureResult);
        }

        // Update error metadata (non-atomic, can be done after completion)
        const { error: metadataError } = await supabase
          .from('orders')
          .update({
            zma_error: JSON.stringify(zincResult),
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);

        if (metadataError) {
          console.warn('⚠️ Failed to update error metadata (non-critical):', metadataError);
        }

        // Track the failure for security monitoring
        await trackZmaOrderFailure(orderData.user_id, orderId, 'zinc_api_error', errorMessage, supabase);

        // CRITICAL: If this is from an auto-gift execution, reset it for retry
        if (body.isAutoGift && body.executionMetadata?.execution_id) {
          console.log('🔄 Resetting auto-gift execution for retry due to ZMA failure...');
          await supabase
            .from('automated_gift_executions')
            .update({
              status: 'pending_approval',
              error_message: `ZMA processing failed: ${errorMessage}. Please retry.`,
              updated_at: new Date().toISOString()
            })
            .eq('id', body.executionMetadata.execution_id);
          
          console.log(`✅ Auto-gift execution ${body.executionMetadata.execution_id} reset to pending_approval for retry`);
        }

        throw new Error(`Zinc API rejected order: ${errorMessage}`);
      }
    }

    // Only proceed if Zinc actually accepted the order
    if (!zincResult.request_id) {
      console.error('❌ Zinc API response missing request_id:', zincResult);
      throw new Error('Zinc API response missing request_id - order may not have been accepted');
    }

    // Step 10: Atomically complete order processing with Zinc ID
    console.log('📥 Step 10: Completing order processing with Zinc data...');
    
    const { data: completionResult } = await supabase
      .rpc('complete_order_processing', {
        order_uuid: orderId,
        zinc_order_id_param: zincResult.request_id,
        final_status: 'processing'
      });

    if (!completionResult?.success) {
      console.error('❌ Critical Error: Failed to complete order processing:', completionResult);
      // This is critical - we need to track this zinc_order_id for status monitoring
      console.error('🚨 Manual intervention needed: Order', orderId, 'has Zinc request ID', zincResult.request_id, 'but failed to save to database');
      
      // Still throw error but provide actionable information
      throw new Error(`Critical: Order submitted to Zinc (${zincResult.request_id}) but failed to complete processing: ${completionResult?.message}`);
    }

    // Update additional ZMA metadata (can be done after atomic completion)
    const { error: metadataError } = await supabase
      .from('orders')
      .update({
        zma_order_id: zincResult.request_id,  // Keep for compatibility
        zinc_status: 'submitted',
        zma_account_used: zmaAccount.account_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (metadataError) {
      console.warn('⚠️ Failed to update ZMA metadata (non-critical):', metadataError);
    }

    console.log('✅ Order processing completed atomically:', { 
      orderId, 
      zinc_order_id: zincResult.request_id,
      final_status: completionResult.final_status 
    });

    // Track successful order for security metrics
    await trackZmaOrderSuccess(orderData.user_id, orderId, orderData.total_amount, supabase);
    
    console.log('✅ Order successfully submitted to Zinc and updated');
    
    // Build response payload explicitly to avoid any parser ambiguity
    const successPayload = {
      success: true,
      message: 'Order successfully submitted to ZMA/Zinc!',
      orderId,
      zincRequestId: zincResult.request_id,
      zmaAccount: zmaAccount.account_id,
      paymentVerified: true,
      debug: {
        step1_parseRequest: '✅ Success',
        step2_supabaseClient: '✅ Success', 
        step3_paymentVerification: '✅ Success',
        step4_orderExists: '✅ Success',
        step5_orderItems: '✅ Success',
        step6_securityChecks: '✅ Success',
        step7_zmaCredentials: '✅ Success',
        step8_prepareZincData: '✅ Success',
        step9_callZincAPI: '✅ Success',
        step10_updateOrder: '✅ Success'
      },
      timestamp: new Date().toISOString()
    };

    return new Response(
      JSON.stringify(successPayload),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

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
      status: 500
    });
  }
});
