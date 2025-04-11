
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/hooks/profile/useProfile";
import { SettingsFormValues } from "./settingsFormSchema";
import { ImportantDate, GiftPreference, ShippingAddress, DataSharingSettings } from "@/types/supabase";

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
      const gift_preferences: GiftPreference[] = data.interests.map(interest => ({
        category: interest,
        importance: "medium" as "high" | "medium" | "low" // Explicitly casting to the allowed literal types
      }));
      
      // Format important dates
      const important_dates: ImportantDate[] = data.importantDates.map(date => ({
        date: date.date.toISOString(),
        description: date.description
      }));
      
      // Prepare update data
      const updateData = {
        name: data.name,
        email: data.email,
        bio: data.bio,
        profile_image: data.profile_image,
        dob: data.birthday ? data.birthday.toISOString() : null,
        shipping_address: data.address as ShippingAddress,
        gift_preferences: gift_preferences,
        important_dates: important_dates,
        data_sharing_settings: data.data_sharing_settings as DataSharingSettings,
        updated_at: new Date().toISOString()
      };
      
      await updateProfile(updateData);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
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
