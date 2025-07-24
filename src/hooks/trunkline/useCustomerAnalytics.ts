import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Profile = Database['public']['Tables']['profiles']['Row'];
type Order = Database['public']['Tables']['orders']['Row'];

export interface CustomerAnalytics {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate: string | null;
  lifetimeValue: number;
  preferredCategories: string[];
  riskLevel: 'low' | 'medium' | 'high';
  
  // ENHANCED INTELLIGENCE (Phase 1 Extension)
  customerSegment: 'champion' | 'loyal' | 'potential' | 'new' | 'at_risk' | 'hibernating';
  predictedChurnRate: number;
  nextBestAction: string;
  engagementScore: number;
  nextPurchaseProbability: number;
  predictedLTV: number;
  orderTrends: {
    growthTrend: 'up' | 'down' | 'stable';
    monthlyOrderCount: number;
    monthlySpend: number;
    avgMonthlyOrder: number;
  };
}

export interface CustomerFilters {
  search?: string;
  hasOrders?: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  };
  riskLevel?: string;
}

export const useCustomerAnalytics = () => {
  const [loading, setLoading] = useState(false);
  
  const getCustomerAnalytics = async (customerId: string): Promise<CustomerAnalytics> => {
    try {
      setLoading(true);
      
      // Get customer orders
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*)
        `)
        .eq('user_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const orderData = orders || [];
      const totalOrders = orderData.length;
      const totalSpent = orderData.reduce((sum, order) => sum + Number(order.total_amount), 0);
      const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
      const lastOrderDate = orderData.length > 0 ? orderData[0].created_at : null;
      
      // Calculate customer lifetime value (CLV)
      const monthsActive = lastOrderDate ? 
        Math.max(1, Math.ceil((new Date().getTime() - new Date(lastOrderDate).getTime()) / (1000 * 60 * 60 * 24 * 30))) : 1;
      const lifetimeValue = totalSpent * (12 / monthsActive); // Projected annual value
      
      // Calculate risk level based on order patterns
      const recentOrders = orderData.filter(order => 
        new Date(order.created_at) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      );
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      
      if (recentOrders.length === 0 && totalOrders > 0) {
        riskLevel = 'high'; // No recent activity
      } else if (averageOrderValue < 50 || totalOrders < 3) {
        riskLevel = 'medium'; // Low engagement
      }
      
      // Extract preferred categories from order items  
      const allItems = orderData.flatMap(order => order.order_items || []);
      const categoryMap: { [key: string]: number } = {};
      
      allItems.forEach(item => {
        // Enhanced category analysis based on product names
        const productName = item.product_name?.toLowerCase() || '';
        let category = 'General';
        
        if (productName.includes('book') || productName.includes('read')) category = 'Books';
        else if (productName.includes('cloth') || productName.includes('fashion')) category = 'Fashion';
        else if (productName.includes('tech') || productName.includes('electronic')) category = 'Electronics';
        else if (productName.includes('home') || productName.includes('kitchen')) category = 'Home & Garden';
        
        categoryMap[category] = (categoryMap[category] || 0) + 1;
      });
      
      const preferredCategories = Object.entries(categoryMap)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([category]) => category);

      // ENHANCED INTELLIGENCE CALCULATIONS
      const orderTrends = calculateOrderTrends(orderData);
      const customerSegment = calculateCustomerSegment(totalOrders, totalSpent, orderTrends);
      const predictedChurnRate = calculateChurnProbability(totalOrders, orderTrends);
      const engagementScore = calculateEngagementScore(totalOrders, orderTrends, recentOrders.length);
      const nextPurchaseProbability = calculateNextPurchaseProbability(orderTrends, totalOrders);
      const predictedLTV = calculatePredictedLTV(totalSpent, customerSegment, orderTrends);
      const nextBestAction = generateNextBestAction(customerSegment, predictedChurnRate);

      return {
        totalOrders,
        totalSpent,
        averageOrderValue,
        lastOrderDate,
        lifetimeValue,
        preferredCategories,
        riskLevel,
        // Enhanced fields
        customerSegment,
        predictedChurnRate,
        nextBestAction,
        engagementScore,
        nextPurchaseProbability,
        predictedLTV,
        orderTrends
      };
    } catch (err) {
      console.error('Error calculating customer analytics:', err);
      return {
        totalOrders: 0,
        totalSpent: 0,
        averageOrderValue: 0,
        lastOrderDate: null,
        lifetimeValue: 0,
        preferredCategories: [],
        riskLevel: 'low',
        // Enhanced fallbacks
        customerSegment: 'new',
        predictedChurnRate: 0.2,
        nextBestAction: 'Welcome new customer',
        engagementScore: 0.1,
        nextPurchaseProbability: 0.2,
        predictedLTV: 0,
        orderTrends: {
          growthTrend: 'stable',
          monthlyOrderCount: 0,
          monthlySpend: 0,
          avgMonthlyOrder: 0
        }
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    getCustomerAnalytics,
    loading
  };
};

// ============================================================================
// ENHANCED INTELLIGENCE FUNCTIONS (Consolidated into Trunkline)
// ============================================================================

/**
 * Calculate order trends and patterns
 */
function calculateOrderTrends(orders: any[]): CustomerAnalytics['orderTrends'] {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const recentOrders = orders.filter(order => 
    new Date(order.created_at) >= thirtyDaysAgo
  );
  
  const monthlyOrderCount = recentOrders.length;
  const monthlySpend = recentOrders.reduce((sum, order) => 
    sum + Number(order.total_amount), 0
  );
  const avgMonthlyOrder = monthlyOrderCount > 0 ? monthlySpend / monthlyOrderCount : 0;
  
  // Calculate growth trend
  let growthTrend: 'up' | 'down' | 'stable' = 'stable';
  
  if (orders.length >= 4) {
    const currentMonth = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate.getMonth() === now.getMonth() && 
             orderDate.getFullYear() === now.getFullYear();
    }).length;
    
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1);
    const lastMonth = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate.getMonth() === lastMonthDate.getMonth() && 
             orderDate.getFullYear() === lastMonthDate.getFullYear();
    }).length;

    if (currentMonth > lastMonth) growthTrend = 'up';
    else if (currentMonth < lastMonth) growthTrend = 'down';
  }
  
  return {
    growthTrend,
    monthlyOrderCount,
    monthlySpend,
    avgMonthlyOrder
  };
}

/**
 * Calculate customer segment based on behavior
 */
function calculateCustomerSegment(
  totalOrders: number, 
  totalSpent: number, 
  orderTrends: CustomerAnalytics['orderTrends']
): CustomerAnalytics['customerSegment'] {
  // Champion: High value, high frequency, recent activity
  if (totalSpent > 500 && totalOrders > 5 && orderTrends.monthlyOrderCount > 0) {
    return 'champion';
  }
  
  // Loyal: Medium-high value, consistent activity
  if (totalSpent > 200 && totalOrders > 3 && orderTrends.growthTrend !== 'down') {
    return 'loyal';
  }
  
  // Potential: Recent activity, growing engagement
  if (orderTrends.monthlyOrderCount > 0 && orderTrends.growthTrend === 'up') {
    return 'potential';
  }
  
  // New: Few orders, recent signup
  if (totalOrders <= 2) {
    return 'new';
  }
  
  // At Risk: Previously active, declining engagement
  if (totalOrders > 2 && orderTrends.monthlyOrderCount === 0) {
    return 'at_risk';
  }
  
  // Hibernating: No recent activity
  return 'hibernating';
}

/**
 * Calculate churn probability
 */
function calculateChurnProbability(
  totalOrders: number, 
  orderTrends: CustomerAnalytics['orderTrends']
): number {
  let churnScore = 0;
  
  // No recent orders increases churn risk
  if (orderTrends.monthlyOrderCount === 0) churnScore += 0.4;
  
  // Declining trend increases churn risk  
  if (orderTrends.growthTrend === 'down') churnScore += 0.3;
  
  // Low total orders increases churn risk
  if (totalOrders < 3) churnScore += 0.2;
  
  // Low average order value increases churn risk
  if (orderTrends.avgMonthlyOrder < 50) churnScore += 0.1;
  
  return Math.min(churnScore, 1.0);
}

/**
 * Calculate engagement score
 */
function calculateEngagementScore(
  totalOrders: number, 
  orderTrends: CustomerAnalytics['orderTrends'],
  recentOrderCount: number
): number {
  let score = 0;
  
  // Order frequency
  score += Math.min(totalOrders * 0.1, 0.4);
  
  // Recent activity
  if (recentOrderCount > 0) score += 0.3;
  
  // Growth trend
  if (orderTrends.growthTrend === 'up') score += 0.2;
  else if (orderTrends.growthTrend === 'down') score -= 0.1;
  
  // Monthly spending level
  if (orderTrends.monthlySpend > 100) score += 0.1;
  
  return Math.max(0, Math.min(score, 1.0));
}

/**
 * Calculate next purchase probability
 */
function calculateNextPurchaseProbability(
  orderTrends: CustomerAnalytics['orderTrends'], 
  totalOrders: number
): number {
  if (orderTrends.monthlyOrderCount > 0) return 0.8;
  if (totalOrders > 3 && orderTrends.growthTrend !== 'down') return 0.6;
  if (totalOrders > 0) return 0.4;
  return 0.2;
}

/**
 * Calculate predicted lifetime value
 */
function calculatePredictedLTV(
  currentSpent: number, 
  segment: CustomerAnalytics['customerSegment'],
  orderTrends: CustomerAnalytics['orderTrends']
): number {
  const segmentMultipliers = {
    champion: 3.0,
    loyal: 2.5,
    potential: 2.0,
    new: 1.8,
    at_risk: 1.2,
    hibernating: 1.0
  };
  
  const baseMultiplier = segmentMultipliers[segment];
  const growthFactor = orderTrends.growthTrend === 'up' ? 1.2 : 
                      orderTrends.growthTrend === 'down' ? 0.8 : 1.0;
  
  return currentSpent * baseMultiplier * growthFactor;
}

/**
 * Generate next best action recommendation
 */
function generateNextBestAction(
  segment: CustomerAnalytics['customerSegment'], 
  churnRate: number
): string {
  if (churnRate > 0.7) return 'Send retention offer immediately';
  if (segment === 'champion') return 'Invite to VIP program';
  if (segment === 'loyal') return 'Send exclusive product recommendations';
  if (segment === 'potential') return 'Nurture with personalized content';
  if (segment === 'new') return 'Send welcome series and onboarding';
  if (segment === 'at_risk') return 'Re-engagement campaign with incentives';
  return 'Monitor and maintain regular touchpoints';
}