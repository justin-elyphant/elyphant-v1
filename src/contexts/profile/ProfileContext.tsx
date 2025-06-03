
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useProfileFetch } from './useProfileFetch';
import { useProfileUpdate } from './useProfileUpdate';
import { Profile } from "@/types/supabase";
import { toast } from 'sonner';

interface ProfileContextType {
  profile: Profile | null;
  loading: boolean;
  error: Error | null;
  updateProfile: (data: Partial<Profile>) => Promise<any>;
  refetchProfile: () => Promise<Profile | null>;
  refreshProfile: () => Promise<Profile | null>; 
  lastRefreshTime: number | null;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { fetchProfile, loading: isFetching, error: fetchError } = useProfileFetch();
  const { updateProfile, isUpdating, updateError } = useProfileUpdate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);
  const fetchingRef = useRef(false);
  const initialLoadRef = useRef(false);

  // Combined loading and error states
  const loading = isFetching || isUpdating;
  const error = fetchError || updateError;

  // Debounced fetch to prevent multiple simultaneous calls
  const debouncedFetchProfile = useCallback(async () => {
    if (fetchingRef.current) {
      console.log("[ProfileContext] Profile fetch already in progress, skipping");
      return null;
    }

    fetchingRef.current = true;
    try {
      console.log("[ProfileContext] Fetching profile data...");
      const profileData = await fetchProfile();
      if (profileData) {
        console.log("[ProfileContext] Profile loaded from backend:", profileData);
        setProfile(profileData);
        setLastFetchTime(Date.now());
        
        // Clear onboarding flags after successful profile load - but only if not in signup flow
        const isInSignupFlow = window.location.pathname.includes('/signup') || 
                              localStorage.getItem("showingIntentModal") === "true";
        
        if (localStorage.getItem("newSignUp") === "true" && !isInSignupFlow) {
          localStorage.removeItem("newSignUp");
          localStorage.removeItem("profileSetupLoading");
          console.log("[ProfileContext] Cleared onboarding flags after profile load");
        }
      } else {
        console.log("[ProfileContext] No profile data returned");
      }
      return profileData;
    } finally {
      fetchingRef.current = false;
    }
  }, [fetchProfile]);

  // Initial profile fetch - only once and not during signup
  useEffect(() => {
    if (!initialLoadRef.current) {
      const isInSignupFlow = window.location.pathname.includes('/signup');
      
      if (!isInSignupFlow) {
        console.log("[ProfileContext] Initial profile fetch starting...");
        initialLoadRef.current = true;
        debouncedFetchProfile();
      } else {
        console.log("[ProfileContext] Skipping initial fetch - in signup flow");
      }
    }
  }, [debouncedFetchProfile]);

  // Enhanced profile completion detection
  useEffect(() => {
    const profileCompleted = localStorage.getItem("profileCompleted") === "true";
    const profileCompletedTimestamp = localStorage.getItem("profileCompletedTimestamp");
    const timeSinceLastFetch = lastFetchTime ? Date.now() - lastFetchTime : Infinity;
    const isInSignupFlow = window.location.pathname.includes('/signup');
    
    // If profile was just completed and enough time has passed, refresh the data
    if (profileCompleted && 
        profileCompletedTimestamp && 
        timeSinceLastFetch > 5000 && 
        !fetchingRef.current &&
        !isInSignupFlow) {
      const completedTime = parseInt(profileCompletedTimestamp);
      const timeSinceCompletion = Date.now() - completedTime;
      
      // If completion was recent (within 30 seconds), refresh
      if (timeSinceCompletion < 30000) {
        console.log("[ProfileContext] Profile recently completed, refreshing data");
        debouncedFetchProfile().then(() => {
          // Clear the completion flag after refresh
          localStorage.removeItem("profileCompleted");
          localStorage.removeItem("profileCompletedTimestamp");
        });
      }
    }
  }, [debouncedFetchProfile, lastFetchTime]);

  // Handle onboarding completion signals with more careful timing
  useEffect(() => {
    const isNewSignup = localStorage.getItem("newSignUp") === "true";
    const isProfileSetupLoading = localStorage.getItem("profileSetupLoading") === "true";
    const onboardingComplete = localStorage.getItem("onboardingComplete") === "true";
    const timeSinceLastFetch = lastFetchTime ? Date.now() - lastFetchTime : Infinity;
    const isInSignupFlow = window.location.pathname.includes('/signup');
    
    // Only fetch if there's a clear signal AND enough time has passed AND no profile yet AND not in signup flow
    if ((isProfileSetupLoading || onboardingComplete) && 
        timeSinceLastFetch > 15000 && 
        !profile && 
        !fetchingRef.current &&
        !isInSignupFlow) {
      console.log("[ProfileContext] Detected onboarding completion, fetching profile data");
      debouncedFetchProfile();
    }
  }, [debouncedFetchProfile, lastFetchTime, profile]);

  // Wrapper for updating the profile that also updates local state
  const handleUpdateProfile = async (data: Partial<Profile>) => {
    try {
      console.log("[ProfileContext] Updating profile with data:", JSON.stringify(data, null, 2));
      const result = await updateProfile(data);
      
      if (result) {
        console.log("[ProfileContext] Profile update successful, refetching...");
        // Update the local profile state with the new data
        const updatedProfile = await debouncedFetchProfile();
        if (updatedProfile) {
          setProfile(updatedProfile);
          setLastFetchTime(Date.now());
          console.log("[ProfileContext] Profile state updated with fresh data");
        }
      }
      
      return result;
    } catch (error) {
      console.error("[ProfileContext] Profile update failed:", error);
      toast.error("Failed to update profile");
      throw error;
    }
  };

  // Wrapper for refetching the profile
  const refetchProfile = useCallback(async () => {
    try {
      console.log("[ProfileContext] Manually refetching profile...");
      const profileData = await debouncedFetchProfile();
      if (profileData) {
        console.log("[ProfileContext] Profile refetched successfully");
      } else {
        console.log("[ProfileContext] No profile data returned when refetching");
      }
      return profileData;
    } catch (error) {
      console.error("[ProfileContext] Error refetching profile:", error);
      toast.error("Failed to refresh your profile data");
      return null;
    }
  }, [debouncedFetchProfile]);
  
  // Add refreshProfile as an alias of refetchProfile for backward compatibility
  const refreshProfile = refetchProfile;

  const value = {
    profile,
    loading,
    error,
    updateProfile: handleUpdateProfile,
    refetchProfile,
    refreshProfile,
    lastRefreshTime: lastFetchTime
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}
