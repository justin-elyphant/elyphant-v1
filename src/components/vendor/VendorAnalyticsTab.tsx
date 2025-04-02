
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const VendorAnalyticsTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendor Analytics</CardTitle>
        <CardDescription>Performance metrics and insights</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Analytics dashboard coming soon.</p>
      </CardContent>
    </Card>
  );
};

export default VendorAnalyticsTab;
