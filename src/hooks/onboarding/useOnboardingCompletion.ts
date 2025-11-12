import { useCallback } from 'react';
import { useProfile } from '@/contexts/profile/ProfileContext';
import { unifiedProfileService } from '@/services/profiles/UnifiedProfileService';

/**
 * Hook to handle onboarding completion and ensure data sync
 */
export const useOnboardingCompletion = () => {
  const { invalidateCache } = useProfile();

  const handleOnboardingComplete = useCallback(async () => {
    console.log("🎯 Handling onboarding completion");
    
    // Clear localStorage flags
    localStorage.removeItem("onboardingComplete");
    localStorage.removeItem("newSignUp");
    localStorage.removeItem("profileSetupLoading");
    
    // Invalidate all caches
    invalidateCache();
    unifiedProfileService.invalidateCache();
    
    // Wait a moment for database write to complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // ProfileContext is already updated by updateProfile(), no refetch needed
    // Removing redundant refetches to prevent concurrent update conflicts
    
    console.log("✅ Onboarding completion handled");
  }, [invalidateCache]);

  return { handleOnboardingComplete };
};