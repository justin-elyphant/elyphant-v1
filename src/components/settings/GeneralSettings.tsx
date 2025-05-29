
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BasicInfoSection from "./BasicInfoSection";
import AddressSection from "./AddressSection";
import DataSharingSection from "./DataSharingSection";
import ImportantDatesFormSection from "./ImportantDatesFormSection";
import InterestsFormSection from "./InterestsFormSection";
import GiftingPreferencesSection from "./GiftingPreferencesSection";

const GeneralSettings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">General Settings</h2>
        <p className="text-gray-600">Manage your profile information and preferences</p>
      </div>
      
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="address">Address</TabsTrigger>
          <TabsTrigger value="dates">Important Dates</TabsTrigger>
          <TabsTrigger value="interests">Interests</TabsTrigger>
          <TabsTrigger value="gifting">Gifting</TabsTrigger>
          <TabsTrigger value="privacy">Data Sharing</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="mt-6">
          <BasicInfoSection />
        </TabsContent>
        
        <TabsContent value="address" className="mt-6">
          <AddressSection />
        </TabsContent>
        
        <TabsContent value="dates" className="mt-6">
          <ImportantDatesFormSection />
        </TabsContent>
        
        <TabsContent value="interests" className="mt-6">
          <InterestsFormSection />
        </TabsContent>
        
        <TabsContent value="gifting" className="mt-6">
          <GiftingPreferencesSection />
        </TabsContent>
        
        <TabsContent value="privacy" className="mt-6">
          <DataSharingSection />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GeneralSettings;
