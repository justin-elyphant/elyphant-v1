
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
      
      // Prepare the update payload, only including fields that are being updated
      const safeUpdateData: Record<string, any> = {
        id: user.id,
        updated_at: new Date().toISOString()
      };

      // Only process and add shipping_address if it's being updated
      if (updateData.shipping_address !== undefined) {
        safeUpdateData.shipping_address = normalizeShippingAddress(updateData.shipping_address);
      }

      // Only process and add gift_preferences if it's being updated
      if (updateData.gift_preferences !== undefined) {
        safeUpdateData.gift_preferences = Array.isArray(updateData.gift_preferences) 
          ? updateData.gift_preferences.map(pref => normalizeGiftPreference(pref))
          : [];
      }

      // Add other fields that are being updated (including verification fields)
      Object.keys(updateData).forEach(key => {
        if (key !== 'shipping_address' && key !== 'gift_preferences') {
          const value = updateData[key as keyof Profile];
          console.log(`🔍 Processing field '${key}':`, value);
          safeUpdateData[key] = value;
        }
      });

      // Special logging for verification fields
      if (updateData.address_verified !== undefined) {
        console.log(`🔍 VERIFICATION FIELD - address_verified:`, updateData.address_verified);
      }
      if (updateData.address_verification_method !== undefined) {
        console.log(`🔍 VERIFICATION FIELD - address_verification_method:`, updateData.address_verification_method);
      }
      if (updateData.address_verified_at !== undefined) {
        console.log(`🔍 VERIFICATION FIELD - address_verified_at:`, updateData.address_verified_at);
      }

      console.log("Update payload:", JSON.stringify(safeUpdateData, null, 2));
      
      // Use UPDATE instead of UPSERT to avoid null constraint violations
      let attempts = 0;
      let success = false;
      let result = null;
      
      while (attempts < 3 && !success) {
        attempts++;
        console.log(`Attempt ${attempts} to update profile`);
        
        try {
          const { data, error } = await supabase
            .from('profiles')
            .update(safeUpdateData)
            .eq('id', user.id)
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
          console.error(`Error in update operation (attempt ${attempts}):`, error);
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
