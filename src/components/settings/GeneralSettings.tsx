
import React, { useState } from "react";
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
import { useAuth } from "@/contexts/auth";
import { ImportantDate } from "@/hooks/settings/settingsFormSchema";

// Define a type for the new important date state that makes date required
interface NewImportantDateState {
  date: Date;
  description: string;
}

const GeneralSettings = () => {
  const { form, onSubmit, isLoading } = useSettingsForm();
  const { user } = useAuth();
  const [newInterest, setNewInterest] = useState("");
  const [newImportantDate, setNewImportantDate] = useState<NewImportantDateState>({
    date: new Date(),
    description: ""
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleAddInterest = () => {
    if (!newInterest.trim()) return;
    
    const currentInterests = form.getValues("interests") || [];
    form.setValue("interests", [...currentInterests, newInterest.trim()]);
    setNewInterest("");
  };

  const handleRemoveInterest = (index: number) => {
    const currentInterests = form.getValues("interests") || [];
    form.setValue("interests", currentInterests.filter((_, i) => i !== index));
  };

  const handleAddImportantDate = () => {
    if (!newImportantDate.date || !newImportantDate.description.trim()) return;
    
    const currentDates = form.getValues("importantDates") || [];
    form.setValue("importantDates", [...currentDates, {
      date: newImportantDate.date,
      description: newImportantDate.description.trim()
    }]);
    
    setNewImportantDate({ date: new Date(), description: "" });
  };

  const handleRemoveImportantDate = (index: number) => {
    const currentDates = form.getValues("importantDates") || [];
    form.setValue("importantDates", currentDates.filter((_, i) => i !== index));
  };

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
              <BasicInfoSection user={user} />
              <InterestsFormSection 
                interests={form.getValues("interests") || []}
                removeInterest={handleRemoveInterest}
                newInterest={newInterest}
                setNewInterest={setNewInterest}
                addInterest={handleAddInterest}
              />
              <ImportantDatesFormSection 
                importantDates={form.getValues("importantDates") as ImportantDate[] || []}
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
