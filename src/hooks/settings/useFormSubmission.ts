
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/hooks/profile/useProfile";
import { SettingsFormValues } from "./settingsFormSchema";
import { ShippingAddress, DataSharingSettings } from "@/types/supabase";

export const useFormSubmission = () => {
  const { user } = useAuth();
  const { updateProfile } = useProfile();
  const [isSaving, setIsSaving] = useState(false);

  const onSubmit = async (data: SettingsFormValues) => {
    if (!user) {
      toast.error("You must be logged in to update your profile");
      return;
    }
    
    try {
      setIsSaving(true);
      console.log("Submitting profile data:", data);
      
      // Format gift preferences for storage, ensuring importance is one of the allowed values
      const gift_preferences = data.interests.map(interest => ({
        category: interest,
        importance: "medium" as "high" | "medium" | "low" 
      }));
      
      // Format important dates
      const important_dates = data.importantDates.map(date => ({
        date: date.date.toISOString(),
        description: date.description
      }));
      
      // Ensure shipping address has all required fields
      const shippingAddress: ShippingAddress = {
        street: data.address.street || "",
        city: data.address.city || "",
        state: data.address.state || "",
        zipCode: data.address.zipCode || "",
        country: data.address.country || ""
      };
      
      // Ensure data sharing settings have all required fields
      const dataSharingSettings: DataSharingSettings = {
        dob: data.data_sharing_settings.dob || "private",
        shipping_address: data.data_sharing_settings.shipping_address || "private",
        gift_preferences: data.data_sharing_settings.gift_preferences || "friends"
      };
      
      // Prepare update data
      const updateData = {
        name: data.name,
        email: data.email,
        bio: data.bio || `Hi, I'm ${data.name}`,
        profile_image: data.profile_image,
        dob: data.birthday ? data.birthday.toISOString() : null,
        shipping_address: shippingAddress,
        gift_preferences: gift_preferences,
        important_dates: important_dates,
        data_sharing_settings: dataSharingSettings,
        updated_at: new Date().toISOString()
      };
      
      console.log("Sending profile update with data:", updateData);
      
      // Update with retry mechanism
      let retryCount = 0;
      const maxRetries = 2;
      
      const attemptUpdate = async () => {
        try {
          await updateProfile(updateData);
          toast.success("Profile updated successfully");
          return true;
        } catch (error) {
          console.error(`Profile update attempt ${retryCount + 1} failed:`, error);
          if (retryCount < maxRetries) {
            retryCount++;
            toast.info(`Retrying profile update (${retryCount}/${maxRetries})...`);
            return false;
          } else {
            throw error;
          }
        }
      };
      
      let success = await attemptUpdate();
      while (!success && retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        success = await attemptUpdate();
      }
      
      if (!success) {
        throw new Error("Failed to update profile after multiple attempts");
      }
      
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile. Please try again later.");
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
