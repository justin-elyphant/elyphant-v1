/**
 * Gift Recommendation Integration Service
 * 
 * This service integrates the Enhanced Gift Recommendation system with Nicole's 
 * existing conversation engine, maintaining all protective measures and unified systems.
 */

import { UnifiedNicoleContext } from '@/services/ai/unified/types';

export interface NicoleToRecommendationContext {
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
}

export class GiftRecommendationIntegration {
  /**
   * Converts Nicole's unified context to recommendation system context
   * while preserving all context data and maintaining compatibility
   */
  static convertNicoleContextToRecommendationContext(
    nicoleContext: UnifiedNicoleContext,
    conversationHistory?: Array<{ role: string; content: string }>
  ): NicoleToRecommendationContext {
    console.log('🔄 Converting Nicole context to recommendation context:', nicoleContext);

    // Extract recipient information
    const recipient = nicoleContext.recipient || this.extractRecipientFromContext(nicoleContext);
    
    // Determine urgency based on occasion and context
    const urgency = this.determineUrgency(nicoleContext);
    
    // Infer gift type from selected intent and context
    const giftType = this.inferGiftType(nicoleContext);
    
    // Extract personality traits from conversation context
    const personalityTraits = this.extractPersonalityTraits(nicoleContext, conversationHistory);

    const recommendationContext: NicoleToRecommendationContext = {
      recipient,
      relationship: nicoleContext.relationship,
      occasion: nicoleContext.occasion,
      budget: nicoleContext.budget,
      interests: nicoleContext.interests || [],
      recipientAge: nicoleContext.exactAge,
      personalityTraits,
      conversationHistory: conversationHistory?.slice(-10) || [], // Last 10 messages for context
      urgency,
      giftType
    };

    console.log('✅ Converted context for recommendations:', recommendationContext);
    return recommendationContext;
  }

  /**
   * Creates a recipient identifier for profile building
   */
  static createRecipientIdentifier(
    nicoleContext: UnifiedNicoleContext,
    fallbackName?: string
  ): string | undefined {
    // Try to create a meaningful identifier
    const recipient = nicoleContext.recipient || fallbackName;
    const relationship = nicoleContext.relationship;
    
    if (recipient && relationship) {
      return `${recipient.toLowerCase()}_${relationship.toLowerCase()}`;
    }
    
    if (recipient) {
      return recipient.toLowerCase().replace(/\s+/g, '_');
    }
    
    return undefined;
  }

  /**
   * Determines if we should auto-generate recommendations based on context
   */
  static shouldAutoGenerateRecommendations(nicoleContext: UnifiedNicoleContext): boolean {
    // Auto-generate if we have sufficient context
    const hasBasicInfo = !!(
      nicoleContext.recipient || 
      nicoleContext.relationship || 
      nicoleContext.occasion
    );
    
    const isAutoGiftFlow = nicoleContext.selectedIntent === 'auto-gift';
    const hasGiftCollectionPhase = nicoleContext.giftCollectionPhase === 'recipient';
    
    return hasBasicInfo && (isAutoGiftFlow || hasGiftCollectionPhase);
  }

  /**
   * Enhances Nicole's context with recommendation results for better conversation flow
   */
  static enhanceNicoleContextWithRecommendations(
    originalContext: UnifiedNicoleContext,
    recommendationResults: any
  ): Partial<UnifiedNicoleContext> {
    const enhancements: Partial<UnifiedNicoleContext> = {
      // Add recommendation metadata to context
      marketplaceState: {
        ...originalContext.marketplaceState,
        lastRecommendations: recommendationResults.recommendations?.slice(0, 3),
        recommendationConfidence: recommendationResults.confidence_score,
        recommendationSource: recommendationResults.recommendation_source
      },
      
      // Update available actions based on recommendations
      availableActions: [
        ...(originalContext.availableActions || []),
        'view_recommendations',
        'refine_search',
        'purchase_recommendation'
      ],
      
      // Track that we've provided recommendations
      lastAction: 'generated_recommendations'
    };

    return enhancements;
  }

  // Private helper methods
  private static extractRecipientFromContext(context: UnifiedNicoleContext): string | undefined {
    // Try to extract recipient from various context fields
    if (context.recipientInfo?.name) {
      return context.recipientInfo.name;
    }
    
    // Look for patterns in previous messages or system prompts
    const searchText = context.systemPrompt || '';
    const recipientMatch = searchText.match(/(?:for|gift for|giving to)\s+([A-Za-z]+)/i);
    return recipientMatch?.[1];
  }

  private static determineUrgency(context: UnifiedNicoleContext): 'low' | 'medium' | 'high' {
    const occasion = context.occasion?.toLowerCase() || '';
    
    // High urgency occasions
    if (occasion.includes('birthday') || occasion.includes('anniversary') || 
        occasion.includes('graduation') || occasion.includes('wedding')) {
      return 'high';
    }
    
    // Medium urgency occasions
    if (occasion.includes('christmas') || occasion.includes('valentine') || 
        occasion.includes('mother') || occasion.includes('father')) {
      return 'medium';
    }
    
    return 'low';
  }

  private static inferGiftType(context: UnifiedNicoleContext): 'surprise' | 'wishlist_based' | 'experience' | 'practical' {
    const selectedIntent = context.selectedIntent;
    
    if (selectedIntent === 'auto-gift') {
      return 'surprise';
    }
    
    if (selectedIntent === 'create-wishlist') {
      return 'wishlist_based';
    }
    
    // Analyze interests for type inference
    const interests = context.interests || [];
    if (interests.some(interest => 
      ['travel', 'adventure', 'dining', 'concerts', 'sports'].includes(interest.toLowerCase())
    )) {
      return 'experience';
    }
    
    return 'practical';
  }

  private static extractPersonalityTraits(
    context: UnifiedNicoleContext, 
    conversationHistory?: Array<{ role: string; content: string }>
  ): string[] {
    const traits: string[] = [];
    
    // Extract from interests
    const interests = context.interests || [];
    if (interests.includes('reading')) traits.push('intellectual');
    if (interests.includes('fitness') || interests.includes('yoga')) traits.push('health-conscious');
    if (interests.includes('art') || interests.includes('music')) traits.push('creative');
    if (interests.includes('cooking')) traits.push('culinary');
    if (interests.includes('travel')) traits.push('adventurous');
    
    // Extract from conversation patterns (basic sentiment analysis)
    const conversationText = conversationHistory?.map(msg => msg.content).join(' ').toLowerCase() || '';
    if (conversationText.includes('practical') || conversationText.includes('useful')) {
      traits.push('practical');
    }
    if (conversationText.includes('luxury') || conversationText.includes('premium')) {
      traits.push('luxury-oriented');
    }
    if (conversationText.includes('eco') || conversationText.includes('sustainable')) {
      traits.push('environmentally-conscious');
    }
    
    return [...new Set(traits)]; // Remove duplicates
  }
}