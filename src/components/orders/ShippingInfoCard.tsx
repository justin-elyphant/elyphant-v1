
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
          <p className="font-medium">{order.customerName}</p>
          <p>123 Main Street</p>
          <p>Apt 4B</p>
          <p>San Francisco, CA 94103</p>
          <p>United States</p>
        </div>
        {order.status === "shipped" && (
          <div className="mt-4">
            <p className="font-medium">Tracking Number:</p>
            <p className="text-blue-600">1Z999AA10123456784</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ShippingInfoCard;
