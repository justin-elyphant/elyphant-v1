
import React, { useState } from "react";
import { VendorApplicationForm } from "@/components/vendor/VendorApplicationForm";
import { VendorBenefitsCard } from "@/components/vendor/VendorBenefitsCard";
import { VendorApplicationStatus } from "@/components/vendor/VendorApplicationStatus";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
            <div>
              <VendorBenefitsCard />
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
