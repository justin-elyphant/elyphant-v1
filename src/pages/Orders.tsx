
import React, { useState, useEffect, useCallback } from "react";
import OrdersHeader from "@/components/orders/OrdersHeader";
import OrderTable from "@/components/orders/OrderTable";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  user_id: string;
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

  return (
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
  );
};

export default Orders;
