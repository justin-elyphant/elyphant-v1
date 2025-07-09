
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useProfileFetch } from './useProfileFetch';
import { useProfileUpdate } from './useProfileUpdate';
import { ProfileDataValidator } from './ProfileDataValidator';
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
  // Enhanced data management
  invalidateCache: () => void;
  validateProfileData: (data: Partial<Profile>) => { isValid: boolean; errors: string[] };
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

  // Wrapper for updating the profile that also updates local state with validation
  const handleUpdateProfile = async (data: Partial<Profile>) => {
    try {
      // Validate data before updating
      const validation = ProfileDataValidator.validate(data);
      
      if (!validation.isValid) {
        console.error("Profile validation failed:", validation.errors);
        toast.error(`Validation failed: ${validation.errors[0]}`);
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      console.log("Updating profile with validated data:", JSON.stringify(validation.sanitizedData, null, 2));
      const result = await updateProfile(validation.sanitizedData!);
      
      if (result !== null) {
        // Just use the optimistic update - don't refetch immediately
        if (profile) {
          const optimisticUpdate = { 
            ...profile, 
            ...validation.sanitizedData,
            updated_at: new Date().toISOString()
          };
          console.log("✅ Using optimistic update for immediate UI refresh");
          setProfile(optimisticUpdate);
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

  // Enhanced data management functions
  const invalidateCache = useCallback(() => {
    unifiedDataService.invalidateCache();
    setLastFetchTime(null);
  }, []);

  const validateProfileData = useCallback((data: Partial<Profile>) => {
    const validation = ProfileDataValidator.validate(data);
    return {
      isValid: validation.isValid,
      errors: validation.errors
    };
  }, []);

  const value = {
    profile,
    loading,
    error,
    updateProfile: handleUpdateProfile,
    refetchProfile,
    refreshProfile,
    lastRefreshTime: lastFetchTime,
    invalidateCache,
    validateProfileData
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
