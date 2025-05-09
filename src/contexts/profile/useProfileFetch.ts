
import { useState, useCallback } from 'react';
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { normalizeGiftPreference, normalizeShippingAddress } from "@/types/profile";
import { normalizeDataSharingSettings as normalizeSettings } from "@/utils/privacyUtils";
import type { Profile } from "@/types/profile";

export const useProfileFetch = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      return null;
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
      
      // If we have a profile, normalize and return it
      if (data) {
        console.log("Profile data loaded:", JSON.stringify(data, null, 2));
        
        // Ensure all expected fields have valid values
        const safeProfile = {
          ...data,
          gift_preferences: Array.isArray(data.gift_preferences) 
            ? data.gift_preferences.map(normalizeGiftPreference)
            : [],
          shipping_address: normalizeShippingAddress(data.shipping_address),
          data_sharing_settings: normalizeSettings(data.data_sharing_settings),
          important_dates: Array.isArray(data.important_dates) ? data.important_dates : []
        };
        
        return safeProfile;
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
          shipping_address: normalizeShippingAddress(null),
          gift_preferences: [],
          important_dates: [],
          data_sharing_settings: normalizeSettings(null)
        };
        
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
        
        return minimalProfile;
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError(err instanceof Error ? err : new Error('Failed to fetch profile'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    fetchProfile,
    loading,
    error
  };
};
