import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import { unifiedProfileService, UnifiedProfileData } from '@/services/profiles/UnifiedProfileService';

export interface UseUnifiedProfileReturn {
  profile: UnifiedProfileData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateProfile: (updates: Partial<UnifiedProfileData>) => Promise<{ success: boolean; error?: string }>;
  hasCompletedOnboarding: boolean;
  profileType: string | null;
}

/**
 * UNIFIED PROFILE HOOK
 * 
 * Primary hook for all profile operations. Replaces scattered profile hooks.
 * 
 * Features:
 * - Centralized profile state management
 * - Automatic caching and invalidation
 * - Consistent error handling
 * - Onboarding status tracking
 */
export const useUnifiedProfile = (): UseUnifiedProfileReturn => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UnifiedProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log("🔄 Unified profile refetch for user:", user.id);
      const profileData = await unifiedProfileService.getCurrentProfile();
      console.log("✅ Unified profile data:", profileData);
      setProfile(profileData);
    } catch (err: any) {
      console.error('❌ Error fetching unified profile:', err);
      setError(err.message || 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UnifiedProfileData>) => {
    try {
      const result = await unifiedProfileService.updateProfile(updates);
      
      if (result.success) {
        // Optimistically update local state, then refetch for consistency
        setProfile(prev => prev ? { ...prev, ...updates } : null);
        await refetch(); // Ensure we have the latest data
      }
      
      return result;
    } catch (err: any) {
      console.error('Error updating profile:', err);
      return { success: false, error: err.message || 'Failed to update profile' };
    }
  };

  // Fetch profile when user changes
  useEffect(() => {
    refetch();
  }, [user]);

  return {
    profile,
    loading,
    error,
    refetch,
    updateProfile,
    hasCompletedOnboarding: profile?.onboarding_completed ?? false,
    profileType: profile?.user_type ?? null, // Updated to use user_type instead of deprecated profile_type
  };
};