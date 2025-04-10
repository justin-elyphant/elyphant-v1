
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ProductProvider } from "@/contexts/ProductContext";
import { useNavigate } from "react-router-dom";
import TrunklineZincTab from "@/components/trunkline/TrunklineZincTab";
import TrunklineOrdersTab from "@/components/trunkline/TrunklineOrdersTab";
import TrunklineCustomersTab from "@/components/trunkline/TrunklineCustomersTab";
import TrunklineVendorsTab from "@/components/trunkline/TrunklineVendorsTab";
import TrunklineSupportTab from "@/components/trunkline/TrunklineSupportTab";

const Trunkline = () => {
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
            <h1 className="text-4xl font-bold">Trunkline</h1>
            <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Internal Only</span>
          </div>
        </div>
        
        <Tabs defaultValue="support">
          <TabsList className="mb-6">
            <TabsTrigger value="support">Support Requests</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
            <TabsTrigger value="zinc">Zinc Integration</TabsTrigger>
          </TabsList>
          
          <TabsContent value="support">
            <TrunklineSupportTab />
          </TabsContent>
          
          <TabsContent value="orders">
            <TrunklineOrdersTab />
          </TabsContent>
          
          <TabsContent value="customers">
            <TrunklineCustomersTab />
          </TabsContent>
          
          <TabsContent value="vendors">
            <TrunklineVendorsTab />
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
