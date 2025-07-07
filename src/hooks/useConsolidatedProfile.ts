import { useState, useEffect, useCallback } from 'react';
import { useProfile } from '@/contexts/profile/ProfileContext';
import { UnifiedProfileBridge } from '@/contexts/profile/UnifiedProfileBridge';
import { Profile } from '@/types/supabase';

export interface ConsolidatedProfileData {
  profile: Profile | null;
  connections: any[];
  wishlists: any[];
  recentActivity: any[];
  loading: boolean;
  error: Error | null;
}

/**
 * Hook that provides consolidated user data while maintaining ProfileContext as single source of truth
 * Replaces standalone profile data fetching throughout the app
 */
export function useConsolidatedProfile() {
  const { profile, loading: profileLoading, error: profileError, refetchProfile } = useProfile();
  const [consolidatedData, setConsolidatedData] = useState<ConsolidatedProfileData>({
    profile: null,
    connections: [],
    wishlists: [],
    recentActivity: [],
    loading: true,
    error: null
  });

  const loadConsolidatedData = useCallback(async () => {
    try {
      const enhancedData = await UnifiedProfileBridge.getEnhancedProfileData(profile);
      
      setConsolidatedData({
        profile: enhancedData.profile,
        connections: enhancedData.connections,
        wishlists: enhancedData.wishlists,
        recentActivity: enhancedData.recentActivity,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error loading consolidated profile data:', error);
      setConsolidatedData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('Unknown error')
      }));
    }
  }, [profile]);

  // Load consolidated data when profile changes
  useEffect(() => {
    if (!profileLoading) {
      loadConsolidatedData();
    }
  }, [profile, profileLoading, loadConsolidatedData]);

  // Update loading state based on ProfileContext
  useEffect(() => {
    setConsolidatedData(prev => ({
      ...prev,
      loading: profileLoading,
      error: profileError
    }));
  }, [profileLoading, profileError]);

  /**
   * Refresh all consolidated data
   */
  const refreshConsolidatedData = useCallback(async () => {
    await refetchProfile();
    await loadConsolidatedData();
  }, [refetchProfile, loadConsolidatedData]);

  /**
   * Get Nicole AI integration data
   */
  const getNicoleData = useCallback(async () => {
    return await UnifiedProfileBridge.getNicoleIntegrationData(profile);
  }, [profile]);

  /**
   * Search connections
   */
  const searchConnections = useCallback(async (query: string) => {
    return await UnifiedProfileBridge.searchConnections(query, profile);
  }, [profile]);

  /**
   * Get wishlist recommendations
   */
  const getWishlistRecommendations = useCallback(async (
    connectionId: string,
    budget?: [number, number],
    occasion?: string
  ) => {
    return await UnifiedProfileBridge.getWishlistRecommendations(connectionId, budget, occasion, profile);
  }, [profile]);

  return {
    ...consolidatedData,
    refreshConsolidatedData,
    getNicoleData,
    searchConnections,
    getWishlistRecommendations
  };
}