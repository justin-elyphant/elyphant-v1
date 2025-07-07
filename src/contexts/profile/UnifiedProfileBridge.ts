import { Profile } from "@/types/supabase";
import { Profile as ProfileType } from "@/types/profile";
import { unifiedDataService, UnifiedUserData } from "@/services/unified/UnifiedDataService";

/**
 * Bridge between ProfileContext and UnifiedDataService
 * Ensures single source of truth while providing enhanced data access
 */
export class UnifiedProfileBridge {
  /**
   * Get enhanced profile data that includes unified data from UnifiedDataService
   */
  static async getEnhancedProfileData(baseProfile: Profile | null): Promise<{
    profile: Profile | null;
    connections: any[];
    wishlists: any[];
    recentActivity: any[];
  }> {
    if (!baseProfile) {
      return {
        profile: null,
        connections: [],
        wishlists: [],
        recentActivity: []
      };
    }

    try {
      // Get unified data without forcing refresh to avoid redundant API calls
      const unifiedData = await unifiedDataService.getUserData(false);
      
      if (unifiedData) {
        return {
          profile: baseProfile, // Always use ProfileContext as source of truth
          connections: unifiedData.connections,
          wishlists: unifiedData.wishlists,
          recentActivity: unifiedData.recentActivity
        };
      }
    } catch (error) {
      console.error("Error fetching unified data:", error);
    }

    // Fallback to base profile only
    return {
      profile: baseProfile,
      connections: [],
      wishlists: [],
      recentActivity: []
    };
  }

  /**
   * Update profile through both ProfileContext and UnifiedDataService
   */
  static async syncProfileUpdate(
    profileId: string,
    updateData: Partial<Profile>,
    profileContextUpdate: (data: Partial<Profile>) => Promise<any>
  ): Promise<boolean> {
    try {
      // Update through ProfileContext (single source of truth)
      const result = await profileContextUpdate(updateData);
      
      if (result) {
        // Invalidate UnifiedDataService cache to ensure fresh data
        unifiedDataService.invalidateCache();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error syncing profile update:", error);
      return false;
    }
  }

  /**
   * Get Nicole AI integration data using ProfileContext profile as base
   */
  static async getNicoleIntegrationData(baseProfile: Profile | null) {
    if (!baseProfile) return null;

    try {
      // Force UnifiedDataService to use ProfileContext profile as base
      const nicoleData = await unifiedDataService.getNicoleIntegrationData();
      
      if (nicoleData) {
        // Override the profile with ProfileContext profile (single source of truth)
        return {
          ...nicoleData,
          userProfile: baseProfile as any // Type assertion for compatibility
        };
      }
    } catch (error) {
      console.error("Error getting Nicole integration data:", error);
    }

    return null;
  }

  /**
   * Consolidate all user data while maintaining ProfileContext as profile source
   */
  static async getConsolidatedUserData(baseProfile: Profile | null): Promise<UnifiedUserData | null> {
    if (!baseProfile) return null;

    try {
      const unifiedData = await unifiedDataService.getUserData(false);
      
      if (unifiedData) {
        // Override profile with ProfileContext profile (single source of truth)
        return {
          ...unifiedData,
          profile: baseProfile as any // Type assertion for compatibility
        };
      }
    } catch (error) {
      console.error("Error getting consolidated user data:", error);
    }

    return null;
  }

  /**
   * Search connections while ensuring profile consistency
   */
  static async searchConnections(query: string, baseProfile: Profile | null) {
    if (!baseProfile) return [];

    try {
      return await unifiedDataService.searchConnections(query);
    } catch (error) {
      console.error("Error searching connections:", error);
      return [];
    }
  }

  /**
   * Get wishlist recommendations with profile context
   */
  static async getWishlistRecommendations(
    connectionId: string,
    budget?: [number, number],
    occasion?: string,
    baseProfile?: Profile | null
  ) {
    try {
      return await unifiedDataService.getWishlistRecommendations(connectionId, budget, occasion);
    } catch (error) {
      console.error("Error getting wishlist recommendations:", error);
      return [];
    }
  }
}