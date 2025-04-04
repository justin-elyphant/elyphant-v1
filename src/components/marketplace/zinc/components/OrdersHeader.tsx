
import React from "react";
import { Button } from "@/components/ui/button";
import { Settings, Play } from "lucide-react";

interface OrdersHeaderProps {
  hasAmazonCredentials: boolean;
  onManageCredentials: () => void;
  onOpenTestPurchase: () => void;
}

const OrdersHeader = ({ 
  hasAmazonCredentials, 
  onManageCredentials, 
  onOpenTestPurchase 
}: OrdersHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <h3 className="font-medium">Recent Orders</h3>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onManageCredentials}
        >
          <Settings className="h-3 w-3 mr-1" />
          {hasAmazonCredentials ? "Update Amazon Credentials" : "Add Amazon Credentials"}
        </Button>
        {hasAmazonCredentials && (
          <Button 
            variant="default" 
            size="sm"
            onClick={onOpenTestPurchase}
          >
            <Play className="h-3 w-3 mr-1" />
            Test Purchase
          </Button>
        )}
        <Button variant="outline" size="sm">View All Orders</Button>
      </div>
    </div>
  );
};

export default OrdersHeader;
