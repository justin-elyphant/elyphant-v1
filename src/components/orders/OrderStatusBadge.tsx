
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Package, TruckIcon, RefreshCw } from "lucide-react";

type OrderStatus = string;

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

const OrderStatusBadge = ({ status }: OrderStatusBadgeProps) => {
  switch (status) {
    case "delivered":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
          <Package className="h-3 w-3 mr-1" />
          <span>Delivered</span>
        </Badge>
      );
    case "shipped":
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
          <TruckIcon className="h-3 w-3 mr-1" />
          <span>Shipped</span>
        </Badge>
      );
    case "processing":
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-800 hover:bg-yellow-100">
          <RefreshCw className="h-3 w-3 mr-1" />
          <span>Processing</span>
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
        </Badge>
      );
  }
};

export default OrderStatusBadge;
