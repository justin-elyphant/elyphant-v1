
import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Calendar } from "lucide-react";
import { formatScheduledDate } from "@/utils/date-formatting";
import { toast } from "sonner";
import { ZincOrder } from "@/components/marketplace/zinc/types";
import OrderStatusBadge from "./OrderStatusBadge";
import { formatOrderNumberWithHash } from "@/utils/orderHelpers";
import { useOrderSourceAnalysis } from "@/hooks/useOrderSourceAnalysis";
import OrderSourceDisplay from "./OrderSourceDisplay";

interface OrderSummaryCardProps {
  order: ZincOrder;
}

const OrderSummaryCard = ({ order }: OrderSummaryCardProps) => {
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const { analysis: sourceAnalysis, loading: sourceLoading } = useOrderSourceAnalysis(order);

  const handleEmailReceipt = async () => {
    setIsSendingEmail(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ecommerce-email-orchestrator', {
        body: { 
          eventType: 'order_receipt',
          orderId: order.id
        }
      });

      if (error) {
        console.error('Error sending receipt:', error, data);
        toast.error(data?.error || error.message || "Failed to send receipt");
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
            <dd>{new Date((order as any).date || (order as any).created_at).toLocaleDateString()}</dd>
          </div>
          
          {/* Scheduled Delivery Date - show prominently if available */}
          {(order as any).scheduled_delivery_date && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Scheduled Delivery:
              </dt>
              <dd className="font-medium text-primary">
                {formatScheduledDate((order as any).scheduled_delivery_date)}
              </dd>
            </div>
          )}
          
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
          
          {/* Order Source */}
          <div className="py-2">
            <dt className="text-muted-foreground text-sm mb-2">Order Source:</dt>
            <dd className="pb-4 md:pb-0">
              {sourceLoading ? (
                <div className="animate-pulse">
                  <div className="h-6 bg-muted rounded w-32"></div>
                </div>
              ) : sourceAnalysis ? (
                <OrderSourceDisplay analysis={sourceAnalysis} />
              ) : (
                <span className="text-sm text-muted-foreground">Standard Order</span>
              )}
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
