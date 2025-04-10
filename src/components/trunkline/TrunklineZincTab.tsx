
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ZincIntegration from "@/components/marketplace/zinc/ZincIntegration";
import PricingControlsCard from "./pricing/PricingControlsCard";

const TrunklineZincTab = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Amazon Integration via Zinc</CardTitle>
          <CardDescription>
            Connect to Amazon's product catalog, process orders, handle returns, and manage Elephant Credits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ZincIntegration />
        </CardContent>
      </Card>
      
      <PricingControlsCard />
      
      <Card>
        <CardHeader>
          <CardTitle>Sync Status Logs</CardTitle>
          <CardDescription>
            View recent synchronization activities and any errors encountered
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-muted-foreground text-center py-8">
            Sync logs will appear here once Zinc integration is connected and products are synced.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrunklineZincTab;
