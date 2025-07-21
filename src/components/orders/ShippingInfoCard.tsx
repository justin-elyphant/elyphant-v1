
import React from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { ZincOrder } from "@/components/marketplace/zinc/types";

interface ShippingInfoCardProps {
  order: ZincOrder;
}

const ShippingInfoCard = ({ order }: ShippingInfoCardProps) => {
  // Extract shipping info from order data
  const shippingInfo = order.shipping_info || {};
  const customerName = shippingInfo.name || order.customerName || "Customer";
  const address = shippingInfo.address || {};
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipping Information</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">
          {order.status === "delivered" ? "Delivered to:" : "Shipping to:"}
        </p>
        <div className="mb-4">
          <p className="font-medium">{customerName}</p>
          {address.address_line1 && <p>{address.address_line1}</p>}
          {address.address_line2 && <p>{address.address_line2}</p>}
          {address.city && address.state && address.zip_code && (
            <p>{address.city}, {address.state} {address.zip_code}</p>
          )}
          {address.country && <p>{address.country}</p>}
        </div>
        {order.status === "shipped" && order.tracking_number && (
          <div className="mt-4">
            <p className="font-medium">Tracking Number:</p>
            <p className="text-blue-600">{order.tracking_number}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ShippingInfoCard;
