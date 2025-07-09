
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
      
      console.log("🚀 FORM SUBMISSION STARTED");
      console.log("📝 Raw form data:", JSON.stringify(formData, null, 2));
      
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
      
      console.log("🧹 Cleaned form data:", JSON.stringify(cleanedFormData, null, 2));
      
      // Convert form data to API format
      const apiData = profileFormToApiData(cleanedFormData);
      
      // Ensure profile_image is included in the update
      if (cleanedFormData.profile_image !== undefined) {
        apiData.profile_image = cleanedFormData.profile_image;
      }
      
      console.log("🔄 API data before update:", JSON.stringify(apiData, null, 2));
      console.log("📍 Address data specifically:", JSON.stringify(apiData.shipping_address, null, 2));
      
      // Update profile
      console.log("📤 Calling updateProfile...");
      const result = await updateProfile(apiData);
      console.log("✅ UpdateProfile result:", result);
      
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("❌ Error saving profile:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update profile";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
      console.log("🏁 FORM SUBMISSION ENDED");
    }
  };

  return {
    user,
    isSaving,
    onSubmit
  };
};
