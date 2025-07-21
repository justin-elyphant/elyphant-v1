
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useProfileFetch } from './useProfileFetch';
import { useProfileUpdate } from './useProfileUpdate';
import { ProfileDataValidator } from './ProfileDataValidator';
import { Profile } from "@/types/supabase";
import { toast } from 'sonner';
import { unifiedDataService } from '@/services/unified/UnifiedDataService';
import { useAuth } from '@/contexts/auth';

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
  const { user } = useAuth();
  const { fetchProfile, loading: isFetching, error: fetchError } = useProfileFetch();
  const { updateProfile, isUpdating, updateError } = useProfileUpdate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);

  // Combined loading and error states - only show loading if actively fetching/updating AND no profile data
  const loading = (isFetching || isUpdating) && !profile;
  const error = fetchError || updateError;

  // Load profile data - properly depend on user and fetchProfile
  useEffect(() => {
    let isActive = true;
    
    const loadProfile = async () => {
      // Only proceed if we have a user
      if (!user?.id) {
        console.log("ProfileContext: No user available, skipping profile fetch");
        if (isActive) {
          setProfile(null);
        }
        return;
      }

      try {
        console.log("ProfileContext: Loading profile data for user:", user.id);
        
        if (typeof fetchProfile !== 'function') {
          console.warn("ProfileContext: fetchProfile is not available yet");
          return;
        }
        
        const profileData = await fetchProfile();
        
        if (isActive && profileData) {
          console.log("ProfileContext: Profile loaded successfully:", {
            id: profileData.id,
            name: profileData.name,
            email: profileData.email,
            username: profileData.username
          });
          setProfile(profileData);
          setLastFetchTime(Date.now());
          
          localStorage.removeItem("newSignUp");
          localStorage.removeItem("profileSetupLoading");
        } else if (isActive && profileData === null) {
          console.warn("ProfileContext: No profile data returned");
          setLastFetchTime(Date.now());
        }
      } catch (error) {
        console.error("ProfileContext: Error loading profile:", error);
        if (isActive) {
          setLastFetchTime(Date.now());
        }
      }
    };

    // Only load if we have a user, add small delay for auth initialization
    if (user?.id) {
      const timeoutId = setTimeout(loadProfile, 100);
      return () => {
        isActive = false;
        clearTimeout(timeoutId);
      };
    } else {
      // Clear profile if no user
      setProfile(null);
    }

    return () => {
      isActive = false;
    };
  }, [user?.id, fetchProfile]);

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
