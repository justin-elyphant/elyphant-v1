
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

const VendorManagement = () => {
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
        
        <Tabs defaultValue="support">
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
