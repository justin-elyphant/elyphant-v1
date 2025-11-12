
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
      
      // FETCH CURRENT PROFILE FIRST to ensure all NOT NULL fields are present
      console.log(`🔍 Fetching current profile before upsert (${label})`);
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (fetchError) {
        console.warn(`⚠️ Could not fetch existing profile (${label}):`, fetchError);
      } else if (existingProfile) {
        console.log(`✅ Fetched existing profile (${label}) - merging with update payload`);
      } else {
        console.log(`ℹ️ No existing profile found (${label}) - will create new one`);
      }
      
      while (attempts < 3) {
        attempts++;
        console.log(`Attempt ${attempts} to upsert profile (${label})`, payload);
        try {
          // Merge with existing profile data to ensure all NOT NULL fields are present
          const upsertPayload = existingProfile
            ? { ...existingProfile, ...payload, id: user.id }
            : { ...payload, id: user.id };
          
          console.log(`📦 Complete upsert payload (${label}):`, {
            hasFirstName: !!(upsertPayload as any).first_name,
            hasLastName: !!(upsertPayload as any).last_name,
            hasEmail: !!(upsertPayload as any).email,
            hasUsername: !!(upsertPayload as any).username,
            updateFields: Object.keys(payload)
          });
          
          const { data, error } = await supabase
            .from('profiles')
            .upsert(upsertPayload as any)
            .select()
            .maybeSingle();

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
      
      // Normalize DOB to MM-DD format (database expects this format)
      if (mutableUpdateData.dob) {
        try {
          const rawDob = mutableUpdateData.dob;
          let dateObj: Date | null = null;

          // Convert input to Date object
          if (rawDob instanceof Date) {
            dateObj = rawDob;
          } else if (typeof rawDob === 'string') {
            // If already MM-DD format, keep it
            if (/^\d{2}-\d{2}$/.test(rawDob)) {
              console.log('✅ DOB already in MM-DD format:', rawDob);
              // Keep as-is, but ensure birth_year is set if available
              if (!mutableUpdateData.birth_year && typeof mutableUpdateData.birth_year !== 'number') {
                console.warn('⚠️ MM-DD dob without birth_year - keeping dob but may cause issues');
              }
              dateObj = null; // Skip conversion
            } else if (!isNaN(Date.parse(rawDob))) {
              // Parse ISO string or other valid date string
              dateObj = new Date(rawDob);
            } else {
              console.warn('⚠️ Invalid dob format, removing from payload:', rawDob);
              delete mutableUpdateData.dob;
              dateObj = null;
            }
          }

          // Convert Date object to MM-DD format
          if (dateObj) {
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            mutableUpdateData.dob = `${month}-${day}`;
            
            // Set birth_year if not already set
            if (!mutableUpdateData.birth_year) {
              mutableUpdateData.birth_year = dateObj.getFullYear();
            }
            
            console.log('✅ DOB normalized to MM-DD:', mutableUpdateData.dob, 'birth_year:', mutableUpdateData.birth_year);
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

      // Build base update
      const baseUpdate: Record<string, any> = {
        id: user.id,
        updated_at: new Date().toISOString()
      };

      // Normalize and include shipping address if present
      const shipping_address: Record<string, any> = {};
      if (hasAddressUpdate) {
        shipping_address.shipping_address = normalizeShippingAddress(mutableUpdateData.shipping_address);
      }

      // Normalize gift preferences if present
      const gift_preferences: Record<string, any> = {};
      if (mutableUpdateData.gift_preferences !== undefined) {
        gift_preferences.gift_preferences = Array.isArray(mutableUpdateData.gift_preferences)
          ? mutableUpdateData.gift_preferences.map(pref => normalizeGiftPreference(pref))
          : [];
      }

      // Build all fields into base update (no more two-step split)
      Object.keys(mutableUpdateData).forEach((key) => {
        if (key === 'shipping_address' || key === 'gift_preferences') return;
        baseUpdate[key] = (mutableUpdateData as any)[key];
      });

      // Build single payload with all fields
      const updatePayload: Record<string, any> = {
        ...baseUpdate,
        ...gift_preferences,
        ...shipping_address,
      };

      // Conditionally include verification fields if address is verified
      if (hasAddressUpdate && mutableUpdateData.address_verified === true) {
        const method = mutableUpdateData.address_verification_method;
        
        // Only include verification fields if method is valid
        if (method === 'automatic' || method === 'user_confirmed') {
          updatePayload.address_verified = true;
          updatePayload.address_verification_method = method;
          updatePayload.address_verified_at = mutableUpdateData.address_verified_at;
          updatePayload.address_last_updated = mutableUpdateData.address_last_updated;
          
          console.log('✅ Including address verification fields in update', { method });
        } else {
          console.warn(`⚠️ Invalid verification method '${method}' - omitting verification fields`);
          updatePayload.address_last_updated = new Date().toISOString();
        }
      } else if (hasAddressUpdate) {
        // Address updated but not verified - only update timestamp
        updatePayload.address_last_updated = new Date().toISOString();
      }

      // Special logging for verification fields
      if (hasVerificationFields) {
        console.log('🔍 VERIFICATION FIELDS in final payload', {
          address_verified: updatePayload.address_verified,
          address_verification_method: updatePayload.address_verification_method,
          address_verified_at: updatePayload.address_verified_at,
        });
      }

      // DETAILED LOGGING: Final payload before database operation
      console.log("📤 FINAL PAYLOAD being sent to database:", JSON.stringify(updatePayload, null, 2));
      console.log("📤 Critical fields check:", {
        has_dob: !!updatePayload.dob,
        has_shipping_address: !!updatePayload.shipping_address,
        has_interests: !!updatePayload.interests,
        has_onboarding_completed: !!updatePayload.onboarding_completed
      });

      // Single upsert with all data
      const finalResult = await upsertWithRetry(updatePayload, 'complete-profile');

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
