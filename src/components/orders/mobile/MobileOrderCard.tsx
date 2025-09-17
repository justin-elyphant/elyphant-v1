import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, StopCircle } from "lucide-react";
import OrderStatusBadge from "../OrderStatusBadge";
import { useOrderActions } from "@/hooks/useOrderActions";
import { useOrderEligibility } from "@/hooks/useOrderEligibility";
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
  zinc_status?: string;
}

interface MobileOrderCardProps {
  order: Order;
  onOrderUpdated?: () => void;
}

const MobileOrderCard = ({ order, onOrderUpdated }: MobileOrderCardProps) => {
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [orderEligibility, setOrderEligibility] = useState<any>(null);
  const { abortOrder, cancelOrder, isProcessing } = useOrderActions();
  const { checkOrderEligibility, getOrderActionButton } = useOrderEligibility();

  // Check order eligibility on mount and when order changes
  useEffect(() => {
    const loadEligibility = async () => {
      const eligibility = await checkOrderEligibility(order.id);
      setOrderEligibility(eligibility);
    };
    loadEligibility();
  }, [order.id, order.status, checkOrderEligibility]);

  const actionButton = orderEligibility ? 
    getOrderActionButton(order.status, order.zinc_status, orderEligibility.isProcessingStage) :
    { type: 'none', label: 'Loading...', disabled: true };

  const handleOrderAction = async (reason: string) => {
    if (!cancellingOrderId) return;
    
    const isAbort = actionButton.type === 'abort';
    const actionFn = isAbort ? abortOrder : cancelOrder;
    
    const success = await actionFn(cancellingOrderId, reason);
    if (success) {
      setCancellingOrderId(null);
      onOrderUpdated?.();
    }
  };

  const canShowActionButton = () => {
    return ['pending', 'failed', 'retry_pending', 'processing'].includes(order.status.toLowerCase()) &&
           !['shipped', 'delivered', 'cancelled'].includes(order.zinc_status?.toLowerCase() || '');
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
            
            {canShowActionButton() && (
              <Button
                variant="outline"
                size="default"
                onClick={() => setCancellingOrderId(order.id)}
                disabled={isProcessing}
                className="h-11 px-4 touch-manipulation text-red-500 hover:text-red-700 border-red-200 hover:border-red-300"
              >
                {actionButton.type === 'abort' ? (
                  <>
                    <StopCircle className="h-4 w-4 mr-2" />
                    Abort
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <OrderCancelDialog
        isOpen={!!cancellingOrderId}
        onClose={() => setCancellingOrderId(null)}
        onConfirm={handleOrderAction}
        isProcessing={isProcessing}
        orderNumber={cancellingOrderId ? 
          order.order_number?.split('-').pop() || 
          cancellingOrderId.slice(-6) : ''
        }
        orderStatus={cancellingOrderId ? order.status : 'unknown'}
        orderAmount={cancellingOrderId ? order.total_amount : 0}
        isAbort={actionButton.type === 'abort'}
        abortReason={orderEligibility?.abortReason}
      />
    </>
  );
};

export default MobileOrderCard;