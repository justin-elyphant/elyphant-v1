
import React, { useState } from "react";
import { VendorApplicationForm } from "@/components/vendor/VendorApplicationForm";
import { VendorBenefitsCard } from "@/components/vendor/VendorBenefitsCard";
import { VendorApplicationStatus } from "@/components/vendor/VendorApplicationStatus";
import { MarketplaceModelCard } from "@/components/vendor/MarketplaceModelCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

const VendorSignup = () => {
  const [activeTab, setActiveTab] = useState("apply");
  
  // This would normally come from an API or state management
  const demoApplicationStatus = {
    status: "under_review" as const,
    submissionDate: "June 15, 2023",
    notes: "Your product catalog looks promising. We're reviewing your integration options."
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">Vendor Portal Sign Up</h1>
      
      <Alert className="mb-6 bg-blue-50 border-blue-200">
        <Info className="h-5 w-5 text-blue-500" />
        <AlertTitle className="text-blue-700">Free Starter Program</AlertTitle>
        <AlertDescription className="text-blue-600">
          Get started with 10 free product listings. Boost your visibility with our credit system for additional listings and sponsored placements.
        </AlertDescription>
      </Alert>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="apply">Apply</TabsTrigger>
          <TabsTrigger value="status">Application Status</TabsTrigger>
        </TabsList>
        
        <TabsContent value="apply">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <VendorApplicationForm />
            </div>
            <div className="space-y-6">
              <VendorBenefitsCard />
              <MarketplaceModelCard />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="status">
          <div className="max-w-2xl mx-auto">
            <VendorApplicationStatus {...demoApplicationStatus} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VendorSignup;
