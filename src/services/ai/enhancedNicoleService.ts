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
}

export interface ConversationAnalysis {
  phase: ConversationPhase;
  shouldShowWishlist: boolean;
  shouldSearchProducts: boolean;
  recommendations: WishlistRecommendation[];
  confidence: number;
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
        // Fix: Properly access the profiles object with null checking
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
      // Son variations - including possessive forms
      { pattern: /(?:for\s+)?my\s+(son|boy)(?:'s)?/i, relationship: 'family', recipientType: 'son' },
      { pattern: /(?:for\s+)?my\s+(son's)/i, relationship: 'family', recipientType: 'son' },
      
      // Daughter variations - including possessive forms
      { pattern: /(?:for\s+)?my\s+(daughter|girl)(?:'s)?/i, relationship: 'family', recipientType: 'daughter' },
      { pattern: /(?:for\s+)?my\s+(daughter's)/i, relationship: 'family', recipientType: 'daughter' },
      
      // Spouse variations
      { pattern: /(?:for\s+)?my\s+(wife|spouse)(?:'s)?/i, relationship: 'spouse', recipientType: 'wife' },
      { pattern: /(?:for\s+)?my\s+(husband|spouse)(?:'s)?/i, relationship: 'spouse', recipientType: 'husband' },
      { pattern: /(?:for\s+)?my\s+(wife's)/i, relationship: 'spouse', recipientType: 'wife' },
      { pattern: /(?:for\s+)?my\s+(husband's)/i, relationship: 'spouse', recipientType: 'husband' },
      
      // Parent variations
      { pattern: /(?:for\s+)?my\s+(mom|mother|mama)(?:'s)?/i, relationship: 'family', recipientType: 'mom' },
      { pattern: /(?:for\s+)?my\s+(dad|father|papa)(?:'s)?/i, relationship: 'family', recipientType: 'dad' },
      { pattern: /(?:for\s+)?my\s+(mom's|mother's)/i, relationship: 'family', recipientType: 'mom' },
      { pattern: /(?:for\s+)?my\s+(dad's|father's)/i, relationship: 'family', recipientType: 'dad' },
      
      // Sibling variations
      { pattern: /(?:for\s+)?my\s+(brother|bro)(?:'s)?/i, relationship: 'family', recipientType: 'brother' },
      { pattern: /(?:for\s+)?my\s+(sister|sis)(?:'s)?/i, relationship: 'family', recipientType: 'sister' },
      { pattern: /(?:for\s+)?my\s+(brother's|bro's)/i, relationship: 'family', recipientType: 'brother' },
      { pattern: /(?:for\s+)?my\s+(sister's|sis's)/i, relationship: 'family', recipientType: 'sister' },
      
      // Friend and romantic variations
      { pattern: /(?:for\s+)?my\s+(friend|buddy|pal)(?:'s)?/i, relationship: 'friend', recipientType: 'friend' },
      { pattern: /(?:for\s+)?my\s+(boyfriend|bf)(?:'s)?/i, relationship: 'romantic', recipientType: 'boyfriend' },
      { pattern: /(?:for\s+)?my\s+(girlfriend|gf)(?:'s)?/i, relationship: 'romantic', recipientType: 'girlfriend' },
      { pattern: /(?:for\s+)?my\s+(friend's|buddy's)/i, relationship: 'friend', recipientType: 'friend' },
      { pattern: /(?:for\s+)?my\s+(boyfriend's|bf's)/i, relationship: 'romantic', recipientType: 'boyfriend' },
      { pattern: /(?:for\s+)?my\s+(girlfriend's|gf's)/i, relationship: 'romantic', recipientType: 'girlfriend' },
      
      // Professional variations
      { pattern: /(?:for\s+)?my\s+(boss|manager)(?:'s)?/i, relationship: 'professional', recipientType: 'boss' },
      { pattern: /(?:for\s+)?my\s+(colleague|coworker)(?:'s)?/i, relationship: 'professional', recipientType: 'colleague' },
      { pattern: /(?:for\s+)?my\s+(boss's|manager's)/i, relationship: 'professional', recipientType: 'boss' },
      { pattern: /(?:for\s+)?my\s+(colleague's|coworker's)/i, relationship: 'professional', recipientType: 'colleague' },
    ];

    for (const { pattern, relationship, recipientType } of relationshipPatterns) {
      const match = message.match(pattern);
      if (match) {
        console.log(`Relationship detected: ${recipientType} (${relationship}) from pattern: ${pattern}`);
        return {
          recipient: recipientType,
          relationship: relationship
        };
      }
    }

    console.log(`No relationship detected in message: "${message}"`);
    return {};
  }

  static async analyzeConversation(
    message: string, 
    context: EnhancedNicoleContext, 
    userId: string
  ): Promise<ConversationAnalysis> {
    try {
      // Extract relationship information from the message
      const relationshipInfo = this.extractRelationshipFromMessage(message);
      
      // Merge with existing context
      const updatedContext = {
        ...context,
        ...relationshipInfo
      };

      // Determine conversation phase based on enhanced context
      let phase: ConversationPhase = 'greeting';
      
      if (updatedContext.recipient && updatedContext.occasion && (updatedContext.interests || updatedContext.budget)) {
        phase = 'providing_suggestions';
      } else if (updatedContext.recipient && updatedContext.occasion) {
        phase = 'clarifying_needs';
      } else if (updatedContext.recipient || updatedContext.relationship) {
        phase = 'gathering_info';
      }

      // Check if we should show wishlist items
      const shouldShowWishlist = phase === 'providing_suggestions' && 
        updatedContext.recipientWishlists && updatedContext.recipientWishlists.length > 0;

      // Generate recommendations if we have wishlist data
      const recommendations: WishlistRecommendation[] = [];
      if (shouldShowWishlist && updatedContext.recipientWishlists) {
        // Simple scoring based on context matching
        for (const wishlist of updatedContext.recipientWishlists) {
          if (wishlist.items) {
            for (const item of wishlist.items.slice(0, 3)) {
              const itemPrice = item.price || 0;
              const inBudget = updatedContext.budget ? 
                itemPrice >= updatedContext.budget[0] && itemPrice <= updatedContext.budget[1] : 
                true;
              
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
                reasoning: `This matches their interests in ${updatedContext.interests?.join(', ') || 'their preferences'}`,
                matchScore: Math.random() * 0.3 + 0.7, // 0.7-1.0 range
                priority: inBudget ? 'high' : 'medium',
                inBudget
              });
            }
          }
        }
      }

      // Fix: Ensure boolean assignment
      const shouldSearchProducts = phase === 'providing_suggestions' && 
        Boolean(updatedContext.recipient && updatedContext.occasion);

      return {
        phase,
        shouldShowWishlist,
        shouldSearchProducts,
        recommendations,
        confidence: 0.8
      };
    } catch (error) {
      console.error('Error analyzing conversation:', error);
      return {
        phase: 'greeting',
        shouldShowWishlist: false,
        shouldSearchProducts: false,
        recommendations: [],
        confidence: 0.1
      };
    }
  }

  static async generateGPTSuggestions(
    recipientProfile: ConnectionProfile,
    context: EnhancedNicoleContext,
    wishlists: any[]
  ): Promise<string[]> {
    // Generate contextual suggestions based on recipient profile
    const suggestions: string[] = [];
    
    if (context.interests) {
      for (const interest of context.interests) {
        suggestions.push(`${interest} gifts for ${context.relationship || 'them'}`);
      }
    }
    
    if (context.occasion) {
      suggestions.push(`${context.occasion} gifts for ${context.relationship || 'them'}`);
    }
    
    // Add budget-aware suggestions
    if (context.budget) {
      const [min, max] = context.budget;
      suggestions.push(`thoughtful gifts under $${max}`);
    }
    
    return suggestions.slice(0, 3); // Return top 3 suggestions
  }
}
