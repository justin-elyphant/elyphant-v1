
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Coins, TrendingUp } from "lucide-react";
import { ProductProvider } from "@/contexts/ProductContext";
import { useNavigate } from "react-router-dom";
import AdvertisingDashboard from "@/components/marketplace/AdvertisingDashboard";
import VendorIntegrationsTab from "@/components/vendor/VendorIntegrationsTab";
import VendorProductsTab from "@/components/vendor/VendorProductsTab";
import VendorAnalyticsTab from "@/components/vendor/VendorAnalyticsTab";
import VendorSupportTab from "@/components/vendor/VendorSupportTab";
import IntegrationAddSheet from "@/components/vendor/IntegrationAddSheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VendorGuard } from "@/components/vendor/auth/VendorGuard";

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
    <VendorGuard>
      <ProductProvider>
        <div className="container mx-auto py-8 max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-1 text-slate-600 hover:text-slate-800" 
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Site
            </Button>
            <h1 className="text-2xl font-medium text-slate-800">Vendor Portal</h1>
            <span className="bg-slate-100 text-slate-700 text-xs font-normal px-2.5 py-1 rounded-full border border-slate-200">
              Test Mode
            </span>
          </div>
          <IntegrationAddSheet />
        </div>
        
        {/* Credit summary card */}
        <Card className="mb-6 shadow-subtle border-border/80">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-base font-medium flex items-center text-slate-700">
              <Coins className="h-4 w-4 mr-2 text-blue-600" />
              Vendor Account Status
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Available Credits</p>
                <p className="text-2xl font-medium text-slate-800 mt-1">{creditInfo.availableCredits}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Used Listings</p>
                <p className="text-2xl font-medium text-slate-800 mt-1">{creditInfo.usedListings}/10 <span className="text-xs font-normal text-slate-500">free</span></p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Sponsored Ads</p>
                <p className="text-2xl font-medium text-slate-800 mt-1">{creditInfo.sponsoredAds}</p>
              </div>
              <div className="flex items-end justify-end">
                <Button variant="outline" size="sm" className="mr-2 text-slate-700 border-slate-300 hover:bg-slate-50">
                  Buy Credits
                </Button>
                <Button size="sm" className="text-white bg-blue-600 hover:bg-blue-700">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Boost Products
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="products" className="space-y-4">
          <TabsList className="bg-slate-100 p-0.5 border border-slate-200">
            <TabsTrigger value="products" className="text-sm">Products</TabsTrigger>
            <TabsTrigger value="support" className="text-sm">Support & Returns</TabsTrigger>
            <TabsTrigger value="integrations" className="text-sm">Integrations</TabsTrigger>
            <TabsTrigger value="advertising" className="text-sm">Advertising</TabsTrigger>
            <TabsTrigger value="analytics" className="text-sm">Analytics</TabsTrigger>
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
    </VendorGuard>
  );
};

export default VendorManagement;
