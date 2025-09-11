
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

    // Helper to run an update with retries
    const updateWithRetry = async (payload: Record<string, any>, label: string) => {
      let attempts = 0;
      let lastError: any = null;
      while (attempts < 3) {
        attempts++;
        console.log(`Attempt ${attempts} to update profile (${label})`, payload);
        try {
          const { data, error } = await supabase
            .from('profiles')
            .update(payload)
            .eq('id', user.id)
            .select()
            .single();

          console.log(`🔍 Database update response (${label}):`, { data, error });
          if (error) {
            lastError = error;
            console.error(`Error updating profile (${label}) attempt ${attempts}:`, error);
            await new Promise(r => setTimeout(r, 400));
          } else {
            return data;
          }
        } catch (err) {
          lastError = err;
          console.error(`Error in update operation (${label}) attempt ${attempts}:`, err);
          await new Promise(r => setTimeout(r, 400));
        }
      }
      throw lastError || new Error(`Failed to update profile (${label})`);
    };

    try {
      setIsUpdating(true);
      setUpdateError(null);

      const hasAddressUpdate = updateData.shipping_address !== undefined;
      const hasVerificationFields = (
        updateData.address_verified !== undefined ||
        updateData.address_verification_method !== undefined ||
        updateData.address_verified_at !== undefined
      );

      // Build base and verification payloads
      const baseUpdate: Record<string, any> = {
        id: user.id,
        updated_at: new Date().toISOString()
      };
      const verifyUpdate: Record<string, any> = {
        id: user.id,
        updated_at: new Date().toISOString()
      };

      // Normalize and include shipping address if present
      if (hasAddressUpdate) {
        baseUpdate.shipping_address = normalizeShippingAddress(updateData.shipping_address);
      }

      // Normalize gift preferences if present (in base update)
      if (updateData.gift_preferences !== undefined) {
        baseUpdate.gift_preferences = Array.isArray(updateData.gift_preferences)
          ? updateData.gift_preferences.map(pref => normalizeGiftPreference(pref))
          : [];
      }

      // Split other fields into base vs verify depending on two-step condition
      const isTwoStep = hasAddressUpdate && hasVerificationFields;

      Object.keys(updateData).forEach((key) => {
        if (key === 'shipping_address' || key === 'gift_preferences') return;
        const value = (updateData as any)[key];

        if (isTwoStep && (key === 'address_verified' || key === 'address_verification_method' || key === 'address_verified_at')) {
          verifyUpdate[key] = value;
        } else {
          baseUpdate[key] = value;
        }
      });

      // Special logging for verification fields
      if (hasVerificationFields) {
        console.log('🔍 VERIFICATION FIELDS PRESENT', {
          address_verified: updateData.address_verified,
          address_verification_method: updateData.address_verification_method,
          address_verified_at: updateData.address_verified_at,
          isTwoStep
        });
      }

      // EXECUTION: If two-step required, run base update first, then verification-only update
      let finalResult: any = null;
      if (isTwoStep) {
        // Ensure base update does NOT include verification fields
        delete baseUpdate.address_verified;
        delete baseUpdate.address_verification_method;
        delete baseUpdate.address_verified_at;

        const baseRes = await updateWithRetry(baseUpdate, 'base (address + non-verification)');

        // Now apply verification-only fields
        const verifyPayload: Record<string, any> = { ...verifyUpdate };
        // Safety: do not send shipping_address again
        delete verifyPayload.shipping_address;

        const verifyRes = await updateWithRetry(verifyPayload, 'verification-only');
        finalResult = { ...baseRes, ...verifyRes };
      } else {
        // Single update path
        const singlePayload = { ...baseUpdate };
        const res = await updateWithRetry(singlePayload, 'single');
        finalResult = res;
      }

      toast.success('Profile updated successfully');
      return finalResult;
    } catch (err) {
      console.error('Error updating profile:', err);
      setUpdateError(err instanceof Error ? err : new Error('Failed to update profile'));
      toast.error('Failed to update profile');
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
