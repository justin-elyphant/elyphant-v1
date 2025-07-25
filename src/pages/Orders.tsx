
import React, { useState, useEffect, useCallback } from "react";
import OrdersHeader from "@/components/orders/OrdersHeader";
import OrderTable from "@/components/orders/OrderTable";
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
    setIsRefreshing(true);
    setError(null);
    
    try {
      // First, refresh the order list from database
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching orders:", error);
        setError("Failed to load orders.");
        toast.error("Failed to load orders.");
        return;
      } 
      
      setOrders(data || []);
      
      // Check if we have processing orders that need status updates
      const processingOrders = (data || [])
        .filter(order => order.zinc_order_id && order.status === 'processing')
        .map(order => order.zinc_order_id!)
        .filter(Boolean);

      // If we have processing orders, also refresh their status from Zinc
      if (processingOrders.length > 0) {
        try {
          const { data: statusData, error: statusError } = await supabase.functions.invoke('check-zinc-order-status', {
            body: { orderIds: processingOrders }
          });

          if (statusError) {
            console.error('Error checking Zinc status:', statusError);
            toast.warning('Orders refreshed, but could not check latest status from Zinc');
          } else {
            const results = statusData.results || [];
            const successCount = results.filter((r: any) => r.updated).length;
            const stuckCount = results.filter((r: any) => r.status === 'placed' && !r.updated).length;
            
            if (successCount > 0) {
              toast.success(`Orders refreshed! Updated ${successCount} order status(es) from Zinc`);
            } else if (stuckCount > 0) {
              toast.info(`Orders refreshed. ${stuckCount} order(s) still pending in Zinc (may need account verification)`);
            } else {
              toast.success('Orders refreshed!');
            }
            
            // Refresh again to get the updated statuses
            await fetchOrders();
          }
        } catch (statusErr) {
          console.error('Error refreshing Zinc status:', statusErr);
          toast.success('Orders refreshed! (Could not check Zinc status)');
        }
      } else {
        toast.success('Orders refreshed!');
      }
      
    } catch (err) {
      console.error("Unexpected error refreshing orders:", err);
      setError("An unexpected error occurred.");
      toast.error("An unexpected error occurred.");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <SidebarLayout>
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <OrdersHeader 
          refreshOrders={refreshOrders} 
          isRefreshing={isRefreshing}
        />
        
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
