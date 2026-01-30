
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Calendar, DollarSign, X, AlertTriangle } from "lucide-react";
import { useOrderActions } from "@/hooks/useOrderActions";
import { formatPrice } from "@/lib/utils";
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
  status: string;
  customerName: string;
  date: string;
  items: { name: string; quantity: number; price: number; }[];
  total: number;
}

interface OrderCardProps {
  order: Order;
  onProcessOrder: (orderId: string) => void;
  onOrderUpdated?: () => void;
}

const OrderCard = ({ order, onProcessOrder, onOrderUpdated }: OrderCardProps) => {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const { cancelOrder, isProcessing } = useOrderActions();
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canCancelOrder = (status: string) => {
    return ['pending', 'failed', 'retry_pending'].includes(status.toLowerCase());
  };

  const handleCancelOrder = async () => {
    const success = await cancelOrder(order.id, 'User cancelled via order management');
    if (success) {
      setShowCancelDialog(false);
      onOrderUpdated?.();
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order #{order.id.slice(-8)}
          </CardTitle>
          <Badge className={getStatusColor(order.status)}>
            {order.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{new Date(order.date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span>{formatPrice(order.total)}</span>
          </div>
          <div className="text-muted-foreground">
            Customer: {order.customerName}
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Items:</h4>
          <div className="space-y-1">
            {order.items.map((item, index) => (
              <div key={index} className="text-sm text-muted-foreground flex justify-between">
                <span>{item.name} x{item.quantity}</span>
                <span>{formatPrice(item.price)}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-end gap-2 pt-2">
          {order.status === 'pending' && (
            <Button 
              onClick={() => onProcessOrder(order.id)}
              size="sm"
            >
              Process Order
            </Button>
          )}
          {canCancelOrder(order.status) && (
            <Button 
              onClick={() => setShowCancelDialog(true)}
              size="sm"
              variant="destructive"
              disabled={isProcessing}
            >
              <X className="h-3 w-3 mr-1" />
              Cancel Order
            </Button>
          )}
        </div>
        
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Cancel Order
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel order #{order.id.slice(-8)}? This action cannot be undone.
                {order.status === 'processing' && (
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
                onClick={handleCancelOrder}
                disabled={isProcessing}
                className="bg-red-600 hover:bg-red-700"
              >
                {isProcessing ? 'Cancelling...' : 'Cancel Order'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default OrderCard;
