import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Gift, Package } from "lucide-react";
import { Link } from "react-router-dom";

const QuickActionsGrid = () => {
  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-sm font-medium mb-4">Quick Actions</h3>
        <div className="grid grid-cols-3 gap-3">
          <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
            <Link to="/marketplace">
              <ShoppingBag className="h-5 w-5" />
              <span className="text-xs">Shop</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
            <Link to="/dashboard?tab=auto-gifts">
              <Gift className="h-5 w-5" />
              <span className="text-xs">Auto-Gift</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
            <Link to="/orders">
              <Package className="h-5 w-5" />
              <span className="text-xs">Orders</span>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActionsGrid;
