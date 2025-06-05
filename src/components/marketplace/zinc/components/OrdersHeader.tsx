
import React from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, TestTube } from "lucide-react";

interface OrdersHeaderProps {
  onOpenTestPurchase: () => void;
}

const OrdersHeader = ({ onOpenTestPurchase }: OrdersHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2">
        <ShoppingCart className="h-5 w-5" />
        <h2 className="text-xl font-semibold">Orders</h2>
      </div>
      
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={onOpenTestPurchase}
          className="flex items-center gap-2"
        >
          <TestTube className="h-4 w-4" />
          Test Purchase
        </Button>
      </div>
    </div>
  );
};

export default OrdersHeader;
