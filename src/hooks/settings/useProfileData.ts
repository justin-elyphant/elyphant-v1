
import { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { SettingsFormValues } from "./settingsFormSchema";
import { mapDatabaseToSettingsForm } from "@/utils/dataFormatUtils";

export const useProfileData = (form: UseFormReturn<SettingsFormValues>) => {
  const { profile, loading, refetchProfile } = useProfile();

  // Load profile data when available
  const loadProfileData = () => {
    if (profile && !loading) {
      console.log("Loading profile data into settings form:", profile);
      
      // Use the improved mapping function
      const mappedData = mapDatabaseToSettingsForm(profile);
      
      if (mappedData) {
        console.log("Mapped data for settings form:", mappedData);
        form.reset(mappedData);
        console.log("Settings form reset with mapped data");
      } else {
        console.warn("Failed to map profile data to settings form");
      }
    }
  };

  // Load profile data when component mounts or profile changes
  useEffect(() => {
    loadProfileData();
  }, [profile, loading]);

  // Also check for onboarding completion flag and refresh if needed
  useEffect(() => {
    const checkOnboardingCompletion = async () => {
      const onboardingComplete = localStorage.getItem("onboardingComplete");
      const newSignUp = localStorage.getItem("newSignUp");
      
      if (onboardingComplete === "true" && newSignUp !== "true") {
        console.log("Onboarding completed, refreshing profile data");
        await refetchProfile();
      }
    };

    checkOnboardingCompletion();
  }, [refetchProfile]);

  return {
    profile,
    loading,
    loadProfileData,
    refetchProfile
  };
};
