
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface OrdersHeaderProps {
  refreshOrders: () => void;
  isRefreshing: boolean;
}

const OrdersHeader = ({ refreshOrders, isRefreshing }: OrdersHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Orders</h1>
          <p className="text-sm text-muted-foreground">View and manage your order history</p>
        </div>
        <Button 
          variant="outline" 
          onClick={refreshOrders}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
    </div>
  );
};

export default OrdersHeader;
