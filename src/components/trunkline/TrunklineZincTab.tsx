
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ZincIntegration from "@/components/marketplace/zinc/ZincIntegration";
import PricingControlsCard from "./pricing/PricingControlsCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { hasValidZincToken } from "@/components/marketplace/zinc/zincCore";
import { AlertCircle } from "lucide-react";

const TrunklineZincTab = () => {
  const hasToken = hasValidZincToken();
  
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
          {!hasToken && (
            <Alert className="mb-6 bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-800" />
              <AlertTitle className="text-amber-800">API Token Required</AlertTitle>
              <AlertDescription className="text-amber-700">
                <p>Set up your Zinc API token below to enable real product search across the application.
                Without this token, all product searches will use mock data.</p>
                <p className="mt-2 font-medium">For testing: You can enter any string with at least 10 characters.</p>
              </AlertDescription>
            </Alert>
          )}
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
