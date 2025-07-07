
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useProfileFetch } from './useProfileFetch';
import { useProfileUpdate } from './useProfileUpdate';
import { Profile } from "@/types/supabase";
import { toast } from 'sonner';
import { unifiedDataService } from '@/services/unified/UnifiedDataService';

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

  // Combined loading and error states
  const loading = isFetching || isUpdating;
  const error = fetchError || updateError;

  // Load profile data - simplified and consolidated
  useEffect(() => {
    let isActive = true; // Prevent state updates if component unmounts
    
    const loadProfile = async () => {
      try {
        console.log("🔄 Loading profile data...");
        const profileData = await fetchProfile();
        
        // Only update state if component is still mounted
        if (isActive && profileData) {
          console.log("✅ Profile loaded from backend:", profileData);
          setProfile(profileData);
          setLastFetchTime(Date.now());
          
          // Clear any pending flags after successful load
          localStorage.removeItem("newSignUp");
          localStorage.removeItem("profileSetupLoading");
        }
      } catch (error) {
        console.error("❌ Error loading profile:", error);
        if (isActive) {
          // Don't clear existing profile on error
          setLastFetchTime(Date.now());
        }
      }
    };
    
    // Only load if we have a fetchProfile function
    if (typeof fetchProfile === 'function') {
      loadProfile();
    }
    
    // Cleanup function
    return () => {
      isActive = false;
    };
  }, [fetchProfile]);

  // Wrapper for updating the profile that also updates local state
  const handleUpdateProfile = async (data: Partial<Profile>) => {
    try {
      console.log("Updating profile with data:", JSON.stringify(data, null, 2));
      const result = await updateProfile(data);
      
      if (result) {
        // Add a small delay to ensure database consistency
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Update the local profile state with the new data
        const updatedProfile = await fetchProfile();
        if (updatedProfile) {
          console.log("✅ Profile refreshed after update:", updatedProfile);
          setProfile(updatedProfile);
          setLastFetchTime(Date.now());
        } else {
          console.warn("⚠️ Failed to fetch updated profile data");
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
      const profileData = await fetchProfile();
      if (profileData) {
        console.log("Profile refetched successfully");
        setProfile(profileData);
        setLastFetchTime(Date.now());
      } else {
        console.log("No profile data returned when refetching");
      }
      return profileData;
    } catch (error) {
      console.error("Error refetching profile:", error);
      toast.error("Failed to refresh your profile data");
      return null;
    }
  }, [fetchProfile]);
  
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
