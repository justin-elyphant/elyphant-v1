
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import DirectAPIIntegration from "@/components/marketplace/DirectAPIIntegration";

const VendorIntegrationsTab = () => {
  return (
    <>
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
      
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Product Management</CardTitle>
            <CardDescription>
              Add, edit, and manage your products for the Elyphant marketplace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              You can manage your products through our new enhanced product management interface.
              This includes tools for adding products manually, importing via CSV, setting markups,
              and configuring fulfillment methods.
            </p>
            <Button className="mt-4">Manage Products</Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default VendorIntegrationsTab;
