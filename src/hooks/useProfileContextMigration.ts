import { useProfile } from '@/contexts/profile/ProfileContext';
import { useConsolidatedProfile } from './useConsolidatedProfile';

/**
 * Migration helper hook to ease transition from standalone profile hooks to ProfileContext
 * 
 * This hook provides a compatibility layer for components that need to migrate from:
 * - Direct supabase calls
 * - Standalone profile hooks
 * - Manual profile data management
 * 
 * To ProfileContext-based data management
 */
export function useProfileContextMigration() {
  const {
    profile,
    loading,
    error,
    updateProfile,
    refetchProfile,
    invalidateCache,
    validateProfileData
  } = useProfile();

  const {
    connections,
    wishlists,
    recentActivity,
    getNicoleData,
    searchConnections,
    getWishlistRecommendations
  } = useConsolidatedProfile();

  /**
   * Replacement for hooks that fetch profile directly from database
   */
  const migratedProfileData = {
    profile,
    loading,
    error: error?.message || null,
    refetchProfile
  };

  /**
   * Replacement for hooks that update profile directly via database
   */
  const migratedProfileUpdate = {
    updateProfile,
    isUpdating: loading,
    updateError: error
  };

  /**
   * Enhanced data access combining profile + connections + wishlists
   */
  const enhancedUserData = {
    profile,
    connections,
    wishlists,
    recentActivity,
    loading
  };

  /**
   * Nicole AI integration helpers
   */
  const nicoleIntegration = {
    getNicoleData,
    searchConnections,
    getWishlistRecommendations
  };

  /**
   * Data validation and cache management
   */
  const dataManagement = {
    validateProfileData,
    invalidateCache,
    refreshAll: refetchProfile
  };

  return {
    // Core profile data (replaces useProfileData, useProfileRetrieval, etc.)
    ...migratedProfileData,
    
    // Profile update capabilities (replaces useProfileSave, useProfileUpdate, etc.)
    ...migratedProfileUpdate,
    
    // Enhanced data with connections and wishlists
    enhancedUserData,
    
    // Nicole AI integration
    nicoleIntegration,
    
    // Data management utilities
    dataManagement,
    
    // Backwards compatibility aliases
    fetchProfile: refetchProfile,
    saveProfile: updateProfile,
    profileData: profile,
    isLoading: loading,
    errorMessage: error?.message || null
  };
}

/**
 * Helper hook for components that only need basic profile data
 */
export function useBasicProfile() {
  const { profile, loading, error } = useProfile();
  
  return {
    profile,
    loading,
    error: error?.message || null,
    hasProfile: !!profile,
    isComplete: !!(profile?.name && profile?.email)
  };
}

/**
 * Helper hook for components that need to update profile data
 */
export function useProfileUpdater() {
  const { updateProfile, loading, validateProfileData } = useProfile();
  
  return {
    updateProfile,
    isUpdating: loading,
    validateBeforeUpdate: validateProfileData,
    
    // Convenience methods for common updates
    updateBasicInfo: (data: { name?: string; email?: string; bio?: string }) => 
      updateProfile(data),
    
    updateImage: (imageUrl: string | null) => 
      updateProfile({ profile_image: imageUrl }),
    
    updateAddress: (address: any) => 
      updateProfile({ shipping_address: address }),
    
    updatePreferences: (preferences: any) => 
      updateProfile({ data_sharing_settings: preferences })
  };
}