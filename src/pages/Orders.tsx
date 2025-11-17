
import React, { useState, useEffect, useCallback } from "react";
import OrdersHeader from "@/components/orders/OrdersHeader";
import OrderTable from "@/components/orders/OrderTable";
import MobileOrdersList from "@/components/orders/mobile/MobileOrdersList";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { useIsMobile } from "@/hooks/use-mobile";

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  user_id: string;
  zinc_order_id?: string;
  zinc_status?: string;
  order_number?: string;
  is_split_order?: boolean;
  parent_order_id?: string;
  split_order_index?: number;
  total_split_orders?: number;
  delivery_group_id?: string;
  cart_data?: any;
}

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const fetchOrders = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError("Please log in to view orders.");
        toast.error("Please log in to view orders.");
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
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
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError("Please log in to view orders.");
        toast.error("Please log in to view orders.");
        setIsRefreshing(false);
        return;
      }

      // First, refresh the order list from database
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
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
      <div className="container max-w-6xl mx-auto px-4 pt-8 pb-8"
        style={{ 
          paddingTop: 'max(2rem, calc(env(safe-area-inset-top, 0px) + 2rem))' 
        }}
      >
        <OrdersHeader 
          refreshOrders={refreshOrders} 
          isRefreshing={isRefreshing}
        />
        
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <OrderTable 
            orders={orders} 
            isLoading={isLoading} 
            error={error}
            onOrderUpdated={refreshOrders}
          />
        </div>

        {/* Mobile Card View */}
        <div className="block md:hidden">
          <MobileOrdersList 
            orders={orders} 
            isLoading={isLoading} 
            error={error}
            onOrderUpdated={refreshOrders}
          />
        </div>
      </div>
    </SidebarLayout>
  );
};

export default Orders;
