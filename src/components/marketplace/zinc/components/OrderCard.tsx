
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, TruckIcon, ShoppingBag } from "lucide-react";

interface OrderCardProps {
  order: {
    id: string;
    status: string;
    customerName: string;
    date: string;
    items: { name: string; quantity: number; price: number }[];
    total: number;
  };
  onProcessOrder: (orderId: string) => void;
  hasAmazonCredentials: boolean;
}

const OrderCard = ({ order, onProcessOrder, hasAmazonCredentials }: OrderCardProps) => {
  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "delivered":
        return "default";
      case "shipped":
        return "secondary";
      case "processing":
        return "outline";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <Package className="h-3 w-3 mr-1" />;
      case "shipped":
        return <TruckIcon className="h-3 w-3 mr-1" />;
      case "processing":
        return <ShoppingBag className="h-3 w-3 mr-1" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base">Order #{order.id.slice(-6)}</CardTitle>
          <Badge variant={getBadgeVariant(order.status)} className="flex items-center">
            {getStatusIcon(order.status)}
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Customer:</span>
            <span>{order.customerName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Date:</span>
            <span>{new Date(order.date).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Items:</span>
            <span>{order.items.reduce((acc, item) => acc + item.quantity, 0)}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Total:</span>
            <span>${order.total.toFixed(2)}</span>
          </div>
          
          <div className="pt-2 flex justify-end space-x-2">
            <Button variant="outline" size="sm">Details</Button>
            {order.status === "processing" && (
              <Button 
                size="sm" 
                onClick={() => onProcessOrder(order.id)}
                disabled={!hasAmazonCredentials}
              >
                {hasAmazonCredentials ? "Process Now" : "Add Amazon Credentials"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderCard;
