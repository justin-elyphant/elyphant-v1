
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types/supabase";

interface ProfileContextType {
  profile: Profile | null;
  loading: boolean;
  error: Error | null;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  refetchProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching profile for user ID:", user.id);
      
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (fetchError) {
        console.error("Error fetching profile:", fetchError);
        throw fetchError;
      }
      
      // If we have a profile, update the state
      if (data) {
        console.log("Profile data loaded:", data);
        setProfile(data);
      } else {
        console.warn("No profile found for user:", user.id);
        
        // Check if we have profile data in localStorage that we can use
        const userName = localStorage.getItem("userName");
        const userEmail = localStorage.getItem("userEmail");
        
        // If we have stored profile data from signup/onboarding, create a minimal profile
        if (userName || userEmail) {
          console.log("Creating minimal profile from localStorage data");
          const minimalProfile: Profile = {
            id: user.id,
            name: userName || user.user_metadata?.name || "",
            email: userEmail || user.email || "",
            username: userName ? userName.toLowerCase().replace(/\s+/g, '_') : "",
            profile_image: null,
            bio: userName ? `Hi, I'm ${userName}` : "",
            interests: []
          };
          
          setProfile(minimalProfile);
          
          // Try to persist this profile to the database
          try {
            await supabase
              .from('profiles')
              .upsert(minimalProfile)
              .eq('id', user.id);
            console.log("Created minimal profile in database");
          } catch (e) {
            console.error("Failed to create minimal profile:", e);
          }
        } else {
          // No profile and no stored data
          setProfile(null);
        }
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError(err instanceof Error ? err : new Error('Failed to fetch profile'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateProfile = useCallback(async (updateData: Partial<Profile>) => {
    if (!user) {
      toast.error("You must be logged in to update your profile");
      return;
    }

    try {
      setLoading(true);
      console.log("Updating profile with data:", updateData);
      
      // Make sure to set the id for proper RLS policy evaluation
      const dataWithId = {
        ...updateData,
        id: user.id,
        updated_at: new Date().toISOString()
      };
      
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert(dataWithId, {
          onConflict: 'id'
        });

      if (updateError) {
        console.error("Error updating profile:", updateError);
        throw updateError;
      }
      
      await fetchProfile(); // Refresh profile data
      toast.success("Profile updated successfully");
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error("Failed to update profile");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, fetchProfile]);

  // Fetch profile when auth state changes
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Also fetch profile data if we have localStorage flags indicating a new signup
  useEffect(() => {
    if (localStorage.getItem("newSignUp") === "true" && user) {
      console.log("Detected new signup, fetching profile data");
      fetchProfile();
    }
  }, [user, fetchProfile]);

  const value = {
    profile,
    loading,
    error,
    updateProfile,
    refetchProfile: fetchProfile
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
