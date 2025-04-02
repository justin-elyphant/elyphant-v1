
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const VendorProductsTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Management</CardTitle>
        <CardDescription>Manage all products from connected vendors</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Product management interface coming soon.</p>
      </CardContent>
    </Card>
  );
};

export default VendorProductsTab;
