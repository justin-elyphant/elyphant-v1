import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProductRecommendation {
  productId: string;
  title: string;
  description: string;
  price: number;
  vendor: string;
  imageUrl?: string;
  category: string;
  matchScore: number;
  matchReasons: string[];
  purchaseUrl?: string;
  availability?: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export interface GiftRecommendationOptions {
  maxRecommendations?: number;
  includeExplanations?: boolean;
  fallbackToGeneric?: boolean;
  priceRange?: [number, number];
}

export interface EnhancedRecommendationResponse {
  recommendations: ProductRecommendation[];
  confidence_score: number;
  recommendation_source: string;
  metadata: {
    searchStrategy: string;
    fallbackUsed: boolean;
    recipientProfileCreated: boolean;
    totalProducts: number;
    timeElapsed: number;
  };
  analytics: {
    recommendationId: string;
    contextAnalysis: any;
  };
}

export const useEnhancedGiftRecommendations = () => {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([]);
  const [lastResponse, setLastResponse] = useState<EnhancedRecommendationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateRecommendations = useCallback(async (
    searchContext: {
      recipient?: string;
      relationship?: string;
      occasion?: string;
      budget?: [number, number];
      interests?: string[];
      recipientAge?: number;
      gender?: string;
      lifestyle?: string;
      personalityTraits?: string[];
      conversationHistory?: Array<{ role: string; content: string }>;
      urgency?: 'low' | 'medium' | 'high';
      giftType?: 'surprise' | 'wishlist_based' | 'experience' | 'practical';
    },
    recipientIdentifier?: string,
    executionId?: string,
    options?: GiftRecommendationOptions
  ) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🎁 Generating enhanced gift recommendations:', {
        searchContext,
        recipientIdentifier,
        executionId
      });

      const { data, error } = await supabase.functions.invoke('enhanced-gift-recommendations', {
        body: {
          searchContext,
          recipientIdentifier,
          executionId,
          options: {
            maxRecommendations: 8,
            includeExplanations: true,
            fallbackToGeneric: true,
            ...options
          }
        }
      });

      if (error) throw error;

      const response: EnhancedRecommendationResponse = data;
      
      setRecommendations(response.recommendations);
      setLastResponse(response);
      
      console.log('✅ Enhanced recommendations generated:', {
        count: response.recommendations.length,
        confidence: response.confidence_score,
        source: response.recommendation_source,
        strategy: response.metadata.searchStrategy
      });

      // Show success message with confidence score
      const confidencePercentage = Math.round(response.confidence_score * 100);
      toast.success(`Generated ${response.recommendations.length} recommendations (${confidencePercentage}% confidence)`);

      return response;

    } catch (err: any) {
      console.error('❌ Enhanced recommendation generation failed:', err);
      setError(err.message || 'Failed to generate recommendations');
      toast.error('Failed to generate gift recommendations');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const trackRecommendationEvent = useCallback(async (
    recommendationId: string,
    eventType: 'viewed' | 'clicked' | 'dismissed' | 'purchased' | 'recipient_feedback',
    eventData?: any
  ) => {
    try {
      await supabase
        .from('gift_recommendation_analytics')
        .insert({
          recommendation_id: recommendationId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          event_type: eventType,
          event_data: eventData || {}
        });

      console.log('📊 Recommendation event tracked:', { recommendationId, eventType });
    } catch (error) {
      console.error('❌ Failed to track recommendation event:', error);
    }
  }, []);

  const selectRecommendation = useCallback(async (recommendation: ProductRecommendation) => {
    if (lastResponse?.analytics.recommendationId) {
      await trackRecommendationEvent(
        lastResponse.analytics.recommendationId,
        'clicked',
        {
          productId: recommendation.productId,
          title: recommendation.title,
          price: recommendation.price,
          matchScore: recommendation.matchScore
        }
      );
    }
  }, [lastResponse, trackRecommendationEvent]);

  const dismissRecommendation = useCallback(async (recommendation: ProductRecommendation, reason?: string) => {
    if (lastResponse?.analytics.recommendationId) {
      await trackRecommendationEvent(
        lastResponse.analytics.recommendationId,
        'dismissed',
        {
          productId: recommendation.productId,
          title: recommendation.title,
          dismissalReason: reason
        }
      );
    }
  }, [lastResponse, trackRecommendationEvent]);

  const clearRecommendations = useCallback(() => {
    setRecommendations([]);
    setLastResponse(null);
    setError(null);
  }, []);

  return {
    loading,
    recommendations,
    lastResponse,
    error,
    generateRecommendations,
    trackRecommendationEvent,
    selectRecommendation,
    dismissRecommendation,
    clearRecommendations,
    // Computed properties
    hasRecommendations: recommendations.length > 0,
    confidenceScore: lastResponse?.confidence_score || 0,
    recommendationSource: lastResponse?.recommendation_source || 'unknown'
  };
};