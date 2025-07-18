
import React, { useState } from "react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  user_id: string;
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
    return ['pending', 'processing', 'failed'].includes(status.toLowerCase());
  };

  const handleCancelOrder = async (orderId: string) => {
    const success = await cancelOrder(orderId, 'User cancelled via main orders page');
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
                <div className="flex justify-end gap-3 items-center">
                  <a href={`/order/${order.id}`} className="text-blue-500 hover:underline text-sm">
                    View Details
                  </a>
                  {canCancelOrder(order.status) && (
                    <button
                      onClick={() => setCancellingOrderId(order.id)}
                      disabled={isProcessing}
                      className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1 disabled:opacity-50"
                    >
                      <X className="h-3 w-3" />
                      Cancel
                    </button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      <AlertDialog open={!!cancellingOrderId} onOpenChange={() => setCancellingOrderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Cancel Order
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel order #{cancellingOrderId?.slice(-6)}? This action cannot be undone.
              {cancellingOrderId && orders.find(o => o.id === cancellingOrderId)?.status === 'processing' && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                  <strong>Note:</strong> This order is currently being processed. Cancellation may take some time to complete.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              Keep Order
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => cancellingOrderId && handleCancelOrder(cancellingOrderId)}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? 'Cancelling...' : 'Cancel Order'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default OrderTable;
