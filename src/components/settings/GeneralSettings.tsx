
import React from "react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useSettingsForm } from "@/hooks/settings/useSettingsForm";
import BasicInfoSection from "./BasicInfoSection";
import ProfileImageSection from "./ProfileImageSection";
import AddressSection from "./AddressSection";
import InterestsFormSection from "./InterestsFormSection";
import ImportantDatesFormSection from "./ImportantDatesFormSection";
import DataSharingSection from "./DataSharingSection";
import DeleteAccount from "./DeleteAccount";

const GeneralSettings = () => {
  const { form, onSubmit, isLoading } = useSettingsForm();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">General Settings</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="col-span-1">
              <ProfileImageSection 
                currentImage={form.getValues("profile_image")}
                name={form.getValues("name")}
                onImageUpdate={(url) => form.setValue("profile_image", url)}
              />
            </div>
            
            <div className="col-span-1 md:col-span-2 space-y-8">
              <BasicInfoSection />
              <InterestsFormSection />
              <ImportantDatesFormSection />
            </div>
          </div>
          
          <AddressSection />
          <DataSharingSection />
          
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full md:w-auto"
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Form>
      
      <div className="border-t border-gray-200 pt-8">
        <DeleteAccount />
      </div>
    </div>
  );
};

export default GeneralSettings;
