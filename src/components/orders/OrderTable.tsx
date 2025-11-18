import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import OrderStatusBadge from "./OrderStatusBadge";
import { formatOrderNumberWithHash } from "@/utils/orderHelpers";
import SplitOrderDisplay from "./SplitOrderDisplay";
import { supabase } from "@/integrations/supabase/client";

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  user_id: string;
  order_number?: string;
  payment_intent_id?: string;
  checkout_session_id?: string;
  is_split_order?: boolean;
  total_split_orders?: number;
}

interface OrderTableProps {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  onOrderUpdated?: () => void;
}

const OrderTable = ({ orders, isLoading, error, onOrderUpdated }: OrderTableProps) => {
  const [childOrdersMap, setChildOrdersMap] = useState<Record<string, any[]>>({});

  // Fetch child orders for split orders
  useEffect(() => {
    const fetchChildOrders = async () => {
      const splitOrders = orders.filter(o => o.is_split_order);
      if (splitOrders.length === 0) return;

      const childMap: Record<string, any[]> = {};
      
      for (const order of splitOrders) {
        const { data } = await supabase
          .from('orders')
          .select('id, order_number, status, payment_status, total_amount, created_at, line_items, shipping_address')
          .eq('id', order.id)
          .order('created_at');
        
        if (data) childMap[order.id] = data;
      }
      
      setChildOrdersMap(childMap);
    };

    fetchChildOrders();
  }, [orders]);

  
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-2">{error}</p>
        <p className="text-muted-foreground">Please try again later.</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="p-8 text-center border rounded-lg">
        <p className="text-lg font-medium mb-2">No orders found</p>
        <p className="text-muted-foreground">You haven't placed any orders yet.</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]">Date</TableHead>
            <TableHead>Order ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Total</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const isSplitOrder = order.is_split_order;
            const childOrders = childOrdersMap[order.id] || [];

            if (isSplitOrder && childOrders.length > 0) {
              // Render split order with SplitOrderDisplay
              return (
                <TableRow key={order.id} className="border-0">
                  <TableCell colSpan={5} className="p-4">
                    <SplitOrderDisplay
                      parentOrder={order}
                      childOrders={childOrders}
                    />
                  </TableCell>
                </TableRow>
              );
            }

            // Regular single order
            return (
              <TableRow key={order.id}>
                <TableCell className="font-medium">
                  {new Date(order.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>{formatOrderNumberWithHash(order.id)}</TableCell>
                <TableCell>
                  <OrderStatusBadge 
                    status={order.status}
                    orderId={order.id}
                stripePaymentIntentId={order.payment_intent_id}
                stripeSessionId={order.checkout_session_id}
                    createdAt={order.created_at}
                    onStatusUpdate={() => {
                      // Refresh the orders list when status updates
                      window.location.reload();
                    }}
                  />
                </TableCell>
                <TableCell>${order.total_amount.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/orders/${order.id}`}>
                      View Details
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
};

export default OrderTable;
