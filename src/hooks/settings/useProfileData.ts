
import { useEffect, useRef } from "react";
import { UseFormReturn } from "react-hook-form";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { SettingsFormValues } from "./settingsFormSchema";
import { mapDatabaseToSettingsForm } from "@/utils/dataFormatUtils";

export const useProfileData = (form: UseFormReturn<SettingsFormValues>) => {
  const { profile, loading, refetchProfile } = useProfile();
  const hasLoadedRef = useRef(false);
  const lastProfileUpdateRef = useRef<string | null>(null);

  // Load profile data when available
  const loadProfileData = () => {
    if (profile && !loading) {
      console.log("🔄 Loading profile data into settings form:", profile);
      
      // Check for data integrity issues first
      if (!profile.name || profile.name.trim() === '') {
        console.warn("⚠️ Profile name is missing or empty:", profile.name);
      }
      
      if (!profile.email || profile.email.trim() === '') {
        console.warn("⚠️ Profile email is missing or empty:", profile.email);
      }
      
      // Use the improved mapping function
      const mappedData = mapDatabaseToSettingsForm(profile);
      
      if (mappedData) {
        // Ensure profile_image is included
        if (profile.profile_image !== undefined) {
          mappedData.profile_image = profile.profile_image;
        }
        
        console.log("✅ Mapped data for settings form:", {
          name: mappedData.name,
          email: mappedData.email,
          username: profile.username,
          profile_image: mappedData.profile_image,
          dob: profile.dob,
          shipping_address: profile.shipping_address
        });
        
        form.reset(mappedData);
        hasLoadedRef.current = true;
      } else {
        console.error("❌ Failed to map profile data to settings form");
      }
    }
  };

  // Load profile data when component mounts or profile changes
  useEffect(() => {
    // Only load if we have profile data and haven't loaded yet, or if profile has actually changed
    const profileUpdateTime = profile?.updated_at;
    
    if (profile && !loading && (!hasLoadedRef.current || profileUpdateTime !== lastProfileUpdateRef.current)) {
      loadProfileData();
      lastProfileUpdateRef.current = profileUpdateTime;
    }
  }, [profile, loading]);

  // Check for onboarding completion flag ONLY ONCE on mount
  useEffect(() => {
    const checkOnboardingCompletion = async () => {
      const onboardingComplete = localStorage.getItem("onboardingComplete");
      const newSignUp = localStorage.getItem("newSignUp");
      
      // Only refetch if we haven't loaded profile data yet AND onboarding was just completed
      if (onboardingComplete === "true" && newSignUp !== "true" && !hasLoadedRef.current) {
        console.log("Onboarding completed, refreshing profile data once");
        await refetchProfile();
        // Clear the flag to prevent future refetches
        localStorage.removeItem("onboardingComplete");
      }
    };

    checkOnboardingCompletion();
  }, []); // Empty dependency array - only run once on mount

  return {
    profile,
    loading,
    loadProfileData,
    refetchProfile
  };
};
