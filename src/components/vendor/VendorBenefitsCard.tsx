
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export const VendorBenefitsCard = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Benefits of Joining</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold mb-1">Expand Your Reach</h3>
          <p className="text-sm text-muted-foreground">Connect with new customers across our platform.</p>
        </div>
        
        <div>
          <h3 className="font-semibold mb-1">Focus on Your Products</h3>
          <p className="text-sm text-muted-foreground">We handle customer service, payments, and the shopping experience.</p>
        </div>
        
        <div>
          <h3 className="font-semibold mb-1">Easy Integration</h3>
          <p className="text-sm text-muted-foreground">Simple connection with Shopify or other platforms.</p>
        </div>
        
        <div>
          <h3 className="font-semibold mb-1">Analytics Dashboard</h3>
          <p className="text-sm text-muted-foreground">Get insights into your products' performance on our platform.</p>
        </div>
      </CardContent>
    </Card>
  );
};
