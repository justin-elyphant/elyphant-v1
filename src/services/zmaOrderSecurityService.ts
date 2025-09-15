/**
 * ZMA Order Security Service - Enhanced protective measures for ZMA order processing
 * 
 * This service provides comprehensive security validations, rate limiting,
 * cost tracking, and fraud detection for ZMA orders.
 */

import { supabase } from "@/integrations/supabase/client";

export interface ZmaSecurityCheckResult {
  passed: boolean;
  blocked: boolean;
  warnings: string[];
  errors: string[];
  metadata: {
    rateLimitStatus?: any;
    costStatus?: any;
    validationResult?: any;
  };
}

export interface ZmaOrderContext {
  userId: string;
  orderId: string;
  orderData: any;
  isRetry?: boolean;
  retryCount?: number;
}

/**
 * Comprehensive ZMA order security check
 * Runs all security validations before allowing order processing
 */
export const performZmaSecurityCheck = async (
  context: ZmaOrderContext
): Promise<ZmaSecurityCheckResult> => {
  const result: ZmaSecurityCheckResult = {
    passed: true,
    blocked: false,
    warnings: [],
    errors: [],
    metadata: {}
  };

  try {
    // 1. Rate Limiting Check
    const rateLimitCheck = await checkZmaRateLimit(context.userId);
    result.metadata.rateLimitStatus = rateLimitCheck;
    
    if (!rateLimitCheck.allowed) {
      result.blocked = true;
      result.passed = false;
      result.errors.push(`Rate limit exceeded: ${rateLimitCheck.reason}`);
      
      // Log security event
      await logZmaSecurityEvent('rate_limit_exceeded', {
        userId: context.userId,
        orderId: context.orderId,
        rateLimitData: rateLimitCheck
      }, 'warning');
    }

    // 2. Cost Limit Check
    const costCheck = await checkZmaCostLimits(context.userId, context.orderData.total_amount);
    result.metadata.costStatus = costCheck;
    
    if (!costCheck.allowed) {
      result.blocked = true;
      result.passed = false;
      result.errors.push(`Cost limit exceeded: ${costCheck.reason}`);
      
      await logZmaSecurityEvent('cost_limit_exceeded', {
        userId: context.userId,
        orderId: context.orderId,
        orderAmount: context.orderData.total_amount,
        costData: costCheck
      }, 'critical');
    } else if (costCheck.nearLimit) {
      result.warnings.push(`Approaching cost limits: ${costCheck.warning}`);
    }

    // 3. Order Validation (duplicates, suspicious patterns)
    const validationCheck = await validateZmaOrderSecurity(context);
    result.metadata.validationResult = validationCheck;
    
    if (!validationCheck.valid) {
      if (validationCheck.severity === 'critical') {
        result.blocked = true;
        result.passed = false;
        result.errors.push(`Order validation failed: ${validationCheck.reason}`);
      } else {
        result.warnings.push(`Order validation warning: ${validationCheck.reason}`);
      }
      
      await logZmaSecurityEvent('validation_failed', {
        userId: context.userId,
        orderId: context.orderId,
        validationData: validationCheck
      }, validationCheck.severity as 'info' | 'warning' | 'critical');
    }

    // 4. Retry Abuse Check (if this is a retry)
    if (context.isRetry) {
      const retryCheck = await checkRetryAbuse(context.userId, context.retryCount || 0);
      
      if (!retryCheck.allowed) {
        result.blocked = true;
        result.passed = false;
        result.errors.push(`Retry abuse detected: ${retryCheck.reason}`);
        
        await logZmaSecurityEvent('retry_abuse', {
          userId: context.userId,
          orderId: context.orderId,
          retryCount: context.retryCount,
          retryData: retryCheck
        }, 'critical');
      }
    }

    // 5. User Behavior Analysis
    const behaviorCheck = await analyzeUserBehavior(context.userId);
    if (behaviorCheck.suspicious) {
      result.warnings.push(`Suspicious behavior detected: ${behaviorCheck.reason}`);
      
      await logZmaSecurityEvent('suspicious_behavior', {
        userId: context.userId,
        orderId: context.orderId,
        behaviorData: behaviorCheck
      }, 'warning');
    }

  } catch (error) {
    console.error('ZMA security check failed:', error);
    result.errors.push('Security check system error');
    result.passed = false;
  }

  return result;
};

/**
 * Check ZMA order rate limits
 */
const checkZmaRateLimit = async (userId: string) => {
  try {
    const { data: canOrder } = await supabase
      .rpc('check_zma_order_rate_limit', { user_uuid: userId });
    
    const { data: rateLimitData } = await supabase
      .from('zma_order_rate_limits')
      .select('*')
      .eq('user_id', userId)
      .single();

    return {
      allowed: canOrder || false,
      reason: !canOrder ? `Orders today: ${rateLimitData?.orders_today || 0}, Orders this hour: ${rateLimitData?.orders_this_hour || 0}` : null,
      data: rateLimitData
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return { allowed: false, reason: 'Rate limit check failed', data: null };
  }
};

/**
 * Check ZMA cost limits
 */
const checkZmaCostLimits = async (userId: string, orderAmount: number) => {
  try {
    const { data: costData } = await supabase
      .from('zma_cost_tracking')
      .select('daily_total, monthly_total')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const dailySpent = costData?.daily_total || 0;
    const monthlySpent = costData?.monthly_total || 0;
    const dailyLimit = 500; // $500 daily limit
    const monthlyLimit = 2000; // $2000 monthly limit
    
    const projectedDaily = dailySpent + orderAmount;
    const projectedMonthly = monthlySpent + orderAmount;
    
    const exceedsDaily = projectedDaily > dailyLimit;
    const exceedsMonthly = projectedMonthly > monthlyLimit;
    const nearDaily = projectedDaily > (dailyLimit * 0.8);
    const nearMonthly = projectedMonthly > (monthlyLimit * 0.8);

    return {
      allowed: !exceedsDaily && !exceedsMonthly,
      reason: exceedsDaily ? 'Daily spending limit exceeded' : exceedsMonthly ? 'Monthly spending limit exceeded' : null,
      nearLimit: nearDaily || nearMonthly,
      warning: nearDaily ? 'Approaching daily limit' : nearMonthly ? 'Approaching monthly limit' : null,
      data: { dailySpent, monthlySpent, projectedDaily, projectedMonthly }
    };
  } catch (error) {
    console.error('Cost limit check failed:', error);
    return { allowed: true, reason: null, nearLimit: false, warning: null, data: null };
  }
};

/**
 * Validate ZMA order for security issues
 */
const validateZmaOrderSecurity = async (context: ZmaOrderContext) => {
  try {
    // Create order hash for duplicate detection
    const orderHash = btoa(JSON.stringify({
      products: context.orderData.products?.map((p: any) => ({ id: p.product_id, quantity: p.quantity })),
      shipping: context.orderData.shipping_address,
      amount: context.orderData.total_amount
    }));

    const { data: validationResult } = await supabase
      .rpc('validate_zma_order', {
        user_uuid: context.userId,
        order_hash_param: orderHash,
        order_amount: context.orderData.total_amount
      });

    const result = validationResult && typeof validationResult === 'object' ? validationResult as any : {};
    const isDuplicate = result?.is_duplicate || false;
    const isSuspicious = result?.is_suspicious_pattern || false;
    const isValid = result?.is_valid || false;

    return {
      valid: isValid,
      severity: isSuspicious ? 'critical' : isDuplicate ? 'warning' : 'info',
      reason: isDuplicate ? 'Duplicate order detected' : isSuspicious ? 'Suspicious order pattern' : null,
      data: validationResult
    };
  } catch (error) {
    console.error('Order validation failed:', error);
    return { valid: true, severity: 'info', reason: null, data: null };
  }
};

/**
 * Check for retry abuse patterns
 */
const checkRetryAbuse = async (userId: string, retryCount: number) => {
  try {
    const { data: rateLimitData } = await supabase
      .from('zma_order_rate_limits')
      .select('consecutive_failures')
      .eq('user_id', userId)
      .single();

    const consecutiveFailures = rateLimitData?.consecutive_failures || 0;
    const maxRetries = 3;
    const maxConsecutiveFailures = 5;

    return {
      allowed: retryCount < maxRetries && consecutiveFailures < maxConsecutiveFailures,
      reason: retryCount >= maxRetries ? 'Too many retries for this order' : 
              consecutiveFailures >= maxConsecutiveFailures ? 'Too many consecutive failures' : null,
      data: { retryCount, consecutiveFailures }
    };
  } catch (error) {
    console.error('Retry abuse check failed:', error);
    return { allowed: true, reason: null, data: null };
  }
};

/**
 * Analyze user behavior patterns
 */
const analyzeUserBehavior = async (userId: string) => {
  try {
    // Check for rapid successive orders
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('id, created_at, total_amount')
      .eq('user_id', userId)
      .gte('created_at', oneHourAgo)
      .order('created_at', { ascending: false });

    const orderCount = recentOrders?.length || 0;
    const totalAmount = recentOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

    // Suspicious patterns
    const tooManyOrders = orderCount > 5;
    const highTotalAmount = totalAmount > 1000;
    const rapidSuccession = orderCount > 2 && recentOrders && 
      recentOrders.length > 1 && 
      (new Date(recentOrders[0].created_at).getTime() - new Date(recentOrders[1].created_at).getTime()) < 5 * 60 * 1000; // 5 minutes

    return {
      suspicious: tooManyOrders || highTotalAmount || rapidSuccession,
      reason: tooManyOrders ? 'Too many orders in one hour' :
              highTotalAmount ? 'High total amount in one hour' :
              rapidSuccession ? 'Orders placed in rapid succession' : null,
      data: { orderCount, totalAmount, rapidSuccession }
    };
  } catch (error) {
    console.error('Behavior analysis failed:', error);
    return { suspicious: false, reason: null, data: null };
  }
};

/**
 * Log ZMA security events
 */
const logZmaSecurityEvent = async (
  eventType: string,
  eventData: any,
  severity: 'info' | 'warning' | 'critical' = 'info'
) => {
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
};

/**
 * Track successful ZMA order cost
 */
export const trackZmaOrderSuccess = async (
  userId: string,
  orderId: string,
  cost: number
) => {
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
};

/**
 * Track ZMA order failure
 */
export const trackZmaOrderFailure = async (
  userId: string,
  orderId: string,
  errorType: string,
  errorDetails: any
) => {
  try {
    // Increment consecutive failures
    const { data: currentData } = await supabase
      .from('zma_order_rate_limits')
      .select('consecutive_failures')
      .eq('user_id', userId)
      .single();
    
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
    }, newCount > 3 ? 'warning' : 'info');

  } catch (error) {
    console.error('Failed to track ZMA order failure:', error);
  }
};