
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ProductProvider } from "@/contexts/ProductContext";
import { useNavigate } from "react-router-dom";
import AdvertisingDashboard from "@/components/marketplace/AdvertisingDashboard";
import VendorIntegrationsTab from "@/components/vendor/VendorIntegrationsTab";
import VendorProductsTab from "@/components/vendor/VendorProductsTab";
import VendorAnalyticsTab from "@/components/vendor/VendorAnalyticsTab";
import ShopifyPartnerAlert from "@/components/vendor/ShopifyPartnerAlert";
import ShopifyPartnerInfo from "@/components/vendor/ShopifyPartnerInfo";
import IntegrationAddSheet from "@/components/vendor/IntegrationAddSheet";

const VendorManagement = () => {
  const [showPartnerInfo, setShowPartnerInfo] = useState(false);
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
          <IntegrationAddSheet />
        </div>
        
        {!showPartnerInfo ? (
          <ShopifyPartnerAlert onShowInfo={() => setShowPartnerInfo(true)} />
        ) : (
          <ShopifyPartnerInfo onHide={() => setShowPartnerInfo(false)} />
        )}
        
        <Tabs defaultValue="integrations">
          <TabsList className="mb-6">
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="advertising">Advertising</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="integrations">
            <VendorIntegrationsTab />
          </TabsContent>
          
          <TabsContent value="advertising">
            <AdvertisingDashboard />
          </TabsContent>
          
          <TabsContent value="products">
            <VendorProductsTab />
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
