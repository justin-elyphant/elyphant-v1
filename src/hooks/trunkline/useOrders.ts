import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Order = Database['public']['Tables']['orders']['Row'] & {
  profiles?: {
    name: string | null;
    email: string | null;
  } | null;
};

export interface OrderFilters {
  search?: string;
  status?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  minAmount?: number;
  maxAmount?: number;
}

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<OrderFilters>({});

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.search) {
        query = query.or(`order_number.ilike.%${filters.search}%,user_id.ilike.%${filters.search}%,zinc_order_id.ilike.%${filters.search}%`);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.from.toISOString())
          .lte('created_at', filters.dateRange.to.toISOString());
      }

      if (filters.minAmount) {
        query = query.gte('total_amount', filters.minAmount);
      }

      if (filters.maxAmount) {
        query = query.lte('total_amount', filters.maxAmount);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      setOrders((data || []) as any);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  // Real-time subscription for order updates
  useEffect(() => {
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;
      
      await fetchOrders(); // Refresh orders
    } catch (err) {
      console.error('Error updating order status:', err);
      throw err;
    }
  };

  return {
    orders,
    loading,
    error,
    filters,
    setFilters,
    updateOrderStatus,
    refetch: fetchOrders
  };
};