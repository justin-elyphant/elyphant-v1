
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import StandardBackButton from "@/components/shared/StandardBackButton";

interface OrdersHeaderProps {
  refreshOrders: () => void;
  isRefreshing: boolean;
}

const OrdersHeader = ({ refreshOrders, isRefreshing }: OrdersHeaderProps) => {
  return (
    <div>
      <StandardBackButton to="/dashboard" text="Back to Dashboard" />
      
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
    </div>
  );
};

export default OrdersHeader;
