
import { useEffect, useRef } from "react";
import { UseFormReturn } from "react-hook-form";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { SettingsFormValues } from "./settingsFormSchema";
import { mapDatabaseToSettingsForm } from "@/utils/dataFormatUtils";
import { useProfileCacheManager } from "@/hooks/profile/useProfileCacheManager";

export const useProfileData = (form: UseFormReturn<SettingsFormValues>, setInitialFormValues?: (values: SettingsFormValues) => void) => {
  const { profile, loading, refetchProfile } = useProfile();
  const { handleOnboardingComplete } = useProfileCacheManager();
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
        
        // Set initial values for unsaved changes tracking
        if (setInitialFormValues) {
          setInitialFormValues(mappedData);
        }
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

  // Check for onboarding completion flag and force refresh (only once)
  useEffect(() => {
    const checkOnboardingCompletion = async () => {
      const onboardingComplete = localStorage.getItem("onboardingComplete");
      
      // Force refresh if onboarding was just completed
      if (onboardingComplete === "true") {
        console.log("🎯 Onboarding completed flag detected - starting data sync");
        
        // Clear the flag immediately to prevent repeat triggers
        localStorage.removeItem("onboardingComplete");
        
        // Reset loading state to ensure fresh data load
        hasLoadedRef.current = false;
        lastProfileUpdateRef.current = null;
        
        // Use the cache manager to handle complete refresh
        await handleOnboardingComplete();
        
        console.log("✅ Onboarding data sync complete");
      }
    };

    checkOnboardingCompletion();
  }, []); // No dependencies to prevent infinite loop

  // Additional effect to handle immediate profile loading when it becomes available
  useEffect(() => {
    if (profile && !hasLoadedRef.current) {
      console.log("🚀 Profile became available, loading immediately");
      loadProfileData();
    }
  }, [profile]);


  return {
    profile,
    loading,
    loadProfileData,
    refetchProfile
  };
};
