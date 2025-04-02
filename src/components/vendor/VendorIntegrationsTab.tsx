
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import ShopifyIntegration from "@/components/marketplace/ShopifyIntegration";
import DirectAPIIntegration from "@/components/marketplace/DirectAPIIntegration";

const VendorIntegrationsTab = () => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between">
              <div>
                <CardTitle>Shopify Integration</CardTitle>
                <CardDescription>Connect your Shopify store</CardDescription>
              </div>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ShopifyIntegration />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between">
              <div>
                <CardTitle>Direct API Connection</CardTitle>
                <CardDescription>For custom integrations</CardDescription>
              </div>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <DirectAPIIntegration />
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Amazon Integration via Zinc</CardTitle>
          <CardDescription>
            Connect to Amazon's product catalog using Zinc API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Use Zinc's API to access Amazon products and process orders. Note: Zinc charges $1 per transaction.
          </p>
          <Button variant="outline">Configure Zinc API</Button>
        </CardContent>
      </Card>
    </>
  );
};

export default VendorIntegrationsTab;
