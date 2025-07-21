
import React, { useState } from "react";
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

interface OrderSummaryCardProps {
  order: ZincOrder;
}

const OrderSummaryCard = ({ order }: OrderSummaryCardProps) => {
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handleEmailReceipt = () => {
    setIsSendingEmail(true);
    
    // Simulate API call to send email
    setTimeout(() => {
      toast.success("Receipt sent to your email");
      setIsSendingEmail(false);
    }, 1000);
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
            <dd>#{order.id}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Status:</dt>
            <dd><OrderStatusBadge status={order.status} /></dd>
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
