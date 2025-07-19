
import React, { useState, useEffect, useCallback } from "react";
import OrdersHeader from "@/components/orders/OrdersHeader";
import OrderTable from "@/components/orders/OrderTable";
import OrderStatusRefresh from "@/components/orders/OrderStatusRefresh";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SidebarLayout } from "@/components/layout/SidebarLayout";

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  user_id: string;
  zinc_order_id?: string;
  zinc_status?: string;
}

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching orders:", error);
        setError("Failed to load orders.");
        toast.error("Failed to load orders.");
      } else {
        setOrders(data || []);
      }
    } catch (err) {
      console.error("Unexpected error fetching orders:", err);
      setError("An unexpected error occurred.");
      toast.error("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const refreshOrders = async () => {
    await fetchOrders();
  };

  // Get Zinc order IDs for status refresh
  const zincOrderIds = orders
    .filter(order => order.zinc_order_id && order.status === 'processing')
    .map(order => order.zinc_order_id!)
    .filter(Boolean);

  return (
    <SidebarLayout>
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <OrdersHeader 
            refreshOrders={refreshOrders} 
            isRefreshing={isRefreshing}
          />
          
          {zincOrderIds.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {zincOrderIds.length} processing order(s)
              </span>
              <OrderStatusRefresh
                orderIds={zincOrderIds}
                onRefreshComplete={refreshOrders}
              />
            </div>
          )}
        </div>
        
        <OrderTable 
          orders={orders} 
          isLoading={isLoading} 
          error={error}
          onOrderUpdated={refreshOrders}
        />
      </div>
    </SidebarLayout>
  );
};

export default Orders;
