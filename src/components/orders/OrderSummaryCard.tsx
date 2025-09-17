
import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { ZincOrder } from "@/components/marketplace/zinc/types";
import OrderStatusBadge from "./OrderStatusBadge";
import { formatOrderNumberWithHash } from "@/utils/orderHelpers";

interface OrderSummaryCardProps {
  order: ZincOrder;
}

const OrderSummaryCard = ({ order }: OrderSummaryCardProps) => {
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handleEmailReceipt = async () => {
    setIsSendingEmail(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-order-receipt', {
        body: { orderId: order.id }
      });

      if (error) {
        console.error('Error sending receipt:', error);
        toast.error("Failed to send receipt");
      } else {
        toast.success("Receipt sent to your email");
      }
    } catch (error) {
      console.error('Error sending receipt:', error);
      toast.error("Failed to send receipt");
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Extract customer name from shipping info or fallback
  const customerName = (order as any).shipping_info?.name || order.customerName || "Customer";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-4">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Order Date:</dt>
            <dd>{new Date(order.date!).toLocaleDateString()}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Order Number:</dt>
            <dd>{formatOrderNumberWithHash(order.id)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Status:</dt>
            <dd>
              <OrderStatusBadge 
                status={order.status}
                orderId={order.id}
                stripePaymentIntentId={order.stripe_payment_intent_id}
                stripeSessionId={order.stripe_session_id}
                createdAt={order.date}
                onStatusUpdate={() => {
                  // Refresh the order data when status updates
                  window.location.reload();
                }}
              />
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Customer:</dt>
            <dd>{customerName}</dd>
          </div>
          <div className="flex justify-between font-semibold">
            <dt>Total:</dt>
            <dd>${order.total?.toFixed(2)}</dd>
          </div>
          <div className="pt-4 border-t">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleEmailReceipt}
              disabled={isSendingEmail}
            >
              <Mail className="h-4 w-4 mr-2" />
              {isSendingEmail ? "Sending..." : "Email Receipt"}
            </Button>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
};

export default OrderSummaryCard;
