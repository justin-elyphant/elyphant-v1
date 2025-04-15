
import React, { useEffect } from "react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useGeneralSettingsForm } from "@/hooks/settings/useGeneralSettingsForm";
import BasicInfoSection from "./BasicInfoSection";
import ProfileImageSection from "./ProfileImageSection";
import AddressSection from "./AddressSection";
import InterestsFormSection from "./InterestsFormSection";
import ImportantDatesFormSection, { ImportantDate } from "./ImportantDatesFormSection";
import DataSharingSection from "./DataSharingSection";
import DeleteAccount from "./DeleteAccount";

const GeneralSettings = () => {
  const {
    user,
    form,
    isSaving,
    loading,
    newInterest,
    setNewInterest,
    newImportantDate,
    setNewImportantDate,
    loadProfileData,
    refetchProfile,
    onSubmit,
    handleAddInterest,
    handleRemoveInterest,
    handleAddImportantDate,
    handleRemoveImportantDate
  } = useGeneralSettingsForm();
  
  // Load profile data into form when component mounts
  useEffect(() => {
    // Force a refetch to ensure we have the latest data
    refetchProfile().then(() => {
      loadProfileData();
    });
  }, []);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Cast the form values to the correct type to ensure TypeScript is happy
  const importantDates = form.getValues("importantDates") as ImportantDate[];
  
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">General Settings</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="col-span-1">
              <ProfileImageSection 
                currentImage={form.getValues("profile_image") || null}
                name={form.getValues("name")}
                onImageUpdate={(url) => form.setValue("profile_image", url)}
              />
            </div>
            
            <div className="col-span-1 md:col-span-2 space-y-8">
              <BasicInfoSection 
                user={user}
              />
              
              <InterestsFormSection 
                interests={form.getValues("interests")}
                removeInterest={handleRemoveInterest}
                newInterest={newInterest}
                setNewInterest={setNewInterest}
                addInterest={handleAddInterest}
              />
              
              <ImportantDatesFormSection 
                importantDates={importantDates}
                removeImportantDate={handleRemoveImportantDate}
                newImportantDate={newImportantDate}
                setNewImportantDate={setNewImportantDate}
                addImportantDate={handleAddImportantDate}
              />
            </div>
          </div>
          
          <AddressSection />
          
          <DataSharingSection />
          
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isSaving}
              className="w-full md:w-auto"
            >
              {isSaving ? "Saving..." : "Save Changes"}
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
