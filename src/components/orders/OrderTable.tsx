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
import { X, AlertTriangle, StopCircle } from "lucide-react";
import OrderStatusBadge from "./OrderStatusBadge";
import { useOrderActions } from "@/hooks/useOrderActions";
import { useOrderEligibility } from "@/hooks/useOrderEligibility";
import OrderCancelDialog from "./OrderCancelDialog";
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
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [orderEligibility, setOrderEligibility] = useState<any>(null);
  const [childOrdersMap, setChildOrdersMap] = useState<Record<string, any[]>>({});
  const { abortOrder, cancelOrder, isProcessing } = useOrderActions();
  const { checkOrderEligibility, getOrderActionButton } = useOrderEligibility();

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

  // Check eligibility when selected order changes
  useEffect(() => {
    if (cancellingOrderId) {
      const order = orders.find(o => o.id === cancellingOrderId);
      if (order) {
        const loadEligibility = async () => {
          const eligibility = await checkOrderEligibility(order.id);
          setOrderEligibility(eligibility);
        };
        loadEligibility();
      }
    }
  }, [cancellingOrderId, orders, checkOrderEligibility]);

  const canShowActionButton = (order: Order) => {
    return ['pending', 'failed', 'processing'].includes(order.status.toLowerCase());
  };

  const handleOrderAction = async (reason: string) => {
    if (!cancellingOrderId) return;
    
    const order = orders.find(o => o.id === cancellingOrderId);
    if (!order) return;

    const actionButton = getOrderActionButton(order.status, null, 
      orderEligibility?.isProcessingStage);
    const isAbort = actionButton.type === 'abort';
    const actionFn = isAbort ? abortOrder : cancelOrder;
    
    const success = await actionFn(cancellingOrderId, reason);
    if (success) {
      setCancellingOrderId(null);
      setOrderEligibility(null);
      onOrderUpdated?.();
    }
  };
  
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
                  <div className="flex justify-end gap-2 items-center">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/orders/${order.id}`}>
                        View Details
                      </Link>
                    </Button>
                    {canShowActionButton(order) && (() => {
                      const actionButton = getOrderActionButton(order.status, order.status, 
                        order.status === 'processing');

                      return (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCancellingOrderId(order.id)}
                          disabled={isProcessing}
                          className="text-red-500 hover:text-red-700 border-red-200 hover:border-red-300"
                        >
                          {actionButton.type === 'abort' ? (
                            <>
                              <StopCircle className="h-3 w-3 mr-1" />
                              Abort
                            </>
                          ) : (
                            <>
                              <X className="h-3 w-3 mr-1" />
                              Cancel
                            </>
                          )}
                        </Button>
                      );
                    })()}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      
      <OrderCancelDialog
        isOpen={!!cancellingOrderId}
        onClose={() => {
          setCancellingOrderId(null);
          setOrderEligibility(null);
        }}
        onConfirm={handleOrderAction}
        isProcessing={isProcessing}
        orderNumber={cancellingOrderId ? 
          orders.find(o => o.id === cancellingOrderId)?.order_number?.split('-').pop() || 
          cancellingOrderId.slice(-6) : ''
        }
        orderStatus={cancellingOrderId ? 
          orders.find(o => o.id === cancellingOrderId)?.status || 'unknown' : 'unknown'
        }
        orderAmount={cancellingOrderId ? 
          orders.find(o => o.id === cancellingOrderId)?.total_amount || 0 : 0
        }
        isAbort={orderEligibility?.operationRecommendation === 'abort'}
        abortReason={orderEligibility?.abortReason}
      />
    </>
  );
};

export default OrderTable;
