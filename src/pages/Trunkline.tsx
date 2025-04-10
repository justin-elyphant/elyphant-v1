
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { ProductProvider } from "@/contexts/ProductContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import TrunklineZincTab from "@/components/trunkline/TrunklineZincTab";
import TrunklineOrdersTab from "@/components/trunkline/TrunklineOrdersTab";
import TrunklineCustomersTab from "@/components/trunkline/TrunklineCustomersTab";
import TrunklineVendorsTab from "@/components/trunkline/TrunklineVendorsTab";

const Trunkline = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isInternalUser = user?.email?.endsWith('@elyphant.com') || user?.user_metadata?.isInternalUser;
  
  if (!isInternalUser) {
    return (
      <div className="container mx-auto py-16 px-4">
        <Alert variant="destructive" className="max-w-xl mx-auto">
          <ShieldAlert className="h-5 w-5" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to access the Trunkline dashboard. This area is restricted to Elyphant internal team members.
          </AlertDescription>
        </Alert>
        <div className="flex justify-center mt-8">
          <Button onClick={() => navigate('/')}>Return to Homepage</Button>
        </div>
      </div>
    );
  }
  
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
        
        <Tabs defaultValue="zinc">
          <TabsList className="mb-6">
            <TabsTrigger value="zinc">Zinc Integration</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
          </TabsList>
          
          <TabsContent value="zinc">
            <TrunklineZincTab />
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
        </Tabs>
      </div>
    </ProductProvider>
  );
};

export default Trunkline;
