
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ChevronRight, ExternalLink, Info, Plus, Settings, ArrowLeft } from "lucide-react";
import ShopifyIntegration from "@/components/marketplace/ShopifyIntegration";
import DirectAPIIntegration from "@/components/marketplace/DirectAPIIntegration";
import AdvertisingDashboard from "@/components/marketplace/AdvertisingDashboard";
import { ProductProvider } from "@/contexts/ProductContext";
import { getShopifyPartnerOptions } from "@/components/marketplace/shopify/shopifyUtils";
import { useNavigate } from "react-router-dom";

const VendorManagement = () => {
  const [showPartnerInfo, setShowPartnerInfo] = useState(false);
  const partnerOptions = getShopifyPartnerOptions();
  const navigate = useNavigate();
  
  return (
    <ProductProvider>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-1" 
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <h1 className="text-4xl font-bold">Vendor Management</h1>
          </div>
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
            <AlertTitle>Shopify Development Store Options</AlertTitle>
            <AlertDescription>
              No Shopify store yet? Use "development" as the store URL to test, or create a real development store through your Shopify Partners account.{" "}
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
                Ways to test Shopify integration without a production store
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h3 className="font-medium">Option 1: Quick Simulated Store</h3>
                    <p className="text-sm text-muted-foreground">
                      Enter <strong>"development"</strong> in the store URL field to connect to our simulated store with test products.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Option 2: Real Development Store</h3>
                    <p className="text-sm text-muted-foreground">
                      Create a free development store in your Shopify Partners account for full API testing.
                    </p>
                    <a 
                      href="https://partners.shopify.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-primary hover:underline mt-1"
                    >
                      Go to Shopify Partners <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Development Store Benefits:</h3>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    <li>Free to create through Shopify Partners program</li>
                    <li>Full access to Shopify APIs and testing tools</li>
                    <li>Test payment gateways with test credit cards</li>
                    <li>Can be converted to a paid store later if needed</li>
                    <li>No time limit for development testing</li>
                  </ul>
                </div>
                
                <div className="flex justify-between items-center">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setShowPartnerInfo(false)}
                  >
                    Hide Info
                  </Button>
                  
                  <a 
                    href="https://help.shopify.com/en/partners/dashboard/development-stores" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-primary hover:underline"
                  >
                    Shopify Development Store Documentation <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </div>
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
