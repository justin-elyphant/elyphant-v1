
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

    // Helper to run an upsert with retries (handles both new and existing profiles)
    const upsertWithRetry = async (payload: Record<string, any>, label: string) => {
      let attempts = 0;
      let lastError: any = null;
      while (attempts < 3) {
        attempts++;
        console.log(`Attempt ${attempts} to upsert profile (${label})`, payload);
        try {
          // Ensure id is always included in the payload for upsert
          const upsertPayload = { ...payload, id: user.id };
          
          const { data, error } = await supabase
            .from('profiles')
            .upsert(upsertPayload as any)
            .select()
            .single();

          console.log(`🔍 Database upsert response (${label}):`, { data, error });
          if (error) {
            lastError = error;
            console.error(`Error upserting profile (${label}) attempt ${attempts}:`, error);
            await new Promise(r => setTimeout(r, 400));
          } else {
            return data;
          }
        } catch (err) {
          lastError = err;
          console.error(`Error in upsert operation (${label}) attempt ${attempts}:`, err);
          await new Promise(r => setTimeout(r, 400));
        }
      }
      throw lastError || new Error(`Failed to upsert profile (${label})`);
    };

    try {
      setIsUpdating(true);
      setUpdateError(null);

      // PHASE 1: Sync interests to gift_preferences for backwards compatibility (TRANSITION PERIOD)
      // NOTE: gift_preferences is DEPRECATED - interests is now the single source of truth
      // Create a mutable copy to avoid mutation issues
      const mutableUpdateData = { ...updateData };
      
      if (mutableUpdateData.interests && Array.isArray(mutableUpdateData.interests)) {
        console.log('🔄 [TRANSITION] Syncing interests to gift_preferences for backwards compatibility');
        mutableUpdateData.gift_preferences = mutableUpdateData.interests.map(interest => ({
          category: interest,
          importance: 'medium' as const
        }));
      }

      const hasAddressUpdate = mutableUpdateData.shipping_address !== undefined;
      const hasVerificationFields = (
        mutableUpdateData.address_verified !== undefined ||
        mutableUpdateData.address_verification_method !== undefined ||
        mutableUpdateData.address_verified_at !== undefined
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
        baseUpdate.shipping_address = normalizeShippingAddress(mutableUpdateData.shipping_address);
      }

      // Normalize gift preferences if present (in base update)
      if (mutableUpdateData.gift_preferences !== undefined) {
        baseUpdate.gift_preferences = Array.isArray(mutableUpdateData.gift_preferences)
          ? mutableUpdateData.gift_preferences.map(pref => normalizeGiftPreference(pref))
          : [];
      }

      // Split other fields into base vs verify depending on two-step condition
      const isTwoStep = hasAddressUpdate && hasVerificationFields;

      Object.keys(mutableUpdateData).forEach((key) => {
        if (key === 'shipping_address' || key === 'gift_preferences') return;
        const value = (mutableUpdateData as any)[key];

        if (isTwoStep && (key === 'address_verified' || key === 'address_verification_method' || key === 'address_verified_at')) {
          verifyUpdate[key] = value;
        } else {
          baseUpdate[key] = value;
        }
      });

      // Special logging for verification fields
      if (hasVerificationFields) {
        console.log('🔍 VERIFICATION FIELDS PRESENT', {
          address_verified: mutableUpdateData.address_verified,
          address_verification_method: mutableUpdateData.address_verification_method,
          address_verified_at: mutableUpdateData.address_verified_at,
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

        const baseRes = await upsertWithRetry(baseUpdate, 'base (address + non-verification)');

        // Now apply verification-only fields
        const verifyPayload: Record<string, any> = { ...verifyUpdate };
        // Safety: do not send shipping_address again
        delete verifyPayload.shipping_address;

        const verifyRes = await upsertWithRetry(verifyPayload, 'verification-only');
        finalResult = { ...baseRes, ...verifyRes };
      } else {
        // Single upsert path
        const singlePayload = { ...baseUpdate };
        const res = await upsertWithRetry(singlePayload, 'single');
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
