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
      .select('order_method')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      console.error(`❌ [Order Monitoring] Failed to fetch order ${orderId}:`, error);
      return { isValid: false, orderMethod: 'unknown', converted: false };
    }

    let converted = false;
    let orderMethod = order.order_method || 'zma';

    // Extra safety check - if somehow zinc_api got through, convert it
    if (orderMethod === 'zinc_api') {
      console.warn(`⚠️ [Order Monitoring] Converting order ${orderId} from zinc_api to ZMA`);
      
      await supabase
        .from('orders')
        .update({ order_method: 'zma' })
        .eq('id', orderId);
      
      orderMethod = 'zma';
      converted = true;
    }

    return {
      isValid: orderMethod === 'zma',
      orderMethod,
      converted
    };

  } catch (error) {
    console.error(`❌ [Order Monitoring] Validation error for order ${orderId}:`, error);
    return { isValid: false, orderMethod: 'unknown', converted: false };
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
      .select('order_method, status')
      .gte('created_at', startDate.toISOString());

    if (error) {
      console.error('❌ [Order Monitoring] Failed to fetch order metrics:', error);
      return { total: 0, zma: 0, converted: 0, failed: 0 };
    }

    const total = orders?.length || 0;
    const zma = orders?.filter(o => o.order_method === 'zma').length || 0;
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
 * Checks system health - ensures all recent orders use ZMA
 */
export const checkSystemHealth = async (): Promise<{
  healthy: boolean;
  issues: string[];
  metrics: any;
}> => {
  const issues: string[] = [];
  const metrics = await getOrderMethodMetrics(1); // Last 24 hours

  // Check if any orders are using non-ZMA methods
  const { data: nonZmaOrders } = await supabase
    .from('orders')
    .select('id, order_method')
    .neq('order_method', 'zma')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  if (nonZmaOrders && nonZmaOrders.length > 0) {
    issues.push(`Found ${nonZmaOrders.length} orders with non-ZMA method in last 24h`);
  }

  // Check for high failure rates
  if (metrics.total > 0 && (metrics.failed / metrics.total) > 0.1) {
    issues.push(`High failure rate: ${Math.round((metrics.failed / metrics.total) * 100)}%`);
  }

  return {
    healthy: issues.length === 0,
    issues,
    metrics
  };
};