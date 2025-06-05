
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ProductProvider } from "@/contexts/ProductContext";
import { useNavigate } from "react-router-dom";
import TrunklineZincTab from "@/components/trunkline/TrunklineZincTab";
import TrunklineAmazonTab from "@/components/trunkline/TrunklineAmazonTab";
import TrunklineOrdersTab from "@/components/trunkline/TrunklineOrdersTab";
import TrunklineShoppersTab from "@/components/trunkline/TrunklineCustomersTab"; // Will keep original file name to avoid breaking changes
import TrunklineVendorsTab from "@/components/trunkline/TrunklineVendorsTab";
import TrunklineSupportTab from "@/components/trunkline/TrunklineSupportTab";

const Trunkline = () => {
  const navigate = useNavigate();
  
  return (
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
            <h1 className="text-2xl font-medium text-slate-800">Trunkline</h1>
            <span className="bg-amber-50 text-amber-700 text-xs font-normal px-2.5 py-1 rounded-full border border-amber-200">
              Internal Only
            </span>
            <span className="bg-slate-100 text-slate-700 text-xs font-normal px-2.5 py-1 rounded-full border border-slate-200">
              Test Mode
            </span>
          </div>
        </div>
        
        <Tabs defaultValue="support" className="space-y-4">
          <TabsList className="bg-slate-100 p-0.5 border border-slate-200">
            <TabsTrigger value="support" className="text-sm">Support Requests</TabsTrigger>
            <TabsTrigger value="orders" className="text-sm">Orders</TabsTrigger>
            <TabsTrigger value="shoppers" className="text-sm">Shoppers</TabsTrigger>
            <TabsTrigger value="vendors" className="text-sm">Vendors</TabsTrigger>
            <TabsTrigger value="amazon" className="text-sm">Amazon Credentials</TabsTrigger>
            <TabsTrigger value="zinc" className="text-sm">Zinc Integration</TabsTrigger>
          </TabsList>
          
          <TabsContent value="support">
            <TrunklineSupportTab />
          </TabsContent>
          
          <TabsContent value="orders">
            <TrunklineOrdersTab />
          </TabsContent>
          
          <TabsContent value="shoppers">
            <TrunklineShoppersTab />
          </TabsContent>
          
          <TabsContent value="vendors">
            <TrunklineVendorsTab />
          </TabsContent>
          
          <TabsContent value="amazon">
            <TrunklineAmazonTab />
          </TabsContent>
          
          <TabsContent value="zinc">
            <TrunklineZincTab />
          </TabsContent>
        </Tabs>
      </div>
    </ProductProvider>
  );
};

export default Trunkline;
