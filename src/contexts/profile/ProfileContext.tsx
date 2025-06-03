
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

  // Combined loading and error states
  const loading = isFetching || isUpdating;
  const error = fetchError || updateError;

  // Debounced fetch to prevent multiple simultaneous calls
  const debouncedFetchProfile = useCallback(async () => {
    if (fetchingRef.current) {
      console.log("Profile fetch already in progress, skipping");
      return null;
    }

    fetchingRef.current = true;
    try {
      const profileData = await fetchProfile();
      if (profileData) {
        console.log("Profile loaded from backend:", profileData);
        setProfile(profileData);
        setLastFetchTime(Date.now());
      }
      return profileData;
    } finally {
      fetchingRef.current = false;
    }
  }, [fetchProfile]);

  // Fetch profile data when auth state changes - only once
  useEffect(() => {
    debouncedFetchProfile();
  }, [debouncedFetchProfile]);

  // Check for new signup flags - but only if we haven't fetched recently
  useEffect(() => {
    const isNewSignup = localStorage.getItem("newSignUp") === "true";
    const isProfileSetupLoading = localStorage.getItem("profileSetupLoading") === "true";
    const timeSinceLastFetch = lastFetchTime ? Date.now() - lastFetchTime : Infinity;
    
    if ((isNewSignup || isProfileSetupLoading) && timeSinceLastFetch > 5000) {
      console.log("Detected new signup or profile setup, fetching profile data");
      debouncedFetchProfile();
    }
  }, [debouncedFetchProfile, lastFetchTime]);

  // Wrapper for updating the profile that also updates local state
  const handleUpdateProfile = async (data: Partial<Profile>) => {
    try {
      console.log("Updating profile with data:", JSON.stringify(data, null, 2));
      const result = await updateProfile(data);
      
      if (result) {
        // Update the local profile state with the new data
        const updatedProfile = await debouncedFetchProfile();
        if (updatedProfile) {
          setProfile(updatedProfile);
          setLastFetchTime(Date.now());
        }
      }
      
      return result;
    } catch (error) {
      console.error("Profile update failed:", error);
      toast.error("Failed to update profile");
      throw error;
    }
  };

  // Wrapper for refetching the profile
  const refetchProfile = useCallback(async () => {
    try {
      console.log("Manually refetching profile...");
      const profileData = await debouncedFetchProfile();
      if (profileData) {
        console.log("Profile refetched successfully");
      } else {
        console.log("No profile data returned when refetching");
      }
      return profileData;
    } catch (error) {
      console.error("Error refetching profile:", error);
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
