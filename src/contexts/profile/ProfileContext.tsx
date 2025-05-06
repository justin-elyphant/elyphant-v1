
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useProfileFetch } from './useProfileFetch';
import { useProfileUpdate } from './useProfileUpdate';
import { Profile } from "@/types/supabase";

interface ProfileContextType {
  profile: Profile | null;
  loading: boolean;
  error: Error | null;
  updateProfile: (data: Partial<Profile>) => Promise<any>;
  refetchProfile: () => Promise<Profile | null>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { fetchProfile, loading: isFetching, error: fetchError } = useProfileFetch();
  const { updateProfile, isUpdating, updateError } = useProfileUpdate();
  const [profile, setProfile] = useState<Profile | null>(null);

  // Combined loading and error states
  const loading = isFetching || isUpdating;
  const error = fetchError || updateError;

  // Fetch profile data when auth state changes
  useEffect(() => {
    const loadProfile = async () => {
      const profileData = await fetchProfile();
      if (profileData) {
        setProfile(profileData);
      }
    };
    
    loadProfile();
  }, [fetchProfile]);

  // Also fetch profile data if we have localStorage flags indicating a new signup
  useEffect(() => {
    if (localStorage.getItem("newSignUp") === "true") {
      console.log("Detected new signup, fetching profile data");
      fetchProfile().then(profileData => {
        if (profileData) {
          setProfile(profileData);
        }
      });
    }
  }, [fetchProfile]);

  // Wrapper for updating the profile that also updates local state
  const handleUpdateProfile = async (data: Partial<Profile>) => {
    const result = await updateProfile(data);
    
    if (result) {
      // Update the local profile state with the new data
      const updatedProfile = await fetchProfile();
      if (updatedProfile) {
        setProfile(updatedProfile);
      }
    }
    
    return result;
  };

  // Wrapper for refetching the profile
  const refetchProfile = async () => {
    const profileData = await fetchProfile();
    if (profileData) {
      setProfile(profileData);
    }
    return profileData;
  };

  const value = {
    profile,
    loading,
    error,
    updateProfile: handleUpdateProfile,
    refetchProfile
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
