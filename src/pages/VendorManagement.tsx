
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ChevronRight, Info, Plus, Settings } from "lucide-react";
import ShopifyIntegration from "@/components/marketplace/ShopifyIntegration";
import DirectAPIIntegration from "@/components/marketplace/DirectAPIIntegration";
import AdvertisingDashboard from "@/components/marketplace/AdvertisingDashboard";
import { ProductProvider } from "@/contexts/ProductContext";
import { getShopifyPartnerOptions } from "@/components/marketplace/shopify/shopifyUtils";

const VendorManagement = () => {
  const [showPartnerInfo, setShowPartnerInfo] = useState(false);
  const partnerOptions = getShopifyPartnerOptions();
  
  return (
    <ProductProvider>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Vendor Management</h1>
          <Sheet>
            <SheetTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add New Integration
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Add New Integration</SheetTitle>
                <SheetDescription>
                  Connect a new vendor or platform to your marketplace
                </SheetDescription>
              </SheetHeader>
              <div className="py-6 space-y-4">
                <Button variant="outline" className="w-full justify-between">
                  Shopify Store <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="w-full justify-between">
                  Direct API <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="w-full justify-between">
                  Manual Upload <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="w-full justify-between">
                  Other Integration <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        
        {!showPartnerInfo && (
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertTitle>Shopify Partner Testing</AlertTitle>
            <AlertDescription>
              No Shopify store? You can test integration by entering "development" as the store URL.{" "}
              <Button variant="link" className="p-0 h-auto" onClick={() => setShowPartnerInfo(true)}>
                Learn more
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        {showPartnerInfo && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Shopify Partner Testing Options</CardTitle>
              <CardDescription>
                Ways to test Shopify integration without your own store
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Development Store Option</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect to a simulated Shopify store by entering <strong>"development"</strong> in the store URL field.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium">For Shopify Partners</h3>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1 mt-2">
                    {partnerOptions.partnerInfo.options.map((option, index) => (
                      <li key={index}>{option}</li>
                    ))}
                  </ul>
                </div>
                
                <Button size="sm" variant="outline" onClick={() => setShowPartnerInfo(false)}>
                  Hide Info
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Tabs defaultValue="integrations">
          <TabsList className="mb-6">
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="advertising">Advertising</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="integrations">
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
          </TabsContent>
          
          <TabsContent value="advertising">
            <AdvertisingDashboard />
          </TabsContent>
          
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Product Management</CardTitle>
                <CardDescription>Manage all products from connected vendors</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Product management interface coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Vendor Analytics</CardTitle>
                <CardDescription>Performance metrics and insights</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Analytics dashboard coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProductProvider>
  );
};

export default VendorManagement;
