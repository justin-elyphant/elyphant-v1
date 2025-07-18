
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

  // Load profile data - simplified and with safe dependency handling
  useEffect(() => {
    let isActive = true; // Prevent state updates if component unmounts
    
    const loadProfile = async () => {
      try {
        console.log("🔄 Loading profile data...");
        
        // Only fetch if we have the fetchProfile function available
        if (typeof fetchProfile !== 'function') {
          console.warn("fetchProfile is not available yet");
          return;
        }
        
        const profileData = await fetchProfile();
        
        // Only update state if component is still mounted
        if (isActive && profileData) {
          console.log("✅ Profile loaded from backend:", {
            id: profileData.id,
            name: profileData.name,
            email: profileData.email,
            username: profileData.username,
            profile_image: profileData.profile_image,
            onboarding_completed: profileData.onboarding_completed
          });
          setProfile(profileData);
          setLastFetchTime(Date.now());
          
          // Clear any pending flags after successful load
          localStorage.removeItem("newSignUp");
          localStorage.removeItem("profileSetupLoading");
        } else if (isActive && profileData === null) {
          console.warn("⚠️ No profile data returned from fetchProfile");
          // Don't set profile to null if we already have data
          setLastFetchTime(Date.now());
        }
      } catch (error) {
        console.error("❌ Error loading profile:", error);
        if (isActive) {
          // Don't clear existing profile on error, just update timestamp
          setLastFetchTime(Date.now());
        }
      }
    };
    
    // Add a small delay to ensure auth context is initialized
    const timeoutId = setTimeout(loadProfile, 100);
    
    // Cleanup function
    return () => {
      isActive = false;
      clearTimeout(timeoutId);
    };
  }, []); // Remove fetchProfile from dependencies to prevent circular re-renders

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
        console.log("✅ Profile update successful, refetching profile data");
        
        // Force a proper refetch to get the actual database data
        try {
          await refetchProfile();
          console.log("✅ Profile refetch completed successfully");
        } catch (refetchError) {
          console.error("⚠️ Profile refetch failed, using optimistic update:", refetchError);
          // Fallback to optimistic update if refetch fails
          if (profile) {
            const optimisticUpdate = { 
              ...profile, 
              ...validation.sanitizedData,
              updated_at: new Date().toISOString()
            };
            setProfile(optimisticUpdate);
            setLastFetchTime(Date.now());
          }
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
      console.log("🔄 Manually refetching profile...");
      const profileData = await fetchProfile();
      if (profileData) {
        console.log("✅ Profile refetched successfully:", {
          id: profileData.id,
          name: profileData.name,
          profile_image: profileData.profile_image,
          onboarding_completed: profileData.onboarding_completed
        });
        setProfile(profileData);
        setLastFetchTime(Date.now());
        
        // Invalidate unified data service cache to ensure consistency
        unifiedDataService.invalidateCache();
      } else {
        console.warn("⚠️ No profile data returned when refetching");
      }
      return profileData;
    } catch (error) {
      console.error("❌ Error refetching profile:", error);
      toast.error("Failed to refresh your profile data");
      return null;
    }
  }, [fetchProfile]);
  
  // Add refreshProfile as an alias of refetchProfile for backward compatibility
  const refreshProfile = refetchProfile;

  // Enhanced data management functions
  const invalidateCache = useCallback(() => {
    console.log("🧹 Invalidating profile cache");
    unifiedDataService.invalidateCache();
    setLastFetchTime(null);
    // Reset profile state to force fresh fetch
    setProfile(null);
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
