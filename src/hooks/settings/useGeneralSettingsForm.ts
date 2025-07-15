
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useAutoSaveImportantDates, NewImportantDateState } from "./useAutoSaveImportantDates";
import { useAutoSaveInterests } from "./useAutoSaveInterests";
import { useProfileData } from "./useProfileData";
import { useFormSubmission } from "./useFormSubmission";
import { useUnsavedChanges } from "./useUnsavedChanges";
import { formSchema, SettingsFormValues, ImportantDate } from "./settingsFormSchema";

export { type NewImportantDateState } from "./useAutoSaveImportantDates";

export const useGeneralSettingsForm = () => {
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      // New mandatory fields
      first_name: "",
      last_name: "",
      name: "",
      email: "",
      username: "",
      bio: "",
      profile_image: null,
      date_of_birth: undefined,
      address: {
        street: "",
        line2: "",
        city: "",
        state: "",
        zipCode: "",
        country: ""
      },
      interests: [],
      importantDates: [],
      data_sharing_settings: {
        dob: "private",
        shipping_address: "private",
        gift_preferences: "friends",
        email: "private"
      }
    }
  });

  // Use our custom hooks
  const { user, isSaving, onSubmit } = useFormSubmission();
  const { hasUnsavedChanges, setInitialFormValues, clearUnsavedChanges } = useUnsavedChanges(form);
  const { profile, loading, loadProfileData, refetchProfile } = useProfileData(form, setInitialFormValues);
  const { newInterest, setNewInterest, handleAddInterest, handleRemoveInterest, isAutoSaving: isAutoSavingInterests } = useAutoSaveInterests(form);
  const { newImportantDate, setNewImportantDate, handleAddImportantDate, handleRemoveImportantDate, isAutoSaving: isAutoSavingDates } = useAutoSaveImportantDates(form);

  // Enhanced onSubmit with unsaved changes tracking
  const handleSubmit = async (data: SettingsFormValues) => {
    console.log("📋 Form handleSubmit called with data:", data);
    await onSubmit(data);
    clearUnsavedChanges();
  };

  return {
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
    onSubmit: handleSubmit,
    handleAddInterest,
    handleRemoveInterest,
    handleAddImportantDate,
    handleRemoveImportantDate,
    hasUnsavedChanges,
    setInitialFormValues,
    isAutoSavingInterests,
    isAutoSavingDates
  };
};
