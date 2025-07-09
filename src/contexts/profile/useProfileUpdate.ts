
import { useState, useCallback } from 'react';
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { normalizeGiftPreference, normalizeShippingAddress } from "@/types/profile";
import type { Profile } from "@/types/profile";

export const useProfileUpdate = () => {
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<Error | null>(null);

  const updateProfile = useCallback(async (updateData: Partial<Profile>) => {
    if (!user) {
      toast.error("You must be logged in to update your profile");
      return null;
    }

    try {
      setIsUpdating(true);
      setUpdateError(null);
      
      // Ensure shipping_address has all required fields
      const safeShippingAddress = normalizeShippingAddress(updateData.shipping_address);

      // Format gift preferences to ensure it's an array of objects with proper type
      const safeGiftPreferences = Array.isArray(updateData.gift_preferences) 
        ? updateData.gift_preferences.map(pref => normalizeGiftPreference(pref))
        : [];
      
      const dataWithId = {
        ...updateData,
        id: user.id,
        shipping_address: safeShippingAddress,
        gift_preferences: safeGiftPreferences,
        updated_at: new Date().toISOString()
      };

      console.log("Update payload:", JSON.stringify(dataWithId, null, 2));
      
      // Use a more resilient update approach with retry logic
      let attempts = 0;
      let success = false;
      let result = null;
      
      while (attempts < 3 && !success) {
        attempts++;
        console.log(`Attempt ${attempts} to update profile`);
        
        try {
          const { data, error } = await supabase
            .from('profiles')
            .upsert(dataWithId, {
              onConflict: 'id'
            })
            .select()
            .single();

          if (error) {
            console.error(`Error updating profile (attempt ${attempts}):`, error);
            if (attempts === 3) throw error;
          } else {
            console.log("Profile updated successfully:", data);
            success = true;
            result = data;
          }
        } catch (error) {
          console.error(`Error in upsert operation (attempt ${attempts}):`, error);
          if (attempts === 3) throw error;
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      if (success) {
        toast.success("Profile updated successfully");
        return result;
      } else {
        throw new Error("Failed to update profile after multiple attempts");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setUpdateError(err instanceof Error ? err : new Error('Failed to update profile'));
      toast.error("Failed to update profile");
      return null;
    } finally {
      setIsUpdating(false);
    }
  }, [user]);

  return {
    updateProfile,
    isUpdating,
    updateError
  };
};
