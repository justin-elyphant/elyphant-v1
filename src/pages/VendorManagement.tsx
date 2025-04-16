
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ProductProvider } from "@/contexts/ProductContext";
import { useNavigate } from "react-router-dom";
import AdvertisingDashboard from "@/components/marketplace/AdvertisingDashboard";
import VendorIntegrationsTab from "@/components/vendor/VendorIntegrationsTab";
import VendorProductsTab from "@/components/vendor/VendorProductsTab";
import VendorAnalyticsTab from "@/components/vendor/VendorAnalyticsTab";
import VendorSupportTab from "@/components/vendor/VendorSupportTab";
import IntegrationAddSheet from "@/components/vendor/IntegrationAddSheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, TrendingUp } from "lucide-react";

const VendorManagement = () => {
  const navigate = useNavigate();
  
  // Mock credit data - in a real app this would come from an API
  const creditInfo = {
    availableCredits: 25,
    usedListings: 8,
    freeListingsRemaining: 2,
    sponsoredAds: 1
  };
  
  return (
    <ProductProvider>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-1" 
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Site
            </Button>
            <h1 className="text-4xl font-bold">Vendor Portal</h1>
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              Test Mode (Authentication Bypassed)
            </span>
          </div>
          <IntegrationAddSheet />
        </div>
        
        {/* Credit summary card */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Coins className="h-5 w-5 mr-2 text-primary" />
              Vendor Account Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Available Credits</p>
                <p className="text-2xl font-bold">{creditInfo.availableCredits}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Used Listings</p>
                <p className="text-2xl font-bold">{creditInfo.usedListings}/10 <span className="text-sm font-normal text-muted-foreground">free</span></p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sponsored Ads</p>
                <p className="text-2xl font-bold">{creditInfo.sponsoredAds}</p>
              </div>
              <div className="flex items-end">
                <Button variant="outline" size="sm" className="mr-2">
                  Buy Credits
                </Button>
                <Button size="sm" variant="default" className="bg-primary">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Boost Products
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="products">
          <TabsList className="mb-6">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="support">Support & Returns</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="advertising">Advertising</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="products">
            <VendorProductsTab />
          </TabsContent>
          
          <TabsContent value="support">
            <VendorSupportTab />
          </TabsContent>
          
          <TabsContent value="integrations">
            <VendorIntegrationsTab />
          </TabsContent>
          
          <TabsContent value="advertising">
            <AdvertisingDashboard />
          </TabsContent>
          
          <TabsContent value="analytics">
            <VendorAnalyticsTab />
          </TabsContent>
        </Tabs>
      </div>
    </ProductProvider>
  );
};

export default VendorManagement;
