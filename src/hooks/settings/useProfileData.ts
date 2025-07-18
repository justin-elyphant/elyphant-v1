
import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { mapDatabaseToSettingsForm } from "@/utils/dataFormatUtils";
import { SettingsFormValues } from "./settingsFormSchema";

export const useProfileData = (
  form: UseFormReturn<SettingsFormValues>,
  setInitialFormValues: (values: SettingsFormValues) => void
) => {
  const { user } = useAuth();
  const { profile, loading, refetchProfile } = useProfile();
  const [dataLoadError, setDataLoadError] = useState<string | null>(null);

  console.log("🔄 useProfileData hook initialized");
  console.log("👤 User:", user?.id);
  console.log("📊 Profile loading:", loading);
  console.log("📊 Profile data:", profile);

  const loadProfileData = () => {
    if (!profile || loading) {
      console.log("⏳ Profile not ready for loading");
      return;
    }

    console.log("🔄 Loading profile data into form");
    console.log("📊 Raw profile data:", JSON.stringify(profile, null, 2));

    try {
      setDataLoadError(null);
      
      // Use the improved mapping function
      const mappedData = mapDatabaseToSettingsForm(profile);
      
      if (!mappedData) {
        throw new Error("Failed to map profile data to form format");
      }

      console.log("✅ Successfully mapped profile data:", mappedData);

      // Reset form with mapped data
      form.reset(mappedData);
      setInitialFormValues(mappedData);

      console.log("✅ Form reset with profile data completed");

    } catch (error: any) {
      console.error("❌ Error loading profile data:", error);
      setDataLoadError(error.message || "Failed to load profile data");
      
      // Set default values if mapping fails
      const defaultValues: SettingsFormValues = {
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        name: profile.name || "",
        email: profile.email || "",
        username: profile.username || "",
        bio: profile.bio || "",
        profile_image: profile.profile_image || null,
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
      };

      form.reset(defaultValues);
      setInitialFormValues(defaultValues);
    }
  };

  // Load profile data when available
  useEffect(() => {
    console.log("🔄 useProfileData effect triggered", { profile: !!profile, loading });
    
    if (profile && !loading) {
      loadProfileData();
    }
  }, [profile, loading]);

  return {
    user,
    profile,
    loading,
    loadProfileData,
    refetchProfile,
    dataLoadError
  };
};
