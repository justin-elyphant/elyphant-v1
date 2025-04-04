
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface OrdersHeaderProps {
  refreshOrders: () => void;
  isRefreshing: boolean;
}

const OrdersHeader = ({ refreshOrders, isRefreshing }: OrdersHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-2xl font-bold">My Orders</h1>
        <p className="text-muted-foreground">View and manage your order history</p>
      </div>
      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={refreshOrders}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <Button 
          variant="outline"
          onClick={() => navigate("/dashboard")}
        >
          <Home className="h-4 w-4 mr-2" />
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default OrdersHeader;
