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
        // This would need to be enhanced with actual category data
        const category = 'General'; // Placeholder
        categoryMap[category] = (categoryMap[category] || 0) + 1;
      });
      
      const preferredCategories = Object.entries(categoryMap)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([category]) => category);

      return {
        totalOrders,
        totalSpent,
        averageOrderValue,
        lastOrderDate,
        lifetimeValue,
        preferredCategories,
        riskLevel
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
        riskLevel: 'low'
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