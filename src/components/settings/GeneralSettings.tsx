
import React from "react";
import { useSettingsForm } from "@/hooks/settings/useSettingsForm";
import { useFormSubmission } from "@/hooks/settings/useFormSubmission";
import { useInterests } from "@/hooks/settings/useInterests";
import { useImportantDates } from "@/hooks/settings/useImportantDates";
import { useProfileData } from "@/hooks/settings/useProfileData";
import ProfileImageFormSection from "./form-sections/ProfileImageFormSection";
import BasicInfoFormSection from "./form-sections/BasicInfoFormSection";
import AddressFormSection from "./form-sections/AddressFormSection";
import InterestsFormSection from "./form-sections/InterestsFormSection";
import ImportantDatesFormSection from "./form-sections/ImportantDatesFormSection";
import DataSharingFormSection from "./form-sections/DataSharingFormSection";
import FormSubmitSection from "./form-sections/FormSubmitSection";
import { Form } from "@/components/ui/form";

const GeneralSettings = () => {
  const { form, onSubmit, isLoading } = useSettingsForm();
  const { user, isSaving, onSubmit: handleSubmit } = useFormSubmission();
  
  const { profile, loading, loadProfileData, refetchProfile } = useProfileData(form);
  
  const {
    newInterest,
    setNewInterest,
    handleAddInterest,
    handleRemoveInterest
  } = useInterests(form);

  const {
    newImportantDate,
    setNewImportantDate,
    handleAddImportantDate,
    handleRemoveImportantDate
  } = useImportantDates(form);

  // Show loading state if profile is still loading
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium">General Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage your profile information and preferences.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          <ProfileImageFormSection 
            form={form} 
            refetchProfile={refetchProfile}
          />
          
          <BasicInfoFormSection form={form} />
          
          <AddressFormSection form={form} />
          
          <InterestsFormSection
            form={form}
            newInterest={newInterest}
            setNewInterest={setNewInterest}
            handleAddInterest={handleAddInterest}
            handleRemoveInterest={handleRemoveInterest}
          />
          
          <ImportantDatesFormSection
            form={form}
            newImportantDate={newImportantDate}
            setNewImportantDate={setNewImportantDate}
            handleAddImportantDate={handleAddImportantDate}
            handleRemoveImportantDate={handleRemoveImportantDate}
          />
          
          <DataSharingFormSection form={form} />
          
          <FormSubmitSection isSaving={isSaving} />
        </form>
      </Form>
    </div>
  );
};

export default GeneralSettings;
