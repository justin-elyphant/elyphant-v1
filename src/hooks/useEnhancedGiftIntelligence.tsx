import { useState, useEffect } from 'react';
import { EnhancedGiftIntelligenceService } from '@/services/ai/enhancedGiftIntelligenceService';
import { useAuthSession } from '@/contexts/auth/useAuthSession';

export const useEnhancedGiftIntelligence = () => {
  const { user } = useAuthSession();
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<any[]>([]);
  const [cachedData, setCachedData] = useState<any[]>([]);

  // Phase 1: Enhanced Data Utilization
  const updateGiftPreferences = async (preferences: any) => {
    if (!user) return;
    
    setLoading(true);
    try {
      await EnhancedGiftIntelligenceService.updateUserGiftPreferences(user.id, preferences);
    } catch (error) {
      console.error('Error updating gift preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackAIInteraction = async (interactionData: any) => {
    if (!user) return;
    
    try {
      await EnhancedGiftIntelligenceService.trackAIInteraction(user.id, interactionData);
    } catch (error) {
      console.error('Error tracking AI interaction:', error);
    }
  };

  const updateGiftingHistory = async (giftData: any) => {
    if (!user) return;
    
    try {
      await EnhancedGiftIntelligenceService.updateGiftingHistory(user.id, giftData);
    } catch (error) {
      console.error('Error updating gifting history:', error);
    }
  };

  // Phase 2: Context-Aware Budget Intelligence
  const generateContextAwareBudget = async (recipientId: string, occasion: string) => {
    if (!user) return null;
    
    setLoading(true);
    try {
      const budget = await EnhancedGiftIntelligenceService.generateContextAwareBudget(
        user.id, 
        recipientId, 
        occasion
      );
      return budget;
    } catch (error) {
      console.error('Error generating context-aware budget:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Phase 3: Enhanced AI Suggestion Engine
  const createSuggestionInsight = async (insightData: any) => {
    if (!user) return;
    
    try {
      const insight = await EnhancedGiftIntelligenceService.createSuggestionInsight({
        user_id: user.id,
        ...insightData,
      });
      return insight;
    } catch (error) {
      console.error('Error creating suggestion insight:', error);
    }
  };

  const analyzeWishlistCompatibility = async (recipientId: string) => {
    if (!user) return null;
    
    setLoading(true);
    try {
      const analysis = await EnhancedGiftIntelligenceService.analyzeWishlistCompatibility(
        user.id, 
        recipientId
      );
      return analysis;
    } catch (error) {
      console.error('Error analyzing wishlist compatibility:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getCachedIntelligence = async (recipientId?: string, type?: string) => {
    if (!user) return;
    
    try {
      const cache = await EnhancedGiftIntelligenceService.getCachedIntelligence(
        user.id, 
        recipientId, 
        type
      );
      setCachedData(cache || []);
      return cache;
    } catch (error) {
      console.error('Error getting cached intelligence:', error);
    }
  };

  const setCachedIntelligence = async (cacheData: any) => {
    if (!user) return;
    
    try {
      await EnhancedGiftIntelligenceService.setCachedIntelligence({
        user_id: user.id,
        ...cacheData,
      });
    } catch (error) {
      console.error('Error setting cached intelligence:', error);
    }
  };

  // Load user insights on mount
  useEffect(() => {
    if (user) {
      getCachedIntelligence();
    }
  }, [user]);

  return {
    loading,
    insights,
    cachedData,
    
    // Phase 1: Enhanced Data Utilization
    updateGiftPreferences,
    trackAIInteraction,
    updateGiftingHistory,
    
    // Phase 2: Context-Aware Budget Intelligence
    generateContextAwareBudget,
    
    // Phase 3: Enhanced AI Suggestion Engine
    createSuggestionInsight,
    analyzeWishlistCompatibility,
    getCachedIntelligence,
    setCachedIntelligence,
  };
};