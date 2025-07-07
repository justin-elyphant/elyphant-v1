
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
      
      console.log("Form data before processing:", JSON.stringify(formData, null, 2));
      
      // Validate required fields
      if (!formData.name || formData.name.trim() === '') {
        toast.error("Name is required");
        return;
      }
      
      if (!formData.email || formData.email.trim() === '') {
        toast.error("Email is required");
        return;
      }
      
      // Clean and validate form data
      const cleanedFormData = {
        ...formData,
        username: formData.username && formData.username.trim() !== '' ? formData.username.trim() : null,
        name: formData.name.trim(),
        email: formData.email.trim(),
        bio: formData.bio?.trim() || ""
      };
      
      // Convert form data to API format
      const apiData = profileFormToApiData(cleanedFormData);
      
      // Ensure profile_image is included in the update
      if (cleanedFormData.profile_image !== undefined) {
        apiData.profile_image = cleanedFormData.profile_image;
      }
      
      console.log("Submitting profile update with cleaned data:", JSON.stringify(apiData, null, 2));
      
      // Update profile
      await updateProfile(apiData);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error saving profile:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update profile";
      toast.error(errorMessage);
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
