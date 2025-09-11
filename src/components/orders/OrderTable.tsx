
import React, { useState } from "react";
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
import { X, AlertTriangle } from "lucide-react";
import OrderStatusBadge from "./OrderStatusBadge";
import { useOrderActions } from "@/hooks/useOrderActions";
import OrderCancelDialog from "./OrderCancelDialog";

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  user_id: string;
  order_number?: string;
}

interface OrderTableProps {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  onOrderUpdated?: () => void;
}

const OrderTable = ({ orders, isLoading, error, onOrderUpdated }: OrderTableProps) => {
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const { cancelOrder, isProcessing } = useOrderActions();

  const canCancelOrder = (status: string) => {
    return ['pending', 'processing', 'failed', 'retry_pending'].includes(status.toLowerCase());
  };

  const handleCancelOrder = async (reason: string) => {
    if (!cancellingOrderId) return;
    
    const success = await cancelOrder(cancellingOrderId, reason);
    if (success) {
      setCancellingOrderId(null);
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
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">
                {new Date(order.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>#{order.id.slice(-6)}</TableCell>
              <TableCell><OrderStatusBadge status={order.status} /></TableCell>
              <TableCell>${order.total_amount.toFixed(2)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2 items-center">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/orders/${order.id}`}>
                      View Details
                    </Link>
                  </Button>
                  {canCancelOrder(order.status) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCancellingOrderId(order.id)}
                      disabled={isProcessing}
                      className="text-red-500 hover:text-red-700 border-red-200 hover:border-red-300"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      <OrderCancelDialog
        isOpen={!!cancellingOrderId}
        onClose={() => setCancellingOrderId(null)}
        onConfirm={handleCancelOrder}
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
      />
    </>
  );
};

export default OrderTable;
