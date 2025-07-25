import { useCallback } from 'react';
import { useProfile } from '@/contexts/profile/ProfileContext';
import { unifiedDataService } from '@/services/unified/UnifiedDataService';

/**
 * Hook to manage profile cache and data synchronization
 */
export const useProfileCacheManager = () => {
  const { invalidateCache, refetchProfile } = useProfile();

  /**
   * Force complete profile refresh with cache invalidation
   */
  const forceProfileRefresh = useCallback(async () => {
    console.log("🔄 Forcing complete profile refresh with cache invalidation");
    
    // Clear all cached data
    invalidateCache();
    unifiedDataService.invalidateCache();
    
    // Clear localStorage flags that might interfere
    localStorage.removeItem("onboardingComplete");
    localStorage.removeItem("newSignUp");
    localStorage.removeItem("profileSetupLoading");
    
    // Force fresh fetch from database
    const profileData = await refetchProfile();
    
    console.log("✅ Profile refresh complete:", profileData ? "success" : "failed");
    return profileData;
  }, [invalidateCache, refetchProfile]);

  /**
   * Handle post-onboarding data sync with enhanced retry logic
   */
  const handleOnboardingComplete = useCallback(async () => {
    console.log("🎯 Handling onboarding completion - forcing data sync");
    
    // Enhanced wait logic with retries for OAuth sync
    let retries = 3;
    let profile = null;
    
    while (retries > 0 && !profile) {
      console.log(`🔄 Attempting profile sync (${4 - retries}/3)`);
      
      // Progressive wait times: 500ms, 1s, 2s
      const waitTime = 500 * (4 - retries);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      // Force complete refresh
      profile = await forceProfileRefresh();
      
      if (!profile) {
        retries--;
        console.log(`⚠️ Profile sync failed, ${retries} retries remaining`);
      }
    }
    
    if (!profile) {
      console.error("❌ Profile sync failed after all retries");
    } else {
      console.log("✅ Profile sync successful");
    }
    
    return profile;
  }, [forceProfileRefresh]);

  /**
   * Enhanced OAuth to settings sync helper
   */
  const handleOAuthToSettingsSync = useCallback(async (user: any) => {
    console.log("🔗 Handling OAuth to settings sync");
    
    try {
      // Clear any stale auth states
      invalidateCache();
      unifiedDataService.invalidateCache();
      
      // Ensure profile exists and is properly synced
      const profile = await refetchProfile();
      
      if (profile) {
        console.log("✅ OAuth to settings sync complete");
        return true;
      } else {
        console.error("❌ OAuth to settings sync failed - no profile found");
        return false;
      }
    } catch (error) {
      console.error("❌ OAuth to settings sync error:", error);
      return false;
    }
  }, [invalidateCache, refetchProfile]);

  return {
    forceProfileRefresh,
    handleOnboardingComplete,
    handleOAuthToSettingsSync,
    invalidateCache
  };
};