import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import OrderStatusBadge from "../OrderStatusBadge";
import { formatOrderNumberWithHash } from "@/utils/orderHelpers";

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
  return (
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
            size="sm"
            className="flex-1"
            asChild
          >
            <Link to={`/orders/${order.id}`}>
              View Details
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileOrderCard;
