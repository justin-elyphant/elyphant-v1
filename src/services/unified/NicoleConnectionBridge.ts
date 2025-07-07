import { unifiedDataService, ConnectionWithProfile, WishlistWithItems } from "./UnifiedDataService";
import { NicoleContext, ConversationPhase } from "../ai/nicoleAiService";

export interface RecipientSuggestion {
  connection: ConnectionWithProfile;
  relevanceScore: number;
  reason: string;
  suggestedBudget?: [number, number];
  upcomingEvents: any[];
  wishlistItems: number;
}

export interface NicoleEnhancedContext extends NicoleContext {
  availableRecipients?: RecipientSuggestion[];
  selectedRecipient?: ConnectionWithProfile;
  recipientWishlists?: WishlistWithItems[];
  contextualRecommendations?: {
    item: any;
    reasoning: string;
    confidence: number;
    source: 'wishlist' | 'interests' | 'history';
  }[];
}

/**
 * Nicole-Connection Bridge Service
 * Connects Nicole AI with user's connections and wishlists for intelligent recommendations
 */
export class NicoleConnectionBridge {
  private static instance: NicoleConnectionBridge;

  static getInstance(): NicoleConnectionBridge {
    if (!NicoleConnectionBridge.instance) {
      NicoleConnectionBridge.instance = new NicoleConnectionBridge();
    }
    return NicoleConnectionBridge.instance;
  }

  /**
   * Enhance Nicole context with connection data
   */
  async enhanceNicoleContext(
    userMessage: string,
    currentContext: NicoleContext
  ): Promise<NicoleEnhancedContext> {
    try {
      const nicoleData = await unifiedDataService.getNicoleIntegrationData();
      if (!nicoleData) return currentContext;

      // Extract recipient information from message
      const recipientInfo = this.extractRecipientFromMessage(userMessage);
      
      // Find matching connections
      const recipientSuggestions = await this.findRelevantRecipients(
        recipientInfo,
        currentContext,
        nicoleData.connections
      );

      // Determine if we should suggest specific recipients
      const shouldSuggestRecipients = this.shouldSuggestRecipients(
        userMessage,
        currentContext,
        recipientSuggestions
      );

      let enhancedContext: NicoleEnhancedContext = {
        ...currentContext,
        availableRecipients: shouldSuggestRecipients ? recipientSuggestions : undefined
      };

      // If we have a clear recipient match, enhance with their data
      const selectedRecipient = this.selectBestRecipient(recipientSuggestions, recipientInfo);
      if (selectedRecipient) {
        enhancedContext = await this.enhanceWithRecipientData(
          enhancedContext,
          selectedRecipient
        );
      }

      return enhancedContext;
    } catch (error) {
      console.error('Error enhancing Nicole context:', error);
      return currentContext;
    }
  }

  /**
   * Get recipient suggestions based on user input
   */
  async getRecipientSuggestions(
    query: string,
    context: NicoleContext
  ): Promise<RecipientSuggestion[]> {
    try {
      const nicoleData = await unifiedDataService.getNicoleIntegrationData();
      if (!nicoleData) return [];

      const recipientInfo = this.extractRecipientFromMessage(query);
      return this.findRelevantRecipients(recipientInfo, context, nicoleData.connections);
    } catch (error) {
      console.error('Error getting recipient suggestions:', error);
      return [];
    }
  }

  /**
   * Get wishlist-based recommendations for a selected recipient
   */
  async getWishlistRecommendations(
    recipientId: string,
    context: NicoleContext
  ): Promise<{ item: any; reasoning: string; confidence: number }[]> {
    try {
      const connection = await unifiedDataService.getConnectionWithWishlists(recipientId);
      if (!connection) return [];

      const recommendations = await unifiedDataService.getWishlistRecommendations(
        recipientId,
        context.budget,
        context.occasion
      );

      return recommendations.map(rec => ({
        item: rec.item,
        reasoning: rec.reasoning,
        confidence: rec.priority === 'high' ? 0.9 : rec.priority === 'medium' ? 0.7 : 0.5
      }));
    } catch (error) {
      console.error('Error getting wishlist recommendations:', error);
      return [];
    }
  }

  /**
   * Generate contextual gift suggestions based on recipient's profile
   */
  async generateContextualSuggestions(
    recipient: ConnectionWithProfile,
    context: NicoleContext
  ): Promise<string[]> {
    const suggestions: string[] = [];

    try {
      // Age-based suggestions
      if (recipient.profile?.dob) {
        const age = this.calculateAge(recipient.profile.dob);
        const ageGroup = this.getAgeGroup(age);
        
        if (context.occasion) {
          suggestions.push(`${context.occasion} gifts for ${ageGroup}`);
        }
        
        if (context.interests?.length) {
          context.interests.forEach(interest => {
            suggestions.push(`${interest} for ${ageGroup}`);
          });
        }
      }

      // Interest-based suggestions from recipient's profile
      if (recipient.profile?.interests) {
        const interests = Array.isArray(recipient.profile.interests) 
          ? recipient.profile.interests 
          : [];
        
        interests.forEach(interest => {
          if (context.occasion) {
            suggestions.push(`${interest} ${context.occasion} gifts`);
          } else {
            suggestions.push(`${interest} gifts for ${recipient.relationship_type}`);
          }
        });
      }

      // Relationship-specific suggestions
      const relationshipSuggestions = this.getRelationshipSpecificSuggestions(
        recipient.relationship_type,
        context
      );
      suggestions.push(...relationshipSuggestions);

      // Wishlist category suggestions
      recipient.wishlists.forEach(wishlist => {
        if (wishlist.category) {
          suggestions.push(`${wishlist.category} gifts`);
        }
      });

      return suggestions.slice(0, 8); // Return top 8 suggestions
    } catch (error) {
      console.error('Error generating contextual suggestions:', error);
      return suggestions;
    }
  }

  // Private helper methods

  private extractRecipientFromMessage(message: string): {
    relationship?: string;
    name?: string;
    ageHint?: string;
  } {
    const lowerMessage = message.toLowerCase();
    
    // Extract relationship patterns
    const relationshipPatterns = [
      { pattern: /(?:for\s+my\s+|gift\s+for\s+my\s+)(\w+)/i, type: 'possessive' },
      { pattern: /(?:my\s+)(\w+)(?:\s+(?:is|has|loves|likes|wants))/i, type: 'descriptive' },
      { pattern: /(?:buying\s+for\s+my\s+|shopping\s+for\s+my\s+)(\w+)/i, type: 'action' }
    ];

    for (const { pattern } of relationshipPatterns) {
      const match = message.match(pattern);
      if (match) {
        return { relationship: match[1] };
      }
    }

    // Extract names (capitalized words that might be names)
    const nameMatch = message.match(/\b[A-Z][a-z]+\b/g);
    if (nameMatch) {
      // Filter out common non-name words
      const commonWords = ['Nicole', 'I', 'My', 'The', 'This', 'That', 'Gift', 'Birthday', 'Christmas'];
      const potentialNames = nameMatch.filter(word => !commonWords.includes(word));
      if (potentialNames.length > 0) {
        return { name: potentialNames[0] };
      }
    }

    return {};
  }

  private async findRelevantRecipients(
    recipientInfo: { relationship?: string; name?: string; ageHint?: string },
    context: NicoleContext,
    connections: ConnectionWithProfile[]
  ): Promise<RecipientSuggestion[]> {
    const suggestions: RecipientSuggestion[] = [];

    for (const connection of connections) {
      let relevanceScore = 0;
      let reason = '';

      // Name matching (highest priority)
      if (recipientInfo.name && connection.profile?.name) {
        const nameMatch = connection.profile.name.toLowerCase().includes(
          recipientInfo.name.toLowerCase()
        );
        if (nameMatch) {
          relevanceScore += 50;
          reason += `Matches name "${recipientInfo.name}". `;
        }
      }

      // Relationship matching
      if (recipientInfo.relationship) {
        const relationshipMatch = connection.relationship_type.toLowerCase().includes(
          recipientInfo.relationship.toLowerCase()
        );
        if (relationshipMatch) {
          relevanceScore += 40;
          reason += `Matches relationship "${recipientInfo.relationship}". `;
        }
      }

      // Occasion relevance (check for upcoming events)
      if (context.occasion && connection.upcomingEvents.length > 0) {
        const hasRelevantEvent = connection.upcomingEvents.some(event => 
          event.date_type?.toLowerCase().includes(context.occasion?.toLowerCase())
        );
        if (hasRelevantEvent) {
          relevanceScore += 30;
          reason += `Has upcoming ${context.occasion}. `;
        }
      }

      // Wishlist activity
      const totalWishlistItems = connection.wishlists.reduce(
        (sum, wishlist) => sum + wishlist.items.length, 
        0
      );
      if (totalWishlistItems > 0) {
        relevanceScore += Math.min(totalWishlistItems * 2, 20);
        reason += `Has ${totalWishlistItems} wishlist items. `;
      }

      // Interest matching
      if (context.interests && connection.profile?.interests) {
        const connectionInterests = Array.isArray(connection.profile.interests) 
          ? connection.profile.interests 
          : [];
        const matchingInterests = context.interests.filter(interest =>
          connectionInterests.some(connInterest => 
            typeof connInterest === 'string' && 
            connInterest.toLowerCase().includes(interest.toLowerCase())
          )
        );
        if (matchingInterests.length > 0) {
          relevanceScore += matchingInterests.length * 5;
          reason += `Shares interests: ${matchingInterests.join(', ')}. `;
        }
      }

      if (relevanceScore > 10) { // Only include if reasonably relevant
        suggestions.push({
          connection,
          relevanceScore,
          reason: reason.trim(),
          suggestedBudget: this.suggestBudget(connection, context),
          upcomingEvents: connection.upcomingEvents,
          wishlistItems: totalWishlistItems
        });
      }
    }

    return suggestions.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private shouldSuggestRecipients(
    message: string,
    context: NicoleContext,
    suggestions: RecipientSuggestion[]
  ): boolean {
    // Don't suggest if we already have a clear recipient
    if (context.recipient && suggestions.length > 0 && suggestions[0].relevanceScore > 40) {
      return false;
    }

    // Suggest if we have multiple good options
    const goodSuggestions = suggestions.filter(s => s.relevanceScore > 25);
    return goodSuggestions.length > 1 && goodSuggestions.length <= 5;
  }

  private selectBestRecipient(
    suggestions: RecipientSuggestion[],
    recipientInfo: { relationship?: string; name?: string; ageHint?: string }
  ): RecipientSuggestion | null {
    if (suggestions.length === 0) return null;
    
    const topSuggestion = suggestions[0];
    
    // Only auto-select if confidence is very high
    if (topSuggestion.relevanceScore > 60) {
      return topSuggestion;
    }

    return null;
  }

  private async enhanceWithRecipientData(
    context: NicoleEnhancedContext,
    selectedRecipient: RecipientSuggestion
  ): Promise<NicoleEnhancedContext> {
    const connection = selectedRecipient.connection;

    // Get contextual recommendations
    const recommendations = await this.getWishlistRecommendations(
      connection.connected_user_id,
      context
    );

    return {
      ...context,
      selectedRecipient: connection,
      recipientWishlists: connection.wishlists,
      recipient: connection.profile?.name || context.recipient,
      relationship: connection.relationship_type,
      contextualRecommendations: recommendations.map(rec => ({
        ...rec,
        source: 'wishlist' as const
      }))
    };
  }

  private suggestBudget(
    connection: ConnectionWithProfile,
    context: NicoleContext
  ): [number, number] | undefined {
    // Budget suggestions based on relationship and occasion
    const budgetMap: Record<string, Record<string, [number, number]>> = {
      family: {
        birthday: [30, 80],
        holiday: [50, 120],
        anniversary: [40, 100],
        default: [25, 75]
      },
      spouse: {
        birthday: [75, 200],
        holiday: [100, 300],
        anniversary: [100, 250],
        default: [50, 150]
      },
      friend: {
        birthday: [20, 60],
        holiday: [25, 70],
        default: [15, 50]
      },
      romantic: {
        birthday: [50, 150],
        holiday: [75, 200],
        anniversary: [100, 250],
        default: [40, 120]
      }
    };

    const relationshipKey = connection.relationship_type.toLowerCase();
    const occasionKey = context.occasion?.toLowerCase() || 'default';
    
    return budgetMap[relationshipKey]?.[occasionKey] || 
           budgetMap[relationshipKey]?.default || 
           [20, 80];
  }

  private getRelationshipSpecificSuggestions(
    relationship: string,
    context: NicoleContext
  ): string[] {
    const suggestions: string[] = [];
    const rel = relationship.toLowerCase();

    const relationshipSuggestions: Record<string, string[]> = {
      family: ['family-friendly gifts', 'practical gifts', 'meaningful keepsakes'],
      spouse: ['romantic gifts', 'luxury items', 'personalized gifts'],
      friend: ['fun gifts', 'shared interest items', 'experience gifts'],
      romantic: ['romantic presents', 'couple activities', 'intimate gifts'],
      professional: ['professional gifts', 'office accessories', 'business books']
    };

    const baseSuggestions = relationshipSuggestions[rel] || [];
    
    if (context.occasion) {
      baseSuggestions.forEach(suggestion => {
        suggestions.push(`${suggestion} for ${context.occasion}`);
      });
    } else {
      suggestions.push(...baseSuggestions);
    }

    return suggestions;
  }

  private calculateAge(dob: string): number {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  private getAgeGroup(age: number): string {
    if (age <= 5) return 'toddlers';
    if (age <= 12) return 'kids';
    if (age <= 17) return 'teens';
    if (age <= 25) return 'young adults';
    if (age <= 40) return 'adults';
    if (age <= 60) return 'middle aged';
    return 'seniors';
  }
}

// Export singleton instance
export const nicoleConnectionBridge = NicoleConnectionBridge.getInstance();