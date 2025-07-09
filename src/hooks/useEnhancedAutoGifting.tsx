import { useState, useEffect } from 'react';
import { EnhancedAutoGiftingService, PredictiveGiftOpportunity } from '@/services/ai/enhancedAutoGiftingService';
import { useAuthSession } from '@/contexts/auth/useAuthSession';

export const useEnhancedAutoGifting = () => {
  const { user } = useAuthSession();
  const [loading, setLoading] = useState(false);
  const [opportunities, setOpportunities] = useState<PredictiveGiftOpportunity[]>([]);
  const [budgetRecommendations, setBudgetRecommendations] = useState<Map<string, any>>(new Map());

  // Phase 2: Smart Auto-Gifting Intelligence
  const createEnhancedAutoGiftingRule = async (ruleData: any) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const rule = await EnhancedAutoGiftingService.createEnhancedAutoGiftingRule({
        user_id: user.id,
        ...ruleData,
      });
      return rule;
    } catch (error) {
      console.error('Error creating enhanced auto-gifting rule:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAutoGiftingSettings = async (settings: any) => {
    if (!user) return;
    
    setLoading(true);
    try {
      await EnhancedAutoGiftingService.updateAutoGiftingSettings(user.id, settings);
    } catch (error) {
      console.error('Error updating auto-gifting settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeRelationshipContext = async (recipientId: string) => {
    if (!user) return null;
    
    try {
      const context = await EnhancedAutoGiftingService.analyzeRelationshipContext(user.id, recipientId);
      return context;
    } catch (error) {
      console.error('Error analyzing relationship context:', error);
      return null;
    }
  };

  const generateDynamicBudgetRecommendation = async (recipientId: string, occasion: string) => {
    if (!user) return null;
    
    setLoading(true);
    try {
      const recommendation = await EnhancedAutoGiftingService.generateDynamicBudgetRecommendation(
        user.id, 
        recipientId, 
        occasion
      );
      
      if (recommendation) {
        const key = `${recipientId}-${occasion}`;
        setBudgetRecommendations(prev => new Map(prev.set(key, recommendation)));
      }
      
      return recommendation;
    } catch (error) {
      console.error('Error generating dynamic budget recommendation:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Phase 3: Predictive Intelligence
  const predictUpcomingGiftOpportunities = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const predicted = await EnhancedAutoGiftingService.predictUpcomingGiftOpportunities(user.id);
      setOpportunities(predicted);
      return predicted;
    } catch (error) {
      console.error('Error predicting gift opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  const predictGiftCategories = async (recipientId: string, occasion: string) => {
    if (!user) return [];
    
    try {
      const categories = await EnhancedAutoGiftingService.predictGiftCategories(
        user.id, 
        recipientId, 
        occasion
      );
      return categories;
    } catch (error) {
      console.error('Error predicting gift categories:', error);
      return [];
    }
  };

  const optimizeGiftTiming = async (eventDate: Date, recipientId: string) => {
    try {
      const timing = await EnhancedAutoGiftingService.optimizeGiftTiming(eventDate, recipientId);
      return timing;
    } catch (error) {
      console.error('Error optimizing gift timing:', error);
      return null;
    }
  };

  // Auto-load opportunities on mount
  useEffect(() => {
    if (user) {
      predictUpcomingGiftOpportunities();
    }
  }, [user]);

  // Helper functions for UI integration
  const getOpportunitiesForRecipient = (recipientId: string) => {
    return opportunities.filter(opp => opp.recipient_id === recipientId);
  };

  const getUpcomingOpportunities = (daysAhead: number = 30) => {
    const cutoffDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
    return opportunities.filter(opp => new Date(opp.event_date) <= cutoffDate);
  };

  const getBudgetRecommendation = (recipientId: string, occasion: string) => {
    const key = `${recipientId}-${occasion}`;
    return budgetRecommendations.get(key);
  };

  return {
    loading,
    opportunities,
    budgetRecommendations,
    
    // Phase 2: Smart Auto-Gifting Intelligence
    createEnhancedAutoGiftingRule,
    updateAutoGiftingSettings,
    analyzeRelationshipContext,
    generateDynamicBudgetRecommendation,
    
    // Phase 3: Predictive Intelligence
    predictUpcomingGiftOpportunities,
    predictGiftCategories,
    optimizeGiftTiming,
    
    // Helper functions
    getOpportunitiesForRecipient,
    getUpcomingOpportunities,
    getBudgetRecommendation,
  };
};