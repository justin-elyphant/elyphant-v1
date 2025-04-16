
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
        console.log("Profile data loaded:", JSON.stringify(data, null, 2));
        console.log("Keys in profile:", Object.keys(data));
        console.log("Has gift_preferences:", !!data.gift_preferences, "Length:", data.gift_preferences?.length || 0);
        console.log("Has shipping_address:", !!data.shipping_address);
        console.log("Has dob:", !!data.dob);
        console.log("Has username:", !!data.username);
        console.log("Has bio:", !!data.bio);
        console.log("Has important_dates:", !!data.important_dates);
        
        // Ensure all expected fields have valid values
        const safeProfile = {
          ...data,
          gift_preferences: data.gift_preferences || [],
          shipping_address: data.shipping_address || {
            street: "",
            city: "",
            state: "",
            zipCode: "",
            country: ""
          },
          data_sharing_settings: data.data_sharing_settings || {
            dob: "friends",
            shipping_address: "private",
            gift_preferences: "public"
          },
          important_dates: data.important_dates || []
        };
        
        setProfile(safeProfile);
      } else {
        console.warn("No profile found for user:", user.id);
        
        // Create a minimal profile object if no profile is found
        const minimalProfile: Profile = {
          id: user.id,
          name: user.user_metadata?.name || user.email?.split('@')[0] || "",
          email: user.email || "",
          username: (user.user_metadata?.name || user.email?.split('@')[0] || "").toLowerCase().replace(/\s+/g, '_'),
          profile_image: null,
          bio: user.user_metadata?.name ? `Hi, I'm ${user.user_metadata.name}` : "",
          shipping_address: {
            street: "",
            city: "",
            state: "",
            zipCode: "",
            country: ""
          },
          gift_preferences: [],
          important_dates: [],
          data_sharing_settings: {
            dob: "friends",
            shipping_address: "private",
            gift_preferences: "public"
          }
        };
        
        setProfile(minimalProfile);
        
        // Try to persist this profile to the database
        try {
          const { error: upsertError } = await supabase
            .from('profiles')
            .upsert(minimalProfile);
            
          if (upsertError) {
            console.error("Failed to create minimal profile:", upsertError);
          } else {
            console.log("Created minimal profile in database");
          }
        } catch (e) {
          console.error("Failed to create minimal profile:", e);
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
      console.log("Updating profile with data:", JSON.stringify(updateData, null, 2));
      
      // Make sure to set the id for proper RLS policy evaluation
      const dataWithId = {
        ...updateData,
        id: user.id,
        updated_at: new Date().toISOString()
      };
      
      console.log("PROFILE CONTEXT: EXACT UPDATE PAYLOAD:", JSON.stringify(dataWithId, null, 2));
      console.log("User ID for RLS:", user.id);
      
      // Try multiple times to update the profile
      let attempts = 0;
      let success = false;
      
      while (attempts < 3 && !success) {
        attempts++;
        console.log(`PROFILE CONTEXT: Attempt ${attempts} to update profile`);
        
        try {
          const { error: updateError } = await supabase
            .from('profiles')
            .upsert(dataWithId, {
              onConflict: 'id'
            });

          if (updateError) {
            console.error(`PROFILE CONTEXT: Error updating profile (attempt ${attempts}):`, updateError);
            if (attempts === 3) throw updateError;
          } else {
            console.log("Profile updated successfully");
            success = true;
          }
        } catch (error) {
          console.error(`PROFILE CONTEXT: Error in upsert operation (attempt ${attempts}):`, error);
          // On last attempt, throw to exit the while loop
          if (attempts === 3) throw error;
          // Otherwise wait and try again
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      if (success) {
        await fetchProfile(); // Refresh profile data
        toast.success("Profile updated successfully");
      } else {
        throw new Error("Failed to update profile after multiple attempts");
      }
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
