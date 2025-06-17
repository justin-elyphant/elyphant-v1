
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
    price: number;
    image_url?: string;
  };
  reasoning: string;
  matchScore: number;
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

      return data?.map(conn => ({
        id: conn.connected_user_id,
        name: conn.profiles?.name || 'Unknown',
        relationship: conn.relationship_type,
        wishlists: conn.profiles?.wishlists || []
      })) || [];
    } catch (error) {
      console.error('Error fetching user connections:', error);
      return [];
    }
  }

  static async analyzeConversation(
    message: string, 
    context: EnhancedNicoleContext, 
    userId: string
  ): Promise<ConversationAnalysis> {
    try {
      // Determine conversation phase based on context
      let phase: ConversationPhase = 'greeting';
      
      if (context.recipient && context.occasion && (context.interests || context.budget)) {
        phase = 'providing_suggestions';
      } else if (context.recipient && context.occasion) {
        phase = 'clarifying_needs';
      } else if (context.recipient || context.relationship) {
        phase = 'gathering_info';
      }

      // Check if we should show wishlist items
      const shouldShowWishlist = phase === 'providing_suggestions' && 
        context.recipientWishlists && context.recipientWishlists.length > 0;

      // Generate recommendations if we have wishlist data
      const recommendations: WishlistRecommendation[] = [];
      if (shouldShowWishlist && context.recipientWishlists) {
        // Simple scoring based on context matching
        for (const wishlist of context.recipientWishlists) {
          if (wishlist.items) {
            for (const item of wishlist.items.slice(0, 3)) {
              recommendations.push({
                item: {
                  id: item.id || Math.random().toString(),
                  title: item.title || item.name || 'Wishlist Item',
                  price: item.price || 0,
                  image_url: item.image_url
                },
                reasoning: `This matches their interests in ${context.interests?.join(', ') || 'their preferences'}`,
                matchScore: Math.random() * 0.3 + 0.7 // 0.7-1.0 range
              });
            }
          }
        }
      }

      const shouldSearchProducts = phase === 'providing_suggestions' && 
        context.recipient && context.occasion;

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
