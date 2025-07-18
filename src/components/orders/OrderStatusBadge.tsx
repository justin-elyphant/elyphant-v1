
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Package, TruckIcon, Clock, CheckCircle } from "lucide-react";

interface OrderStatusBadgeProps {
  status: string;
}

const OrderStatusBadge = ({ status }: OrderStatusBadgeProps) => {
  const getVariant = () => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "default";
      case "shipped":
        return "secondary";
      case "processing":
        return "outline";
      case "cancelled":
      case "failed":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getIcon = () => {
    switch (status.toLowerCase()) {
      case "delivered":
        return <CheckCircle className="h-3 w-3 mr-1" />;
      case "shipped":
        return <TruckIcon className="h-3 w-3 mr-1" />;
      case "processing":
        return <Clock className="h-3 w-3 mr-1" />;
      case "cancelled":
      case "failed":
        return <Clock className="h-3 w-3 mr-1" />;
      default:
        return <Package className="h-3 w-3 mr-1" />;
    }
  };

  return (
    <Badge variant={getVariant()} className="flex items-center">
      {getIcon()}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

export default OrderStatusBadge;
