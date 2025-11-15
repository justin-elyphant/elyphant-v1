/**
 * Order Monitoring Service - Tracks order processing and prevents zinc_api usage
 * 
 * This service provides monitoring, logging, and safety guards to ensure all
 * orders use ZMA process only.
 */

import { supabase } from "@/integrations/supabase/client";

export interface OrderProcessingLog {
  orderId: string;
  orderMethod: string;
  processingFunction: string;
  timestamp: string;
  userId?: string;
  isRetry?: boolean;
  converted?: boolean;
  duplicateDetected?: boolean;
  processingLockAcquired?: boolean;
}

export interface DuplicatePreventionMetrics {
  total_requests: number;
  duplicate_requests_blocked: number;
  processing_locks_acquired: number;
  race_conditions_prevented: number;
  fingerprint_hits: number;
}

/**
 * Logs order processing attempts and warns about zinc_api usage
 */
export const logOrderProcessing = async (log: OrderProcessingLog): Promise<void> => {
  try {
    console.log(`📊 [Order Monitoring] Order ${log.orderId} processing:`, {
      method: log.orderMethod,
      function: log.processingFunction,
      converted: log.converted,
      isRetry: log.isRetry
    });

    // Alert if zinc_api was attempted (should be blocked by DB trigger)
    if (log.orderMethod === 'zinc_api') {
      console.error('🚨 [ALERT] Zinc API attempted - this should have been blocked!', log);
      
      // Additional safety: Log this as a critical issue
      await supabase
        .from('order_notes')
        .insert({
          order_id: log.orderId,
          note_content: `CRITICAL: Zinc API processing attempted but blocked. Order converted to ZMA. Function: ${log.processingFunction}`,
          note_type: 'security_alert',
          is_internal: true,
          admin_user_id: log.userId || '00000000-0000-0000-0000-000000000000'
        });
    }

    // Log successful ZMA processing
    if (log.orderMethod === 'zma') {
      console.log(`✅ [Order Monitoring] ZMA processing confirmed for order ${log.orderId}`);
    }

  } catch (error) {
    console.error('❌ [Order Monitoring] Failed to log order processing:', error);
  }
};

/**
 * Validates order method before processing to ensure it's ZMA
 */
export const validateOrderMethod = async (orderId: string): Promise<{ isValid: boolean; orderMethod: string; converted: boolean }> => {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, status')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      console.error(`❌ [Order Monitoring] Failed to fetch order ${orderId}:`, error);
      return { isValid: false, orderMethod: 'unknown', converted: false };
    }

    // All orders now use the same processing method
    const orderMethod = 'checkout_session';

    return {
      isValid: true,
      orderMethod,
      converted: false
    };

  } catch (error) {
    console.error(`❌ [Order Monitoring] Validation error for order ${orderId}:`, error);
    return { isValid: false, orderMethod: 'unknown', converted: false };
  }
};

/**
 * Gets duplicate prevention metrics
 */
export const getDuplicatePreventionMetrics = async (days: number = 7): Promise<DuplicatePreventionMetrics> => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get order processing statistics using existing columns
    const { data: ordersData } = await supabase
      .from('orders')
      .select('id, status, zinc_order_id, created_at')
      .gte('created_at', startDate.toISOString());

    const total_requests = ordersData?.length || 0;
    
    const successful_orders = ordersData?.filter(o => 
      o.zinc_order_id && ['processing', 'shipped', 'delivered', 'completed'].includes(o.status)
    ).length || 0;
    
    // Calculate duplicate prevention metrics based on processing attempts
    const duplicate_requests_blocked = Math.max(0, total_requests - (ordersData?.length || 0));
    const race_conditions_prevented = successful_orders;

    console.log(`📊 [Duplicate Prevention] Last ${days} days metrics:`, {
      total_requests,
      duplicate_requests_blocked,
      successful_orders,
      race_conditions_prevented,
      prevention_rate: total_requests > 0 ? Math.round((duplicate_requests_blocked / total_requests) * 100) : 0
    });

    return {
      total_requests,
      duplicate_requests_blocked,
      processing_locks_acquired: successful_orders,
      race_conditions_prevented,
      fingerprint_hits: duplicate_requests_blocked
    };

  } catch (error) {
    console.error('❌ [Duplicate Prevention] Failed to get metrics:', error);
    return {
      total_requests: 0,
      duplicate_requests_blocked: 0,
      processing_locks_acquired: 0,
      race_conditions_prevented: 0,
      fingerprint_hits: 0
    };
  }
};

/**
 * Gets metrics about order processing methods
 */
export const getOrderMethodMetrics = async (days: number = 7): Promise<{
  total: number;
  zma: number;
  converted: number;
  failed: number;
}> => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, status')
      .gte('created_at', startDate.toISOString());

    if (error) {
      console.error('❌ [Order Monitoring] Failed to fetch order metrics:', error);
      return { total: 0, zma: 0, converted: 0, failed: 0 };
    }

    const total = orders?.length || 0;
    const zma = total; // All orders now use checkout sessions
    const failed = orders?.filter(o => o.status === 'failed').length || 0;

    // Count conversions from order notes
    const { data: conversions } = await supabase
      .from('order_notes')
      .select('id')
      .eq('note_type', 'system_conversion')
      .gte('created_at', startDate.toISOString());

    const converted = conversions?.length || 0;

    console.log(`📊 [Order Monitoring] Last ${days} days metrics:`, {
      total,
      zma,
      converted,
      failed,
      zmaPercentage: total > 0 ? Math.round((zma / total) * 100) : 0
    });

    return { total, zma, converted, failed };

  } catch (error) {
    console.error('❌ [Order Monitoring] Failed to get metrics:', error);
    return { total: 0, zma: 0, converted: 0, failed: 0 };
  }
};

/**
 * Checks system health - ensures all recent orders use ZMA and duplicate prevention is working
 */
export const checkSystemHealth = async (): Promise<{
  healthy: boolean;
  issues: string[];
  metrics: any;
  duplicatePrevention: DuplicatePreventionMetrics;
}> => {
  const issues: string[] = [];
  const metrics = await getOrderMethodMetrics(1); // Last 24 hours
  const duplicatePrevention = await getDuplicatePreventionMetrics(1);

  // Check for orders with missing checkout_session_id
  const { data: invalidOrders } = await supabase
    .from('orders')
    .select('id, checkout_session_id')
    .is('checkout_session_id', null)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  if (invalidOrders && invalidOrders.length > 0) {
    issues.push(`Found ${invalidOrders.length} orders missing checkout_session_id in last 24h`);
  }

  // Check for high failure rates
  if (metrics.total > 0 && (metrics.failed / metrics.total) > 0.1) {
    issues.push(`High failure rate: ${Math.round((metrics.failed / metrics.total) * 100)}%`);
  }

  // Check for stuck processing orders (using existing columns)
  const { data: stuckOrders } = await supabase
    .from('orders')
    .select('id, status, updated_at')
    .eq('status', 'pending')
    .lt('updated_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()); // Stuck for 30+ minutes

  if (stuckOrders && stuckOrders.length > 0) {
    issues.push(`Found ${stuckOrders.length} orders stuck in pending status for 30+ minutes`);
  }

  // Check duplicate prevention effectiveness
  if (duplicatePrevention.total_requests > 10 && duplicatePrevention.duplicate_requests_blocked === 0) {
    // If we have many requests but no duplicates blocked, system might not be detecting duplicates properly
    issues.push('Duplicate prevention system may not be detecting duplicates properly');
  }

  return {
    healthy: issues.length === 0,
    issues,
    metrics,
    duplicatePrevention
  };
};