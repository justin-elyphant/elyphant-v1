
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { Profile } from '@/types/supabase';
import { toast } from 'sonner';
import { ensureProfileDataConsistency } from '@/utils/profileDataMigration';

export function useProfileFetch() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = useCallback(async (): Promise<Profile | null> => {
    if (!user?.id) {
      console.log("useProfileFetch: No authenticated user found");
      setLoading(false);
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      console.log("useProfileFetch: Fetching profile for user:", user.id);
      
      // Fetch profile with simple query to avoid 400 errors
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        setError(error);
        return null;
      }

      if (!profile) {
        console.log("No profile found for user:", user.id);
        return null;
      }

      console.log("Profile fetched successfully:", profile);
      
      // Ensure profile data consistency (fix any missing fields)
      await ensureProfileDataConsistency(user.id);
      
      // Add the user_id field that's expected by certain components
      const enhancedProfile: Profile = {
        ...profile,
        user_id: user.id,  // Add user_id based on id to match expectations
        gift_preferences: Array.isArray(profile.gift_preferences) ? profile.gift_preferences as any[] : 
          (profile.gift_preferences ? [profile.gift_preferences] as any[] : [] as any[]),
        important_dates: Array.isArray(profile.important_dates) ? profile.important_dates as any[] :
          (profile.important_dates ? [profile.important_dates] as any[] : [] as any[]),
        data_sharing_settings: (typeof profile.data_sharing_settings === 'object' && profile.data_sharing_settings) ? profile.data_sharing_settings as any : {
          dob: 'private',
          shipping_address: 'private', 
          gift_preferences: 'friends',
          email: 'private'
        },
      } as Profile;
      
      // Set counts to 0 (fetch separately if needed)
      (enhancedProfile as any).wishlist_count = 0;
      (enhancedProfile as any).connection_count = 0;

      return enhancedProfile;
    } catch (error) {
      console.error("Unexpected error fetching profile:", error);
      setError(error instanceof Error ? error : new Error(String(error)));
      toast.error("Failed to fetch profile data");
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  return {
    fetchProfile,
    loading,
    error
  };
}
