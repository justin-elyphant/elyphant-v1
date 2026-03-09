
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ProductProvider } from "@/contexts/ProductContext";
import ShopifyIntegration from "@/components/marketplace/ShopifyIntegration";
import ShopifyHowToGuide from "@/components/vendor/ShopifyHowToGuide";
import DirectAPIIntegration from "@/components/marketplace/DirectAPIIntegration";

const VendorIntegrationsPage = () => {
  return (
    <ProductProvider>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Connect your store to import products into the Elyphant marketplace.
          </p>
        </div>

        {/* Shopify Integration */}
        <Card>
          <CardHeader>
            <CardTitle>Shopify Integration</CardTitle>
            <CardDescription>
              Import your Shopify product catalog to list on Elyphant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ShopifyHowToGuide />
            <ShopifyIntegration />
          </CardContent>
        </Card>

        {/* Direct API */}
        <Card>
          <CardHeader>
            <CardTitle>Direct API Connection</CardTitle>
            <CardDescription>For custom integrations</CardDescription>
          </CardHeader>
          <CardContent>
            <DirectAPIIntegration />
          </CardContent>
        </Card>
      </div>
    </ProductProvider>
  );
};

export default VendorIntegrationsPage;
