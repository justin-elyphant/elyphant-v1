
import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { mapDatabaseToSettingsForm } from "@/utils/profileDataMapper";
import { SettingsFormValues } from "./settingsFormSchema";

export const useProfileData = (
  form: UseFormReturn<SettingsFormValues>,
  setInitialFormValues: (values: SettingsFormValues) => void
) => {
  const { user } = useAuth();
  const { profile, loading, refetchProfile } = useProfile();
  const [dataLoadError, setDataLoadError] = useState<string | null>(null);
  const [forceResetCount, setForceResetCount] = useState(0);

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
      
      // Use the enhanced mapping function with birthday auto-population
      const mappedData = mapDatabaseToSettingsForm(profile);
      
      if (!mappedData) {
        throw new Error("Failed to map profile data to form format");
      }

      console.log("✅ Successfully mapped profile data:", mappedData);
      console.log("🔍 Mapped data details:", {
        first_name: mappedData.first_name,
        last_name: mappedData.last_name,
        date_of_birth: mappedData.date_of_birth,
        address: mappedData.address,
        interests_count: mappedData.interests?.length || 0,
        important_dates_count: mappedData.importantDates?.length || 0,
        birthday_in_events: mappedData.importantDates?.some(d => d.description === "Birthday") || false
      });

      // Check if we auto-populated birthday and need to save it back to the profile
      const existingImportantDatesCount = profile.important_dates?.length || 0;
      const newImportantDatesCount = mappedData.importantDates?.length || 0;
      const birthdayAutoAdded = newImportantDatesCount > existingImportantDatesCount && 
                               mappedData.importantDates?.some(d => d.description === "Birthday");
      
      if (birthdayAutoAdded) {
        console.log("🎂 Birthday was auto-added, will trigger background update");
        // We could trigger a background save here, but for now just log it
        // The user will save it when they interact with the form
      }

      // Force a complete form reset with the mapped data
      console.log("🔄 Resetting form with mapped data...");
      console.log("🔍 About to reset form with values:", {
        first_name: mappedData.first_name,
        last_name: mappedData.last_name,
        current_form_first_name: form.getValues("first_name"),
        current_form_last_name: form.getValues("last_name")
      });
      
      form.reset(mappedData, { 
        keepDefaultValues: false,
        keepErrors: false,
        keepDirty: false,
        keepTouched: false,
        keepIsSubmitted: false,
        keepSubmitCount: false
      });
      
      // Set initial form values for comparison
      setInitialFormValues(mappedData);
      
      // Manually set the specific values that seem to be problematic
      form.setValue("first_name", mappedData.first_name, { shouldValidate: false, shouldDirty: false });
      form.setValue("last_name", mappedData.last_name, { shouldValidate: false, shouldDirty: false });

      // Force a re-render by incrementing the reset count
      setForceResetCount(prev => prev + 1);

      console.log("✅ Form reset with profile data completed");
      
      // Verify the form was actually reset
      setTimeout(() => {
        const currentFormValues = form.getValues();
        console.log("🔍 Form values after reset:", {
          first_name: currentFormValues.first_name,
          last_name: currentFormValues.last_name,
          date_of_birth: currentFormValues.date_of_birth,
          address: currentFormValues.address,
          interests_count: currentFormValues.interests?.length || 0,
          important_dates_count: currentFormValues.importantDates?.length || 0,
          birthday_found: currentFormValues.importantDates?.some(d => d.description === "Birthday") || false
        });
      }, 100);

    } catch (error: any) {
      console.error("❌ Error loading profile data:", error);
      setDataLoadError(error.message || "Failed to load profile data");
      
      // Set safe default values if mapping fails
      const defaultValues: SettingsFormValues = {
        first_name: (profile as any).first_name || profile.name?.split(' ')[0] || "",
        last_name: (profile as any).last_name || profile.name?.split(' ').slice(1).join(' ') || "",
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
          country: "US"
        },
        interests: [],
        importantDates: [],
      };

      form.reset(defaultValues);
      setInitialFormValues(defaultValues);
    }
  };

  // Load profile data when available with proper dependency management
  useEffect(() => {
    console.log("🔄 useProfileData effect triggered", { 
      profile: !!profile, 
      loading,
      profileId: profile?.id,
      forceResetCount
    });
    
    if (profile && !loading) {
      // Add a small delay to ensure DOM is ready
      const timeoutId = setTimeout(() => {
        loadProfileData();
      }, 50);
      
      return () => clearTimeout(timeoutId);
    }
  }, [profile, loading, profile?.id]);

  // Force reload when user changes
  useEffect(() => {
    if (user?.id && profile?.id && user.id !== profile.id) {
      console.log("🔄 User changed, forcing profile reload");
      refetchProfile();
    }
  }, [user?.id, profile?.id]);

  return {
    user,
    profile,
    loading,
    loadProfileData,
    refetchProfile,
    dataLoadError,
    forceResetCount // This can trigger re-renders when needed
  };
};
