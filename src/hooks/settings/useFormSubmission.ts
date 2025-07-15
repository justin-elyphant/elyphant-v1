
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
        bio: formData.bio?.trim() || "",
        address: formData.address // Ensure address is preserved
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
      console.log("📤 API Data being sent:", JSON.stringify(apiData, null, 2));
      
      try {
        const result = await updateProfile(apiData);
        console.log("✅ UpdateProfile result:", result);
        
        // Small delay to ensure database write completes
        await new Promise(resolve => setTimeout(resolve, 500));
        
        toast.success("Profile updated successfully");
      } catch (updateError) {
        console.error("❌ UpdateProfile threw error:", updateError);
        console.error("❌ Error details:", {
          message: updateError instanceof Error ? updateError.message : 'Unknown error',
          stack: updateError instanceof Error ? updateError.stack : undefined
        });
        
        // Re-throw to be caught by outer catch
        throw updateError;
      }
    } catch (error) {
      console.error("❌ Error saving profile:", error);
      console.error("❌ Outer error details:", {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
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
