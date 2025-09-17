import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import OrderStatusBadge from "../OrderStatusBadge";
import { useOrderActions } from "@/hooks/useOrderActions";
import { formatOrderNumberWithHash } from "@/utils/orderHelpers";
import OrderCancelDialog from "../OrderCancelDialog";

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  user_id: string;
  order_number?: string;
  stripe_payment_intent_id?: string;
  stripe_session_id?: string;
}

interface MobileOrderCardProps {
  order: Order;
  onOrderUpdated?: () => void;
}

const MobileOrderCard = ({ order, onOrderUpdated }: MobileOrderCardProps) => {
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

  return (
    <>
      <Card className="w-full touch-manipulation">
        <CardContent className="p-4 space-y-4">
          {/* Header Row: Date and Order ID */}
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {new Date(order.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
              <p className="text-xs text-muted-foreground">
                Order {formatOrderNumberWithHash(order.id)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-foreground">
                ${order.total_amount.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex justify-start">
            <OrderStatusBadge 
              status={order.status}
              orderId={order.id}
              stripePaymentIntentId={order.stripe_payment_intent_id}
              stripeSessionId={order.stripe_session_id}
              createdAt={order.created_at}
              onStatusUpdate={() => {
                // Refresh the orders list when status updates
                window.location.reload();
              }}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button 
              variant="default" 
              size="default"
              className="flex-1 h-11 touch-manipulation"
              asChild
            >
              <Link to={`/orders/${order.id}`}>
                View Details
              </Link>
            </Button>
            
            {canCancelOrder(order.status) && (
              <Button
                variant="outline"
                size="default"
                onClick={() => setCancellingOrderId(order.id)}
                disabled={isProcessing}
                className="h-11 px-4 touch-manipulation text-red-500 hover:text-red-700 border-red-200 hover:border-red-300"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <OrderCancelDialog
        isOpen={!!cancellingOrderId}
        onClose={() => setCancellingOrderId(null)}
        onConfirm={handleCancelOrder}
        isProcessing={isProcessing}
        orderNumber={cancellingOrderId ? 
          order.order_number?.split('-').pop() || 
          cancellingOrderId.slice(-6) : ''
        }
        orderStatus={cancellingOrderId ? order.status : 'unknown'}
        orderAmount={cancellingOrderId ? order.total_amount : 0}
      />
    </>
  );
};

export default MobileOrderCard;