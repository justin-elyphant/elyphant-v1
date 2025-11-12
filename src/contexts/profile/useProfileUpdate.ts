
import { useState, useCallback, useRef } from 'react';
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { normalizeGiftPreference, normalizeShippingAddress } from "@/types/profile";
import type { Profile } from "@/types/profile";

export const useProfileUpdate = () => {
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<Error | null>(null);
  
  // Concurrency control to prevent race conditions
  const updateLockRef = useRef(false);
  const updateQueueRef = useRef<Array<{ data: Partial<Profile>; resolve: (value: any) => void; reject: (error: any) => void }>>([]);

  const updateProfile = useCallback(async (updateData: Partial<Profile>, options?: { skipLegacyMapping?: boolean }) => {
    if (!user) {
      toast.error("You must be logged in to update your profile");
      return null;
    }

    // If an update is already in progress, queue this one
    if (updateLockRef.current) {
      console.log('⏳ Update already in progress - queuing this update');
      return new Promise((resolve, reject) => {
        updateQueueRef.current.push({ data: updateData, resolve, reject });
      });
    }

    // Acquire lock
    updateLockRef.current = true;
    console.log('🔒 Acquired update lock');

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
            
            // Don't retry on conflict or bad request - these indicate concurrent operations or validation failures
            const errorCode = error.code || (error as any).status;
            if (errorCode === '409' || errorCode === 409 || errorCode === '400' || errorCode === 400) {
              console.log(`❌ Non-retryable error (${errorCode}) - aborting retry loop`);
              throw error;
            }
            
            // Increased delay to reduce overlap
            await new Promise(r => setTimeout(r, 1000));
          } else {
            return data;
          }
        } catch (err) {
          lastError = err;
          console.error(`Error in upsert operation (${label}) attempt ${attempts}:`, err);
          
          // Don't retry on conflict or bad request
          const errorCode = (err as any)?.code || (err as any)?.status;
          if (errorCode === '409' || errorCode === 409 || errorCode === '400' || errorCode === 400) {
            console.log(`❌ Non-retryable error (${errorCode}) - throwing immediately`);
            throw err;
          }
          
          await new Promise(r => setTimeout(r, 1000));
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
      const mutableUpdateData = { ...updateData } as Record<string, any>;
      
      // Normalize DOB before any payload building to prevent Postgres date errors
      if (mutableUpdateData.dob) {
        try {
          const rawDob = mutableUpdateData.dob;
          const by = mutableUpdateData.birth_year;
          let normalizedDob: string | null = null;

          if (rawDob instanceof Date) {
            normalizedDob = rawDob.toISOString();
          } else if (typeof rawDob === 'string') {
            // MM-DD pattern
            const mmddMatch = /^\d{2}-\d{2}$/.test(rawDob);
            const isoParsable = !isNaN(Date.parse(rawDob));
            if (mmddMatch && by && typeof by === 'number') {
              const [mm, dd] = rawDob.split('-').map((s) => parseInt(s, 10));
              const d = new Date(by, (mm || 1) - 1, dd || 1);
              normalizedDob = d.toISOString();
            } else if (isoParsable) {
              normalizedDob = new Date(rawDob).toISOString();
            } else {
              console.warn('⚠️ Invalid dob format, removing from payload:', rawDob);
              normalizedDob = null;
            }
          }

          if (normalizedDob) {
            mutableUpdateData.dob = normalizedDob;
          } else {
            delete mutableUpdateData.dob;
          }
        } catch (e) {
          console.warn('⚠️ Failed to normalize dob, removing from payload:', mutableUpdateData.dob, e);
          delete mutableUpdateData.dob;
        }
      }
      
      // Skip legacy mapping if explicitly requested (e.g., interests-only saves during onboarding)
      if (!options?.skipLegacyMapping && mutableUpdateData.interests && Array.isArray(mutableUpdateData.interests)) {
        console.log('🔄 [TRANSITION] Syncing interests to gift_preferences for backwards compatibility');
        mutableUpdateData.gift_preferences = mutableUpdateData.interests.map(interest => ({
          category: interest,
          importance: 'medium' as const
        }));
      } else if (options?.skipLegacyMapping) {
        console.log('⏭️  Skipping legacy gift_preferences mapping as requested');
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
      // Only use two-step if we have address update, address is verified, AND we have valid verification method
      const isTwoStep = hasAddressUpdate && 
                        mutableUpdateData.address_verified === true && 
                        (mutableUpdateData.address_verification_method === 'automatic' || 
                         mutableUpdateData.address_verification_method === 'user_confirmed');

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
        
        // Validate verification method - only allow 'automatic' or 'user_confirmed'
        const method = verifyPayload.address_verification_method;
        if (method && method !== 'automatic' && method !== 'user_confirmed') {
          console.warn(`⚠️ Invalid verification method '${method}' - omitting verification fields`);
          delete verifyPayload.address_verified;
          delete verifyPayload.address_verification_method;
          delete verifyPayload.address_verified_at;
        }

        // Only run verify-only upsert if we actually have verification fields to send
        if (Object.keys(verifyPayload).length === 0) {
          console.log('⏭️ Skipping verify-only upsert - no valid verification fields');
          finalResult = baseRes;
        } else {
          const verifyRes = await upsertWithRetry(verifyPayload, 'verification-only');
          finalResult = { ...baseRes, ...verifyRes };
        }
      } else {
        // Single upsert path - CRITICAL: Strip out verification fields if address_verified is false
        // This prevents constraint violations from invalid verification states
        const singlePayload = { ...baseUpdate };
        
        // If address_verified is explicitly false or undefined, remove ALL verification fields
        if (!singlePayload.address_verified) {
          console.log('⚠️ address_verified is false/undefined - stripping verification fields to prevent constraint violation');
          delete singlePayload.address_verified;
          delete singlePayload.address_verification_method;
          delete singlePayload.address_verified_at;
        } else {
          // Validate verification method even when address_verified is true
          const method = singlePayload.address_verification_method;
          if (method && method !== 'automatic' && method !== 'user_confirmed') {
            console.warn(`⚠️ Invalid verification method '${method}' in single path - stripping all verification fields`);
            delete singlePayload.address_verified;
            delete singlePayload.address_verification_method;
            delete singlePayload.address_verified_at;
          }
        }
        
        // DETAILED LOGGING: Final payload before database operation
        console.log("📤 FINAL PAYLOAD being sent to database:", JSON.stringify(singlePayload, null, 2));
        console.log("📤 Critical fields check:", {
          has_dob: !!singlePayload.dob,
          has_shipping_address: !!singlePayload.shipping_address,
          has_interests: !!singlePayload.interests,
          has_onboarding_completed: !!singlePayload.onboarding_completed
        });
        
        const res = await upsertWithRetry(singlePayload, 'single');
        finalResult = res;
      }

      toast.success('Profile updated successfully');
      
      // Process next queued update if any
      const nextUpdate = updateQueueRef.current.shift();
      if (nextUpdate) {
        console.log('📋 Processing next queued update');
        setImmediate(() => {
          updateProfile(nextUpdate.data)
            .then(nextUpdate.resolve)
            .catch(nextUpdate.reject);
        });
      }
      
      return finalResult;
    } catch (err) {
      console.error('Error updating profile:', err);
      setUpdateError(err instanceof Error ? err : new Error('Failed to update profile'));
      toast.error('Failed to update profile');
      
      // Process next queued update even on error
      const nextUpdate = updateQueueRef.current.shift();
      if (nextUpdate) {
        console.log('📋 Processing next queued update after error');
        setImmediate(() => {
          updateProfile(nextUpdate.data)
            .then(nextUpdate.resolve)
            .catch(nextUpdate.reject);
        });
      }
      
      return null;
    } finally {
      setIsUpdating(false);
      // Release lock
      updateLockRef.current = false;
      console.log('🔓 Released update lock');
    }
  }, [user]);

  return {
    updateProfile,
    isUpdating,
    updateError
  };
};
