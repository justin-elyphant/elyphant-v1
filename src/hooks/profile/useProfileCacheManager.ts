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
   * Handle post-onboarding data sync
   */
  const handleOnboardingComplete = useCallback(async () => {
    console.log("🎯 Handling onboarding completion - forcing data sync");
    
    // Wait a bit to ensure database writes are complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Force complete refresh
    return await forceProfileRefresh();
  }, [forceProfileRefresh]);

  return {
    forceProfileRefresh,
    handleOnboardingComplete,
    invalidateCache
  };
};