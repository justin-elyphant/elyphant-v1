
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const VendorPortalCard = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendor Portal</CardTitle>
        <CardDescription>
          Partner with Elyphant Marketplace
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Retailers: List your products on our marketplace and reach more shoppers. We handle all shopper interactions and payments, making it seamless for you.
          </p>
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">First 10 Listings Free:</span> Get started at no cost. Additional listings available through our credit system.
          </div>
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Advertising Options:</span> Boost visibility with sponsored product placements managed through the Vendor Portal.
          </div>
          <a href="/vendor-signup" className="text-primary hover:underline text-sm font-medium flex items-center">
            Learn more about becoming a vendor
          </a>
        </div>
      </CardContent>
    </Card>
  );
};

export default VendorPortalCard;
