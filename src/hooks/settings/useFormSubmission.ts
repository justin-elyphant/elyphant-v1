
import { useState } from "react";
import { toast } from "sonner";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { useAuth } from "@/contexts/auth";
import { profileFormToApiData } from "@/types/profile";

export const useFormSubmission = () => {
  const { user } = useAuth();
  const { updateProfile } = useProfile();
  const [isSaving, setIsSaving] = useState(false);

  const onSubmit = async (formData: any) => {
    if (!user) {
      toast.error("You must be logged in to update your profile");
      return;
    }

    try {
      setIsSaving(true);
      
      // Convert form data to API format
      const apiData = profileFormToApiData(formData);
      
      // Update profile
      await updateProfile(apiData);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    user,
    isSaving,
    onSubmit
  };
};
