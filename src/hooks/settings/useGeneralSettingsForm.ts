
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useImportantDates, NewImportantDateState } from "./useImportantDates";
import { useInterests } from "./useInterests";
import { useProfileData } from "./useProfileData";
import { useFormSubmission } from "./useFormSubmission";
import { formSchema, SettingsFormValues } from "./settingsFormSchema";

export { type NewImportantDateState } from "./useImportantDates";

export const useGeneralSettingsForm = () => {
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      bio: "",
      profile_image: null,
      birthday: null,
      address: {
        street: "",
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
        gift_preferences: "friends"
      }
    }
  });

  // Use our custom hooks
  const { user, isSaving, onSubmit } = useFormSubmission();
  const { profile, loading, loadProfileData, refetchProfile } = useProfileData(form);
  const { newInterest, setNewInterest, handleAddInterest, handleRemoveInterest } = useInterests(form);
  const { newImportantDate, setNewImportantDate, handleAddImportantDate, handleRemoveImportantDate } = useImportantDates(form);

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
    onSubmit,
    handleAddInterest,
    handleRemoveInterest,
    handleAddImportantDate,
    handleRemoveImportantDate
  };
};
