import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";

/**
 * Enhanced Order Monitoring Service integrated with existing orderMonitoringService
 * Provides real-time tracking and recovery capabilities for order processing pipeline
 */

// Order monitoring integration functions
export const triggerOrderRecovery = async (orderId: string) => {
  try {
    console.log('[ORDER MONITORING] Triggering manual recovery for order:', orderId);
    
    const { data, error } = await supabase.rpc('trigger_order_recovery', {
      order_uuid: orderId
    });

    if (error) {
      console.error('[ORDER MONITORING] Recovery trigger failed:', error);
      toast.error('Failed to trigger order recovery');
      return false;
    }

    console.log('[ORDER MONITORING] Recovery triggered successfully:', data);
    toast.success('Order recovery initiated');
    return true;
  } catch (error) {
    console.error('[ORDER MONITORING] Error triggering recovery:', error);
    toast.error('Error triggering order recovery');
    return false;
  }
};

export const checkOrderRecoveryStatus = async (orderId: string) => {
  try {
    const { data: recoveryLogs, error } = await supabase
      .from('order_recovery_logs')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('[ORDER MONITORING] Failed to fetch recovery logs:', error);
      return null;
    }

    return recoveryLogs;
  } catch (error) {
    console.error('[ORDER MONITORING] Error checking recovery status:', error);
    return null;
  }
};

export const getPaymentVerificationAudit = async (orderId: string) => {
  try {
    const { data: auditLogs, error } = await supabase
      .from('payment_verification_audit')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('[ORDER MONITORING] Failed to fetch verification audit:', error);
      return null;
    }

    return auditLogs;
  } catch (error) {
    console.error('[ORDER MONITORING] Error fetching verification audit:', error);
    return null;
  }
};

export const getOrderStatusMonitoring = async () => {
  try {
    const { data: statusMonitoring, error } = await supabase
      .from('order_status_monitoring')
      .select('*')
      .eq('alert_sent', false)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('[ORDER MONITORING] Failed to fetch status monitoring:', error);
      return [];
    }

    return statusMonitoring || [];
  } catch (error) {
    console.error('[ORDER MONITORING] Error fetching status monitoring:', error);
    return [];
  }
};

// Real-time monitoring hook for order status changes
export const useOrderStatusMonitoring = (orderId?: string) => {
  const [monitoringData, setMonitoringData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMonitoringData = async () => {
    if (orderId) {
      const recoveryLogs = await checkOrderRecoveryStatus(orderId);
      const auditLogs = await getPaymentVerificationAudit(orderId);
      
      setMonitoringData([
        ...(recoveryLogs || []).map(log => ({ ...log, type: 'recovery' })),
        ...(auditLogs || []).map(log => ({ ...log, type: 'audit' }))
      ]);
    } else {
      const statusAlerts = await getOrderStatusMonitoring();
      setMonitoringData(statusAlerts);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMonitoringData();

    // Set up real-time subscription for monitoring updates
    const channel = supabase
      .channel('order-monitoring-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_recovery_logs',
          filter: orderId ? `order_id=eq.${orderId}` : undefined
        },
        (payload) => {
          console.log('[ORDER MONITORING] Recovery log update:', payload);
          fetchMonitoringData(); // Refresh data on changes
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_verification_audit',
          filter: orderId ? `order_id=eq.${orderId}` : undefined
        },
        (payload) => {
          console.log('[ORDER MONITORING] Verification audit update:', payload);
          fetchMonitoringData(); // Refresh data on changes
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  return { monitoringData, isLoading, refetch: fetchMonitoringData };
};

// Enhanced order processing validation
export const validateOrderProcessingPipeline = async (orderId: string) => {
  try {
    console.log('[ORDER MONITORING] Validating processing pipeline for order:', orderId);
    
    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return {
        isValid: false,
        issues: ['Order not found'],
        recommendations: ['Verify order ID']
      };
    }

    const issues = [];
    const recommendations = [];

    // Check payment status alignment
    if (order.status === 'processing' && order.payment_status !== 'succeeded') {
      issues.push('Payment status mismatch: processing order without succeeded payment');
      recommendations.push('Verify payment with Stripe and update payment_status');
    }

    // Check ZMA processing
    if (order.payment_status === 'succeeded' && !order.zinc_order_id) {
      const timeSinceUpdate = Date.now() - new Date(order.updated_at).getTime();
      if (timeSinceUpdate > 10 * 60 * 1000) { // 10 minutes
        issues.push('ZMA processing delayed: payment succeeded but no zinc_order_id after 10+ minutes');
        recommendations.push('Manually trigger ZMA processing');
      }
    }

    // Check for stuck orders
    if (order.status === 'payment_verification_failed') {
      issues.push('Order stuck in payment verification failed state');
      recommendations.push('Run payment reconciliation to verify Stripe payment status');
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations,
      order
    };
  } catch (error) {
    console.error('[ORDER MONITORING] Error validating pipeline:', error);
    return {
      isValid: false,
      issues: ['Validation error'],
      recommendations: ['Check logs for details']
    };
  }
};