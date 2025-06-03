
import { supabase } from "@/integrations/supabase/client";

export interface ConnectionProfile {
  id: string;
  name: string;
  email?: string;
  interests?: string[];
  wishlists?: any[];
  relationship_type: string;
  upcoming_occasions?: Array<{
    date: string;
    type: string;
    name: string;
  }>;
}

export interface EnhancedNicoleContext {
  recipient?: string;
  recipientId?: string;
  relationship?: string;
  occasion?: string;
  budget?: [number, number];
  interests?: string[];
  step?: string;
  connections?: ConnectionProfile[];
  recipientWishlists?: any[];
  recipientProfile?: ConnectionProfile;
  conversationPhase?: 'discovery' | 'wishlist_review' | 'alternatives' | 'finalization';
}

export interface WishlistRecommendation {
  source: 'wishlist' | 'gpt_suggestion' | 'similar_item';
  item: any;
  reasoning: string;
  priority: 'high' | 'medium' | 'low';
  availability?: boolean;
  inBudget?: boolean;
}

/**
 * Enhanced Nicole AI service with connection and wishlist awareness
 */
export class EnhancedNicoleService {
  
  /**
   * Get user's connections and their profiles
   */
  static async getUserConnections(userId: string): Promise<ConnectionProfile[]> {
    try {
      const { data: connections, error } = await supabase
        .from('user_connections')
        .select(`
          connected_user_id,
          relationship_type,
          profiles!user_connections_connected_user_id_fkey (
            id,
            name,
            email,
            interests,
            wishlists,
            important_dates
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'accepted');

      if (error) {
        console.error('Error fetching connections:', error);
        return [];
      }

      return (connections || []).map(conn => {
        // Handle the case where profiles might be an array or single object
        const profile = Array.isArray(conn.profiles) ? conn.profiles[0] : conn.profiles;
        
        return {
          id: conn.connected_user_id,
          name: profile?.name || 'Unknown',
          email: profile?.email,
          interests: profile?.interests || [],
          wishlists: profile?.wishlists || [],
          relationship_type: conn.relationship_type,
          upcoming_occasions: this.extractUpcomingOccasions(profile?.important_dates)
        };
      });
    } catch (error) {
      console.error('Error in getUserConnections:', error);
      return [];
    }
  }

  /**
   * Extract upcoming occasions from profile data
   */
  private static extractUpcomingOccasions(importantDates: any): Array<{date: string, type: string, name: string}> {
    if (!importantDates || !Array.isArray(importantDates)) return [];
    
    const now = new Date();
    const nextThreeMonths = new Date();
    nextThreeMonths.setMonth(now.getMonth() + 3);

    return importantDates
      .filter(date => {
        const eventDate = new Date(date.date);
        return eventDate >= now && eventDate <= nextThreeMonths;
      })
      .map(date => ({
        date: date.date,
        type: date.date_type || 'special_date',
        name: date.name || date.type
      }));
  }

  /**
   * Get recipient's wishlist items with priority analysis
   */
  static async getRecipientWishlists(recipientId: string): Promise<any[]> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('wishlists')
        .eq('id', recipientId)
        .single();

      if (error || !profile?.wishlists) {
        return [];
      }

      // Sort wishlists by priority and recent activity
      return profile.wishlists
        .filter((list: any) => list.items && list.items.length > 0)
        .map((list: any) => ({
          ...list,
          items: list.items.sort((a: any, b: any) => {
            // Prioritize by: priority level, then by recent additions
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 1;
            const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 1;
            
            if (aPriority !== bPriority) return bPriority - aPriority;
            
            // Then by creation date (most recent first)
            return new Date(b.added_at || b.created_at).getTime() - 
                   new Date(a.added_at || a.created_at).getTime();
          })
        }));
    } catch (error) {
      console.error('Error fetching recipient wishlists:', error);
      return [];
    }
  }

  /**
   * Analyze wishlist items and generate recommendations
   */
  static analyzeWishlistRecommendations(
    wishlists: any[], 
    budget: [number, number],
    occasion?: string
  ): WishlistRecommendation[] {
    const recommendations: WishlistRecommendation[] = [];
    
    wishlists.forEach(wishlist => {
      wishlist.items?.forEach((item: any) => {
        const itemPrice = parseFloat(item.price) || 0;
        const inBudget = itemPrice >= budget[0] && itemPrice <= budget[1];
        
        let priority: 'high' | 'medium' | 'low' = 'medium';
        let reasoning = `From ${wishlist.title || 'wishlist'}`;
        
        // High priority for in-budget, recently added items
        if (inBudget && item.priority === 'high') {
          priority = 'high';
          reasoning += ' - High priority item within budget';
        } else if (inBudget) {
          priority = 'medium';
          reasoning += ' - Within your budget';
        } else if (itemPrice > budget[1]) {
          priority = 'low';
          reasoning += ' - Above budget, consider for group gifting';
        } else {
          priority = 'low';
          reasoning += ' - Below typical budget range';
        }

        // Boost priority for occasion-relevant items
        if (occasion && (
          item.title?.toLowerCase().includes(occasion.toLowerCase()) ||
          item.description?.toLowerCase().includes(occasion.toLowerCase()) ||
          wishlist.title?.toLowerCase().includes(occasion.toLowerCase())
        )) {
          priority = priority === 'low' ? 'medium' : 'high';
          reasoning += `, perfect for ${occasion}`;
        }

        recommendations.push({
          source: 'wishlist',
          item,
          reasoning,
          priority,
          inBudget,
          availability: true // Assume available for now
        });
      });
    });

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Generate GPT-powered gift suggestions based on profile and context
   */
  static async generateGPTSuggestions(
    recipientProfile: ConnectionProfile,
    context: EnhancedNicoleContext,
    wishlistItems: any[]
  ): Promise<string[]> {
    // Extract interests and patterns from wishlist
    const wishlistCategories = wishlistItems
      .map(item => item.category || item.brand)
      .filter(Boolean);
    
    const interestPatterns = [
      ...(recipientProfile.interests || []),
      ...wishlistCategories
    ].slice(0, 10); // Limit to avoid overwhelming GPT

    // Create smart search queries based on analysis
    const suggestions = [];
    
    // Interest-based suggestions
    if (interestPatterns.length > 0) {
      suggestions.push(
        `${interestPatterns.slice(0, 3).join(' ')} gifts`,
        `${recipientProfile.relationship_type} ${context.occasion || 'gifts'} ${interestPatterns[0]}`
      );
    }

    // Budget-appropriate alternatives
    if (context.budget) {
      suggestions.push(
        `${context.occasion || 'gifts'} under $${context.budget[1]}`,
        `${recipientProfile.relationship_type} gifts $${context.budget[0]}-${context.budget[1]}`
      );
    }

    // Relationship and occasion specific
    suggestions.push(
      `${recipientProfile.relationship_type} ${context.occasion || 'gifts'}`,
      `thoughtful ${context.occasion || 'gifts'} ${recipientProfile.relationship_type}`
    );

    return suggestions.slice(0, 5); // Return top 5 suggestions
  }

  /**
   * Enhanced conversation analysis with context awareness
   */
  static async analyzeConversation(
    message: string,
    context: EnhancedNicoleContext,
    userId: string
  ): Promise<{
    phase: string;
    nextQuestions: string[];
    shouldShowWishlist: boolean;
    shouldSearchProducts: boolean;
    recommendations: WishlistRecommendation[];
  }> {
    // Load user connections if not already loaded
    if (!context.connections) {
      context.connections = await this.getUserConnections(userId);
    }

    // Analyze message for recipient identification
    const recipientMentioned = context.connections?.find(conn => 
      message.toLowerCase().includes(conn.name.toLowerCase()) ||
      message.toLowerCase().includes(conn.relationship_type.toLowerCase())
    );

    if (recipientMentioned && !context.recipientId) {
      context.recipientId = recipientMentioned.id;
      context.recipientProfile = recipientMentioned;
      context.recipient = recipientMentioned.name;
      context.relationship = recipientMentioned.relationship_type;
    }

    // Load recipient wishlists if we have a recipient
    if (context.recipientId && !context.recipientWishlists) {
      context.recipientWishlists = await this.getRecipientWishlists(context.recipientId);
    }

    // Determine conversation phase and next actions
    let phase = context.conversationPhase || 'discovery';
    let nextQuestions: string[] = [];
    let shouldShowWishlist = false;
    let shouldSearchProducts = false;
    let recommendations: WishlistRecommendation[] = [];

    if (!context.recipient && context.connections && context.connections.length > 0) {
      phase = 'discovery';
      nextQuestions = [
        `I see you're connected to several people. Who are you shopping for?`,
        `Here are some people you might be shopping for: ${context.connections.slice(0, 3).map(c => c.name).join(', ')}. Anyone specific in mind?`
      ];
    } else if (context.recipient && !context.occasion) {
      phase = 'discovery';
      const upcomingOccasions = context.recipientProfile?.upcoming_occasions || [];
      if (upcomingOccasions.length > 0) {
        nextQuestions = [
          `I see ${context.recipient} has some upcoming occasions: ${upcomingOccasions.map(o => o.name).join(', ')}. Is this for any of these?`,
          `What's the occasion for this gift?`
        ];
      } else {
        nextQuestions = [`What's the occasion for ${context.recipient}?`];
      }
    } else if (context.recipient && context.occasion && !context.budget) {
      phase = 'discovery';
      nextQuestions = [`What's your budget range for this ${context.occasion} gift for ${context.recipient}?`];
    } else if (context.recipient && context.occasion && context.budget && context.recipientWishlists) {
      phase = 'wishlist_review';
      shouldShowWishlist = true;
      
      recommendations = this.analyzeWishlistRecommendations(
        context.recipientWishlists,
        context.budget,
        context.occasion
      );

      if (recommendations.length > 0) {
        nextQuestions = [
          `Great! I found ${recommendations.filter(r => r.priority === 'high').length} high-priority items on ${context.recipient}'s wishlist that match your criteria.`,
          `Would you like to see items from their wishlist, or should I suggest some creative alternatives?`
        ];
      } else {
        phase = 'alternatives';
        shouldSearchProducts = true;
        nextQuestions = [
          `${context.recipient} doesn't have items in your budget range on their wishlist.`,
          `Let me suggest some thoughtful alternatives based on their interests.`
        ];
      }
    }

    return {
      phase,
      nextQuestions,
      shouldShowWishlist,
      shouldSearchProducts,
      recommendations
    };
  }
}
