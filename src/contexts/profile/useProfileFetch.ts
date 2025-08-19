
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
      
      // Add cache-busting parameter to ensure fresh data
      const timestamp = Date.now();
      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          *,
          wishlist_count:wishlists(count),
          connection_count:user_connections!user_connections_user_id_fkey(count),
          connected_count:user_connections!user_connections_connected_user_id_fkey(count)
        `)
        .eq('id', user.id)
        .eq('user_connections.status', 'accepted')
        .eq('user_connections.status', 'accepted')
        .single();

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
        gift_preferences: profile.gift_preferences || [],
        important_dates: profile.important_dates || [],
        data_sharing_settings: profile.data_sharing_settings || {
          dob: 'private',
          shipping_address: 'private', 
          gift_preferences: 'friends',
          email: 'private'
        },
        // Extract the actual count from the Supabase count aggregation result
        wishlist_count: (() => {
          const countData = (profile as any).wishlist_count;
          if (Array.isArray(countData) && countData.length > 0 && typeof countData[0].count === 'number') {
            return countData[0].count;
          }
          return 0;
        })(),
        // Extract connection count (sum of both directions for bidirectional connections)
        connection_count: (() => {
          const userConnectionData = (profile as any).connection_count;
          const connectedConnectionData = (profile as any).connected_count;
          
          let userCount = 0;
          if (Array.isArray(userConnectionData) && userConnectionData.length > 0 && typeof userConnectionData[0].count === 'number') {
            userCount = userConnectionData[0].count;
          }
          
          let connectedCount = 0;
          if (Array.isArray(connectedConnectionData) && connectedConnectionData.length > 0 && typeof connectedConnectionData[0].count === 'number') {
            connectedCount = connectedConnectionData[0].count;
          }
          
          return userCount + connectedCount;
        })()
      };

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
