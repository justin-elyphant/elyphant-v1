
import { supabase } from "@/integrations/supabase/client";
import { ConversationPhase } from "./nicoleAiService";

export interface ConnectionProfile {
  id: string;
  name: string;
  relationship: string;
  wishlists?: any[];
}

export interface WishlistRecommendation {
  item: {
    id: string;
    title: string;
    name?: string;
    price: number;
    image_url?: string;
    image?: string;
    brand?: string;
  };
  reasoning: string;
  matchScore: number;
  priority: 'high' | 'medium' | 'low';
  inBudget: boolean;
}

export interface EnhancedNicoleContext {
  recipient?: string;
  recipientId?: string;
  relationship?: string;
  occasion?: string;
  budget?: [number, number];
  interests?: string[];
  step?: string;
  conversationPhase?: ConversationPhase;
  connections?: ConnectionProfile[];
  recipientWishlists?: any[];
  recipientProfile?: ConnectionProfile;
  detectedBrands?: string[];
  ageGroup?: string;
  exactAge?: number;
}

export interface ConversationAnalysis {
  phase: ConversationPhase;
  shouldShowWishlist: boolean;
  shouldSearchProducts: boolean;
  recommendations: WishlistRecommendation[];
  confidence: number;
  contextCompleteness: number;
  missingInfo: string[];
}

export class EnhancedNicoleService {
  static async getUserConnections(userId: string): Promise<ConnectionProfile[]> {
    try {
      const { data, error } = await supabase
        .from('user_connections')
        .select(`
          connected_user_id,
          relationship_type,
          profiles!user_connections_connected_user_id_fkey (
            name,
            wishlists
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'accepted');

      if (error) throw error;

      return data?.map(conn => {
        const profile = Array.isArray(conn.profiles) ? conn.profiles[0] : conn.profiles;
        return {
          id: conn.connected_user_id,
          name: profile?.name || 'Unknown',
          relationship: conn.relationship_type,
          wishlists: profile?.wishlists || []
        };
      }) || [];
    } catch (error) {
      console.error('Error fetching user connections:', error);
      return [];
    }
  }

  static extractRelationshipFromMessage(message: string): { recipient?: string; relationship?: string } {
    const lowerMessage = message.toLowerCase();
    
    // Enhanced relationship detection patterns with more comprehensive coverage
    const relationshipPatterns = [
      // Direct "for my X" patterns - these should match first
      { pattern: /(?:for\s+my\s+|gift\s+for\s+my\s+)son(?:\s|$|[.,!?])/i, relationship: 'family', recipientType: 'son' },
      { pattern: /(?:for\s+my\s+|gift\s+for\s+my\s+)daughter(?:\s|$|[.,!?])/i, relationship: 'family', recipientType: 'daughter' },
      { pattern: /(?:for\s+my\s+|gift\s+for\s+my\s+)mom(?:\s|$|[.,!?])/i, relationship: 'family', recipientType: 'mom' },
      { pattern: /(?:for\s+my\s+|gift\s+for\s+my\s+)mother(?:\s|$|[.,!?])/i, relationship: 'family', recipientType: 'mom' },
      { pattern: /(?:for\s+my\s+|gift\s+for\s+my\s+)dad(?:\s|$|[.,!?])/i, relationship: 'family', recipientType: 'dad' },
      { pattern: /(?:for\s+my\s+|gift\s+for\s+my\s+)father(?:\s|$|[.,!?])/i, relationship: 'family', recipientType: 'dad' },
      { pattern: /(?:for\s+my\s+|gift\s+for\s+my\s+)wife(?:\s|$|[.,!?])/i, relationship: 'spouse', recipientType: 'wife' },
      { pattern: /(?:for\s+my\s+|gift\s+for\s+my\s+)husband(?:\s|$|[.,!?])/i, relationship: 'spouse', recipientType: 'husband' },
      { pattern: /(?:for\s+my\s+|gift\s+for\s+my\s+)brother(?:\s|$|[.,!?])/i, relationship: 'family', recipientType: 'brother' },
      { pattern: /(?:for\s+my\s+|gift\s+for\s+my\s+)sister(?:\s|$|[.,!?])/i, relationship: 'family', recipientType: 'sister' },
      { pattern: /(?:for\s+my\s+|gift\s+for\s+my\s+)friend(?:\s|$|[.,!?])/i, relationship: 'friend', recipientType: 'friend' },
      { pattern: /(?:for\s+my\s+|gift\s+for\s+my\s+)boyfriend(?:\s|$|[.,!?])/i, relationship: 'romantic', recipientType: 'boyfriend' },
      { pattern: /(?:for\s+my\s+|gift\s+for\s+my\s+)girlfriend(?:\s|$|[.,!?])/i, relationship: 'romantic', recipientType: 'girlfriend' },
      
      // Possessive patterns - "my son's", "my daughter's", etc.
      { pattern: /(?:for\s+)?my\s+(son|boy)(?:'s)?/i, relationship: 'family', recipientType: 'son' },
      { pattern: /(?:for\s+)?my\s+(daughter|girl)(?:'s)?/i, relationship: 'family', recipientType: 'daughter' },
      { pattern: /(?:for\s+)?my\s+(wife|spouse)(?:'s)?/i, relationship: 'spouse', recipientType: 'wife' },
      { pattern: /(?:for\s+)?my\s+(husband|spouse)(?:'s)?/i, relationship: 'spouse', recipientType: 'husband' },
      { pattern: /(?:for\s+)?my\s+(mom|mother|mama)(?:'s)?/i, relationship: 'family', recipientType: 'mom' },
      { pattern: /(?:for\s+)?my\s+(dad|father|papa)(?:'s)?/i, relationship: 'family', recipientType: 'dad' },
      { pattern: /(?:for\s+)?my\s+(brother|bro)(?:'s)?/i, relationship: 'family', recipientType: 'brother' },
      { pattern: /(?:for\s+)?my\s+(sister|sis)(?:'s)?/i, relationship: 'family', recipientType: 'sister' },
      { pattern: /(?:for\s+)?my\s+(friend|buddy|pal)(?:'s)?/i, relationship: 'friend', recipientType: 'friend' },
      { pattern: /(?:for\s+)?my\s+(boyfriend|bf)(?:'s)?/i, relationship: 'romantic', recipientType: 'boyfriend' },
      { pattern: /(?:for\s+)?my\s+(girlfriend|gf)(?:'s)?/i, relationship: 'romantic', recipientType: 'girlfriend' },
      
      // Professional variations
      { pattern: /(?:for\s+)?my\s+(boss|manager)(?:'s)?/i, relationship: 'professional', recipientType: 'boss' },
      { pattern: /(?:for\s+)?my\s+(colleague|coworker)(?:'s)?/i, relationship: 'professional', recipientType: 'colleague' },
    ];

    for (const { pattern, relationship, recipientType } of relationshipPatterns) {
      const match = message.match(pattern);
      if (match) {
        console.log(`Relationship detected: ${recipientType} (${relationship}) from pattern: ${pattern} in message: "${message}"`);
        return {
          recipient: recipientType,
          relationship: relationship
        };
      }
    }

    console.log(`No relationship detected in message: "${message}"`);
    return {};
  }

  static calculateContextCompleteness(context: EnhancedNicoleContext): { completeness: number; missingInfo: string[] } {
    const requiredFields = {
      recipient: context.recipient || context.relationship,
      occasion: context.occasion,
      interests: context.interests && context.interests.length > 0,
      budget: context.budget,
      detectedBrands: context.detectedBrands && context.detectedBrands.length > 0,
      ageGroup: context.ageGroup
    };

    const missingInfo: string[] = [];
    let score = 0;
    
    // Core requirements (higher weight)
    if (requiredFields.recipient) score += 30;
    else missingInfo.push('recipient');
    
    if (requiredFields.occasion) score += 20;
    else missingInfo.push('occasion');
    
    // Important context (medium weight)
    if (requiredFields.interests) score += 25;
    else missingInfo.push('interests');
    
    if (requiredFields.budget) score += 15;
    else missingInfo.push('budget');
    
    // Enhanced context (lower weight but valuable)
    if (requiredFields.detectedBrands) score += 5;
    
    if (requiredFields.ageGroup) score += 5;
    
    return { completeness: score, missingInfo };
  }

  static async analyzeConversation(
    message: string, 
    context: EnhancedNicoleContext, 
    userId: string
  ): Promise<ConversationAnalysis> {
    try {
      // Extract relationship information from the message
      const relationshipInfo = this.extractRelationshipFromMessage(message);
      
      // Merge with existing context, including enhanced fields
      const updatedContext = {
        ...context,
        ...relationshipInfo
      };

      // Calculate context completeness
      const { completeness, missingInfo } = this.calculateContextCompleteness(updatedContext);
      
      // Enhanced phase detection with stricter requirements
      let phase: ConversationPhase = 'greeting';
      
      if (!updatedContext.recipient && !updatedContext.relationship) {
        phase = 'greeting';
      } else if (updatedContext.recipient || updatedContext.relationship) {
        if (!updatedContext.occasion) {
          phase = 'gathering_info';
        } else if (completeness < 70) { // Require at least 70% completeness
          phase = 'clarifying_needs';
        } else {
          phase = 'ready_to_search';
        }
      }

      console.log(`Enhanced Nicole Analysis:`, {
        phase,
        completeness,
        missingInfo,
        context: updatedContext
      });

      // Check if we should show wishlist items (only if very complete context)
      const shouldShowWishlist = phase === 'ready_to_search' && 
        completeness >= 80 &&
        updatedContext.recipientWishlists && updatedContext.recipientWishlists.length > 0;

      // Generate recommendations if we have wishlist data
      const recommendations: WishlistRecommendation[] = [];
      if (shouldShowWishlist && updatedContext.recipientWishlists) {
        for (const wishlist of updatedContext.recipientWishlists) {
          if (wishlist.items) {
            for (const item of wishlist.items.slice(0, 3)) {
              const itemPrice = item.price || 0;
              const inBudget = updatedContext.budget ? 
                itemPrice >= updatedContext.budget[0] && itemPrice <= updatedContext.budget[1] : 
                true;
              
              // Enhanced reasoning with brand and age context
              let reasoning = `This matches their interests`;
              if (updatedContext.detectedBrands && updatedContext.detectedBrands.length > 0) {
                reasoning += ` and includes their preferred brands (${updatedContext.detectedBrands.join(', ')})`;
              }
              if (updatedContext.ageGroup) {
                reasoning += ` and is age-appropriate for ${updatedContext.ageGroup}`;
              }
              
              recommendations.push({
                item: {
                  id: item.id || Math.random().toString(),
                  title: item.title || item.name || 'Wishlist Item',
                  name: item.name || item.title || 'Wishlist Item',
                  price: itemPrice,
                  image_url: item.image_url || item.image,
                  image: item.image || item.image_url,
                  brand: item.brand
                },
                reasoning,
                matchScore: Math.random() * 0.3 + 0.7, // 0.7-1.0 range
                priority: inBudget ? 'high' : 'medium',
                inBudget
              });
            }
          }
        }
      }

      // Enhanced search criteria - require high completeness
      const shouldSearchProducts = phase === 'ready_to_search' && 
        completeness >= 75 && // Require 75% completeness minimum
        Boolean(updatedContext.recipient && updatedContext.occasion);

      return {
        phase,
        shouldShowWishlist,
        shouldSearchProducts,
        recommendations,
        confidence: completeness / 100,
        contextCompleteness: completeness,
        missingInfo
      };
    } catch (error) {
      console.error('Error analyzing conversation:', error);
      return {
        phase: 'greeting',
        shouldShowWishlist: false,
        shouldSearchProducts: false,
        recommendations: [],
        confidence: 0.1,
        contextCompleteness: 0,
        missingInfo: ['recipient', 'occasion', 'interests', 'budget']
      };
    }
  }

  static async generateGPTSuggestions(
    recipientProfile: ConnectionProfile,
    context: EnhancedNicoleContext,
    wishlists: any[]
  ): Promise<string[]> {
    const suggestions: string[] = [];
    
    // Brand-first suggestions
    if (context.detectedBrands && context.detectedBrands.length > 0) {
      for (const brand of context.detectedBrands) {
        if (context.ageGroup) {
          suggestions.push(`${brand} gifts for ${context.ageGroup}`);
        } else {
          suggestions.push(`${brand} gifts for ${context.relationship || 'them'}`);
        }
      }
    }
    
    // Age-aware suggestions
    if (context.ageGroup && context.interests) {
      for (const interest of context.interests) {
        suggestions.push(`${interest} for ${context.ageGroup}`);
      }
    }
    
    // Enhanced interest-based suggestions
    if (context.interests) {
      for (const interest of context.interests) {
        if (context.ageGroup) {
          suggestions.push(`age-appropriate ${interest} for ${context.ageGroup}`);
        } else {
          suggestions.push(`${interest} gifts for ${context.relationship || 'them'}`);
        }
      }
    }
    
    if (context.occasion) {
      const occasionSuggestion = context.ageGroup 
        ? `${context.occasion} gifts for ${context.ageGroup}`
        : `${context.occasion} gifts for ${context.relationship || 'them'}`;
      suggestions.push(occasionSuggestion);
    }
    
    // Add budget-aware suggestions
    if (context.budget) {
      const [min, max] = context.budget;
      const budgetSuggestion = context.ageGroup
        ? `thoughtful gifts under $${max} for ${context.ageGroup}`
        : `thoughtful gifts under $${max}`;
      suggestions.push(budgetSuggestion);
    }
    
    return suggestions.slice(0, 5); // Return top 5 suggestions
  }
}
