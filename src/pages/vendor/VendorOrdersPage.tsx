import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";

const VendorOrdersPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Orders
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage orders for your products.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">All Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ShoppingCart className="h-10 w-10 text-muted-foreground/40 mb-3" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">No orders yet.</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Orders will appear here when customers purchase your products.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorOrdersPage;
