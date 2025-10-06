import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { classifyZmaError } from '../shared/zmaErrorClassification.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ZMA Security Validation Functions for Scheduled Orders
async function performZmaSecurityValidation(context: any, supabase: any) {
  const result = {
    passed: true,
    blocked: false,
    warnings: [] as string[],
    errors: [] as string[],
    metadata: {} as any
  };

  try {
    console.log('🔍 [Scheduled] Running rate limit check...');
    // 1. Rate Limiting Check
    const { data: canOrder } = await supabase
      .rpc('check_zma_order_rate_limit', { user_uuid: context.userId });
    
    if (!canOrder) {
      result.blocked = true;
      result.passed = false;
      result.errors.push('Rate limit exceeded');
      
      await logZmaSecurityEvent('rate_limit_exceeded', {
        userId: context.userId,
        orderId: context.orderId,
        orderType: 'scheduled'
      }, 'warning', supabase);
    }

    console.log('🔍 [Scheduled] Running cost limit check...');
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
        monthlySpent,
        orderType: 'scheduled'
      }, 'critical', supabase);
    }

    console.log('🔍 [Scheduled] Running order validation...');
    // 3. Order Validation (duplicates, suspicious patterns)
    const orderHash = btoa(JSON.stringify({
      orderId: context.orderId,
      orderType: 'scheduled',
      amount: context.orderData.total_amount,
      scheduledDate: context.scheduledDeliveryDate
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
        validationData: validationResult,
        orderType: 'scheduled'
      }, validationResult?.is_suspicious_pattern ? 'critical' : 'warning', supabase);
    }

  } catch (error) {
    console.error('Scheduled order security validation error:', error);
    result.warnings.push('Security check system error');
  }

  return result;
}

async function logZmaSecurityEvent(eventType: any, eventData: any, severity: any, supabase: any) {
  try {
    await supabase
      .from('security_logs')
      .insert({
        user_id: eventData.userId,
        event_type: eventType,
        details: eventData,
        risk_level: severity
      });

    console.warn(`ZMA Scheduled Order Security Event [${severity.toUpperCase()}]: ${eventType}`, eventData);
  } catch (error) {
    console.error('Failed to log ZMA security event:', error);
  }
}

async function trackZmaOrderSuccess(userId: any, orderId: any, cost: any, supabase: any) {
  try {
    // Track the cost
    await supabase.rpc('track_zma_cost', {
      user_uuid: userId,
      order_uuid: orderId,
      cost,
      cost_type_param: 'scheduled_order'
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
    console.error('Failed to track ZMA scheduled order success:', error);
  }
}

async function trackZmaOrderFailure(userId: any, orderId: any, errorType: any, errorDetails: any, supabase: any) {
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
    await logZmaSecurityEvent('scheduled_order_failure', {
      userId,
      orderId,
      errorType,
      errorDetails,
      consecutiveFailures: newCount
    }, newCount > 3 ? 'warning' : 'info', supabase);

  } catch (error) {
    console.error('Failed to track ZMA scheduled order failure:', error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  let cronLogId: string | undefined;

  try {
    console.log('🕘 [process-scheduled-orders] Daily scheduled order processing started')

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Log cron execution start
    const { data: cronLog, error: cronLogError } = await supabase
      .from('cron_execution_logs')
      .insert({
        cron_job_name: 'process-scheduled-orders-daily',
        execution_started_at: new Date().toISOString(),
        status: 'running',
        execution_metadata: {
          trigger_source: 'cron',
          execution_date: new Date().toISOString()
        }
      })
      .select()
      .single()

    cronLogId = cronLog?.id

    // Calculate the processing cutoff date (4 days from now for Amazon 2-day shipping)
    const processingCutoffDate = new Date()
    processingCutoffDate.setDate(processingCutoffDate.getDate() + 4)
    const cutoffDateString = processingCutoffDate.toISOString().split('T')[0] // YYYY-MM-DD format

    console.log(`📅 Processing orders scheduled for delivery on or before: ${cutoffDateString}`)

    // Enhanced query with correct columns from database schema
    // FUNDING-AWARE: Only process orders that are funded
    const { data: ordersToProcess, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        scheduled_delivery_date,
        user_id,
        total_amount,
        payment_status,
        retry_count,
        gift_scheduling_options,
        delivery_groups,
        has_multiple_recipients,
        funding_status
      `)
      .eq('status', 'scheduled')
      .lte('scheduled_delivery_date', cutoffDateString)
      .neq('funding_status', 'awaiting_funds') // Skip orders awaiting funding
      .order('scheduled_delivery_date', { ascending: true })

    if (ordersError) {
      console.error('❌ Error fetching scheduled orders:', ordersError)
      throw new Error('Failed to fetch scheduled orders')
    }

    if (!ordersToProcess || ordersToProcess.length === 0) {
      console.log('✅ No scheduled orders ready for processing')
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'No scheduled orders ready for processing',
          ordersProcessed: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    console.log(`📦 Found ${ordersToProcess.length} scheduled orders ready for processing`)

    const results = []
    let successCount = 0
    let failureCount = 0

    // Process each order with enhanced security and error handling
    for (const order of (ordersToProcess as any[])) {
      try {
        console.log(`🔄 [Enhanced] Processing scheduled order: ${order.order_number} (${order.id})`)
        console.log(`   Scheduled delivery: ${order.scheduled_delivery_date}`)
        console.log(`   Payment status: ${order.payment_status}`)
        console.log(`   Total amount: $${order.total_amount}`)

        // STEP 1: Security Validation for Scheduled Orders
        console.log(`🔍 Step 1: Running security validation for scheduled order ${order.id}...`);
        const securityContext = {
          userId: order.user_id,
          orderId: order.id,
          orderData: order,
          scheduledDeliveryDate: order.scheduled_delivery_date,
          isScheduled: true
        };

        const securityValidation = await performZmaSecurityValidation(securityContext, supabase);
        
        if (securityValidation.blocked) {
          console.error(`❌ Security validation blocked scheduled order ${order.order_number}:`, securityValidation.errors);
          
          await supabase
            .from('orders')
            .update({
              status: 'failed',
              updated_at: new Date().toISOString(),
              retry_reason: `Security validation failed: ${securityValidation.errors.join(', ')}`
            })
            .eq('id', order.id);

          results.push({
            orderId: order.id,
            orderNumber: order.order_number,
            success: false,
            error: 'Security validation failed',
            securityBlocked: true
          });
          failureCount++;
          continue;
        }

        if (securityValidation.warnings.length > 0) {
          console.warn(`⚠️ Security warnings for scheduled order ${order.order_number}:`, securityValidation.warnings);
        }

        // STEP 2: Atomic Processing Lock
        console.log(`🔒 Step 2: Implementing atomic processing lock for order ${order.id}...`);
        
        const lockKey = `scheduled_processing_${order.id}`;
        const processingLock = await supabase
          .from('orders')
          .update({
            status: 'processing',
            updated_at: new Date().toISOString()
          })
          .eq('id', order.id)
          .eq('status', 'scheduled') // Only update if still scheduled
          .select()
          .single();

        if (processingLock.error || !processingLock.data) {
          console.warn(`⚠️ Order ${order.order_number} already being processed or status changed`);
          results.push({
            orderId: order.id,
            orderNumber: order.order_number,
            success: false,
            error: 'Order already being processed',
            skipped: true
          });
          continue;
        }

        console.log(`✅ Acquired processing lock for scheduled order ${order.order_number}`);

        // STEP 3: Payment Processing and Validation
        console.log(`💳 Step 3: Payment processing for scheduled order ${order.id}...`);
        
        // CRITICAL: Capture payment for scheduled deliveries before processing
        if (order.payment_status === 'payment_intent_created') {
          console.log(`💳 Capturing payment for scheduled order ${order.order_number}`)
          
          try {
            // Invoke payment capture function
            const { data: captureResult, error: captureError } = await supabase.functions.invoke('capture-scheduled-payment', {
              body: { orderId: order.id }
            });
            
            if (captureError) {
              console.error(`❌ Payment capture failed for order ${order.order_number}:`, captureError);
              results.push({
                orderId: order.id,
                orderNumber: order.order_number,
                success: false,
                error: 'Payment capture failed',
                skipped: true
              });
              continue;
            }
            
            console.log(`✅ Payment captured successfully for order ${order.order_number}`);
          } catch (captureErr) {
            console.error(`❌ Payment capture error for order ${order.order_number}:`, captureErr);
            results.push({
              orderId: order.id,
              orderNumber: order.order_number,
              success: false,
              error: 'Payment capture error',
              skipped: true
            });
            continue;
          }
        } else if (order.payment_status !== 'succeeded') {
          console.warn(`⚠️ Skipping order ${order.order_number} - payment not ready: ${order.payment_status}`)
          
          // Revert status back to scheduled
          await supabase
            .from('orders')
            .update({
              status: 'scheduled',
              updated_at: new Date().toISOString()
            })
            .eq('id', order.id);

          results.push({
            orderId: order.id,
            orderNumber: order.order_number,
            success: false,
            error: 'Payment not ready for processing',
            skipped: true
          })
          continue
        }

        console.log(`✅ Payment validation passed for scheduled order ${order.order_number}`);

        // STEP 4: Generate webhook token for real-time status updates
        console.log(`🔐 Step 4a: Generating webhook security token for scheduled order ${order.id}`)
        
        const webhookToken = btoa(JSON.stringify({
          orderId: order.id,
          timestamp: Date.now(),
          nonce: Math.random().toString(36).substring(2)
        }));

        // Store webhook token for secure validation
        await supabase
          .from('orders')
          .update({
            webhook_token: webhookToken,
            updated_at: new Date().toISOString()
          })
          .eq('id', order.id);

        console.log('🔗 Webhook integration enabled for real-time order status updates');

        // STEP 5: Enhanced ZMA processing with proven robustness patterns
        console.log(`🚀 Step 5: Enhanced ZMA processing for scheduled order ${order.id}`)
        
        const giftSchedulingOptions = order.gift_scheduling_options || {}
        const deliveryGroups = order.delivery_groups || []
        const hasMultipleRecipients = order.has_multiple_recipients || false
        
        console.log(`📦 Comprehensive scheduling analysis for order ${order.id}:`, {
          giftSchedulingOptions,
          deliveryGroupCount: deliveryGroups.length,
          scheduledDeliveryDate: order.scheduled_delivery_date,
          hasMultipleRecipients,
          paymentStatus: order.payment_status,
          totalAmount: order.total_amount,
          retryCount: order.retry_count || 0,
          webhookToken: webhookToken ? 'generated' : 'not_generated'
        })
        
        const { data: zmaResult, error: zmaError } = await supabase.functions.invoke('process-zma-order', {
          body: {
            orderId: order.id,
            isTestMode: false,
            debugMode: false,
            scheduledProcessing: true,
            scheduledDeliveryDate: order.scheduled_delivery_date,
            giftSchedulingOptions,
            deliveryGroups,
            hasMultipleRecipients,
            retryAttempt: order.retry_count || 0
          }
        })

        // STEP 6: Enhanced Error Classification and Handling
        if (zmaError) {
          console.error(`❌ ZMA processing failed for scheduled order ${order.order_number}:`, zmaError)
          
          // Use shared error classification utility
          const errorClassification = classifyZmaError(zmaError);
          console.log(`🔍 Error classification for scheduled order ${order.order_number}:`, errorClassification);

          // Track failure for monitoring
          await trackZmaOrderFailure(order.user_id, order.id, errorClassification.type, zmaError, supabase);

          // Determine retry strategy based on error classification
          let nextRetryAt = null;
          let newStatus = 'scheduled';
          
          if (errorClassification.shouldRetry) {
            if (errorClassification.useZincNativeRetry) {
              // Use Zinc's native retry system
              console.log(`🔄 Using Zinc native retry for scheduled order ${order.order_number}`);
              newStatus = 'pending_zinc_retry';
              nextRetryAt = new Date(Date.now() + (errorClassification.retryDelay || 3600) * 1000).toISOString();
            } else {
              // Use our retry system
              const retryDelay = errorClassification.retryDelay || 3600; // Default 1 hour
              nextRetryAt = new Date(Date.now() + retryDelay * 1000).toISOString();
              console.log(`🔄 Scheduling retry for scheduled order ${order.order_number} in ${retryDelay} seconds`);
            }
          } else {
            newStatus = 'failed';
            console.log(`❌ No retry scheduled for scheduled order ${order.order_number} - error type: ${errorClassification.type}`);
          }

          // Atomic rollback with comprehensive error tracking
          await supabase
            .from('orders')
            .update({
              status: newStatus,
              retry_count: (order.retry_count || 0) + 1,
              retry_reason: `Scheduled processing failed [${errorClassification.type}]: ${zmaError.message}`,
              next_retry_at: nextRetryAt,
              error_classification: errorClassification.type,
              admin_message: errorClassification.adminMessage,
              updated_at: new Date().toISOString()
            })
            .eq('id', order.id);

          // Create admin alert for critical errors
          if (errorClassification.requiresAdminIntervention) {
            await supabase
              .from('admin_alerts')
              .insert({
                alert_type: 'scheduled_order_critical_error',
                severity: errorClassification.alertLevel || 'critical',
                order_id: order.id,
                user_id: order.user_id,
                message: `Scheduled order ${order.order_number} requires admin intervention: ${errorClassification.adminMessage}`,
                requires_action: true,
                metadata: {
                  errorType: errorClassification.type,
                  originalError: zmaError,
                  retryCount: (order.retry_count || 0) + 1
                }
              });
          }

          results.push({
            orderId: order.id,
            orderNumber: order.order_number,
            success: false,
            error: zmaError.message,
            errorClassification: errorClassification.type,
            userMessage: errorClassification.userFriendlyMessage,
            willRetry: errorClassification.shouldRetry,
            nextRetryAt
          })
          failureCount++
        } else {
          console.log(`✅ Successfully processed scheduled order ${order.order_number} with webhook integration`)
          console.log(`🔗 Real-time status updates will be received via webhook system`)
          
          // Track success metrics
          await trackZmaOrderSuccess(order.user_id, order.id, order.total_amount, supabase);
          
          results.push({
            orderId: order.id,
            orderNumber: order.order_number,
            success: true,
            zmaResult: zmaResult,
            processedAt: new Date().toISOString(),
            securityValidationPassed: true
          })
          successCount++
        }

        // Add small delay between orders to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 2000)) // 2 second delay

      } catch (orderError) {
        console.error(`❌ Unexpected error processing scheduled order ${order.order_number}:`, orderError)
        
        // Enhanced error tracking and rollback
        await trackZmaOrderFailure(order.user_id, order.id, 'system_error', orderError, supabase);
        
        // Atomic rollback to scheduled status
        await supabase
          .from('orders')
          .update({
            status: 'scheduled',
            retry_count: (order.retry_count || 0) + 1,
            retry_reason: `System error: ${(orderError instanceof Error ? orderError.message : String(orderError))}`,
            next_retry_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // Retry in 1 hour
            updated_at: new Date().toISOString()
          })
          .eq('id', order.id);
        
        results.push({
          orderId: order.id,
          orderNumber: order.order_number,
          success: false,
          error: (orderError instanceof Error ? orderError.message : String(orderError)),
          errorType: 'system_error',
          willRetry: true
        })
        failureCount++
      }
    }

    console.log(`📊 Scheduled order processing complete:`)
    console.log(`   ✅ Success: ${successCount}`)
    console.log(`   ❌ Failures: ${failureCount}`)
    console.log(`   📦 Total: ${ordersToProcess.length}`)

    // Update cron execution log
    if (cronLogId) {
      await supabase
        .from('cron_execution_logs')
        .update({
          execution_completed_at: new Date().toISOString(),
          status: 'completed',
          orders_processed: ordersToProcess.length,
          success_count: successCount,
          failure_count: failureCount,
          execution_metadata: {
            trigger_source: 'cron',
            execution_date: new Date().toISOString(),
            processing_cutoff_date: cutoffDateString,
            results_summary: results
          }
        })
        .eq('id', cronLogId)
    }

    // Check for missed orders and create alerts
    await supabase.rpc('check_missed_scheduled_orders')

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Processed ${ordersToProcess.length} scheduled orders`,
        ordersProcessed: ordersToProcess.length,
        successCount,
        failureCount,
        results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Error in process-scheduled-orders function:', error)
    
    // Create Supabase client for error logging
    const supabaseErrorClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    // Get cronLogId from outer scope
    if (cronLogId) {
      await supabaseErrorClient
        .from('cron_execution_logs')
        .update({
          execution_completed_at: new Date().toISOString(),
          status: 'failed',
          error_message: (error instanceof Error ? error.message : String(error)),
          execution_metadata: {
            trigger_source: 'cron',
            execution_date: new Date().toISOString(),
            error_details: (error instanceof Error ? (error.stack || error.toString()) : String(error))
          }
        })
        .eq('id', cronLogId)
    }
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: (error instanceof Error ? error.message : String(error)) 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})