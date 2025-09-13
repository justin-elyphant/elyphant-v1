import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ZmaRateLimitStatus {
  isLimited: boolean;
  ordersToday: number;
  ordersThisHour: number;
  resetTime: Date | null;
  consecutiveFailures: number;
}

interface ZmaCostStatus {
  dailySpent: number;
  monthlySpent: number;
  dailyLimit: number;
  monthlyLimit: number;
  isNearLimit: boolean;
}

interface ZmaOrderValidation {
  isValid: boolean;
  isDuplicate: boolean;
  isSuspiciousPattern: boolean;
  reasons: string[];
}

export const useZmaOrderSecurity = () => {
  const { toast } = useToast();
  const [rateLimitStatus, setRateLimitStatus] = useState<ZmaRateLimitStatus>({
    isLimited: false,
    ordersToday: 0,
    ordersThisHour: 0,
    resetTime: null,
    consecutiveFailures: 0
  });

  const [costStatus, setCostStatus] = useState<ZmaCostStatus>({
    dailySpent: 0,
    monthlySpent: 0,
    dailyLimit: 500, // $500 daily limit
    monthlyLimit: 2000, // $2000 monthly limit
    isNearLimit: false
  });

  // Check ZMA order rate limits
  const checkZmaRateLimit = async (userId: string): Promise<boolean> => {
    try {
      const { data: canOrder } = await supabase
        .rpc('check_zma_order_rate_limit', { user_uuid: userId });
      
      // Get current rate limit status
      const { data: rateLimitData } = await supabase
        .from('zma_order_rate_limits')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (rateLimitData) {
        setRateLimitStatus({
          isLimited: rateLimitData.is_rate_limited || false,
          ordersToday: rateLimitData.orders_today || 0,
          ordersThisHour: rateLimitData.orders_this_hour || 0,
          resetTime: rateLimitData.rate_limit_expires_at ? new Date(rateLimitData.rate_limit_expires_at) : null,
          consecutiveFailures: rateLimitData.consecutive_failures || 0
        });
      }

      if (!canOrder) {
        await logSecurityEvent('rate_limit', {
          userId,
          ordersToday: rateLimitData?.orders_today || 0,
          ordersThisHour: rateLimitData?.orders_this_hour || 0
        }, 'warning');
        
        toast.error("Order limit reached. You've reached your ZMA order limit. Please try again later.");
      }

      return canOrder || false;
    } catch (error) {
      console.error('ZMA rate limit check failed:', error);
      return false;
    }
  };

  // Check ZMA cost limits
  const checkZmaCostLimit = async (userId: string, orderAmount: number): Promise<boolean> => {
    try {
      // Get current spending totals
      const { data: costData } = await supabase
        .from('zma_cost_tracking')
        .select('daily_total, monthly_total')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const dailySpent = costData?.daily_total || 0;
      const monthlySpent = costData?.monthly_total || 0;
      const projectedDaily = dailySpent + orderAmount;
      const projectedMonthly = monthlySpent + orderAmount;

      setCostStatus({
        dailySpent,
        monthlySpent,
        dailyLimit: costStatus.dailyLimit,
        monthlyLimit: costStatus.monthlyLimit,
        isNearLimit: projectedDaily > (costStatus.dailyLimit * 0.8) || projectedMonthly > (costStatus.monthlyLimit * 0.8)
      });

      // Check if order would exceed limits
      if (projectedDaily > costStatus.dailyLimit || projectedMonthly > costStatus.monthlyLimit) {
        await logSecurityEvent('cost_limit', {
          userId,
          orderAmount,
          dailySpent,
          monthlySpent,
          dailyLimit: costStatus.dailyLimit,
          monthlyLimit: costStatus.monthlyLimit
        }, 'critical');

        toast.error("Spending limit exceeded. This order would exceed your spending limits. Please review your budget.");
        return false;
      }

      // Warn if approaching limits
      if (costStatus.isNearLimit) {
        toast.warning("Approaching spending limit. You're approaching your spending limits. Please monitor your budget.");
      }

      return true;
    } catch (error) {
      console.error('ZMA cost limit check failed:', error);
      return true; // Allow order on error, but log it
    }
  };

  // Validate ZMA order for duplicates and suspicious patterns
  const validateZmaOrder = async (
    userId: string, 
    orderData: any
  ): Promise<ZmaOrderValidation> => {
    try {
      // Create order hash for duplicate detection
      const orderHash = btoa(JSON.stringify({
        products: orderData.products?.map((p: any) => ({ id: p.product_id, quantity: p.quantity })),
        shipping: orderData.shipping_address,
        amount: orderData.total_amount
      }));

      const { data: validationResult } = await supabase
        .rpc('validate_zma_order', {
          user_uuid: userId,
          order_hash_param: orderHash,
          order_amount: orderData.total_amount
        });

      const vr = (validationResult as any) || {};
      const validation: ZmaOrderValidation = {
        isValid: !!vr.is_valid,
        isDuplicate: !!vr.is_duplicate,
        isSuspiciousPattern: !!vr.is_suspicious_pattern,
        reasons: []
      };

      // Build reasons for rejection
      if (validation.isDuplicate) {
        validation.reasons.push('Duplicate order detected within the last hour');
      }
      if (validation.isSuspiciousPattern) {
        validation.reasons.push('Multiple high-value orders detected recently');
      }

      // Log security events for invalid orders
      if (!validation.isValid) {
        await logSecurityEvent('suspicious_order', {
          userId,
          orderHash,
          amount: orderData.total_amount,
          validation: validationResult
        }, validation.isSuspiciousPattern ? 'critical' : 'warning');

        toast.error(`Order validation failed: ${validation.reasons.join('. ')}`);
      }

      return validation;
    } catch (error) {
      console.error('ZMA order validation failed:', error);
      return {
        isValid: true, // Allow order on validation error
        isDuplicate: false,
        isSuspiciousPattern: false,
        reasons: []
      };
    }
  };

  // Track ZMA order cost
  const trackZmaOrderCost = async (
    userId: string,
    orderId: string,
    cost: number,
    costType: string = 'order'
  ) => {
    try {
      await supabase.rpc('track_zma_cost', {
        user_uuid: userId,
        order_uuid: orderId,
        cost,
        cost_type_param: costType
      });
    } catch (error) {
      console.error('Failed to track ZMA cost:', error);
    }
  };

  // Log security events
  const logSecurityEvent = async (
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

  // Update retry failure count
  const updateRetryFailureCount = async (userId: string, increment: boolean = true) => {
    try {
      if (increment) {
        // Get current failure count and increment it
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
      } else {
        // Reset on successful order
        await supabase
          .from('zma_order_rate_limits')
          .update({ consecutive_failures: 0, updated_at: new Date().toISOString() })
          .eq('user_id', userId);
      }
    } catch (error) {
      console.error('Failed to update retry failure count:', error);
    }
  };

  // Get user's security status summary
  const getSecurityStatusSummary = async (userId: string) => {
    try {
      const [rateLimitData, costData, securityEvents] = await Promise.all([
        supabase
          .from('zma_order_rate_limits')
          .select('*')
          .eq('user_id', userId)
          .single(),
        supabase
          .from('zma_cost_tracking')
          .select('daily_total, monthly_total')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from('zma_security_events')
          .select('event_type, severity, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      return {
        rateLimit: rateLimitData.data,
        costs: costData.data,
        recentEvents: securityEvents.data || []
      };
    } catch (error) {
      console.error('Failed to get security status summary:', error);
      return null;
    }
  };

  return {
    rateLimitStatus,
    costStatus,
    checkZmaRateLimit,
    checkZmaCostLimit,
    validateZmaOrder,
    trackZmaOrderCost,
    logSecurityEvent,
    updateRetryFailureCount,
    getSecurityStatusSummary
  };
};