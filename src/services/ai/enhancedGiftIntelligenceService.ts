import { supabase } from "@/integrations/supabase/client";

export interface GiftIntelligenceInsight {
  id?: string;
  user_id: string;
  insight_type: string;
  insight_data: any;
  confidence_score?: number;
  is_active?: boolean;
}

export interface GiftIntelligenceCache {
  id?: string;
  user_id: string;
  recipient_id?: string;
  intelligence_type: string;
  cache_data: any;
  expires_at?: string;
}

export class EnhancedGiftIntelligenceService {
  // Phase 1: Enhanced Data Utilization
  static async updateUserGiftPreferences(userId: string, preferences: any) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ enhanced_gift_preferences: preferences })
      .eq('id', userId);
    
    if (error) throw error;
    return data;
  }

  static async trackAIInteraction(userId: string, interactionData: any) {
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('enhanced_ai_interaction_data')
      .eq('id', userId)
      .single();

    if (fetchError) throw fetchError;

    const currentData = (profile?.enhanced_ai_interaction_data as any) || {};
    const safeCurrent = currentData && typeof currentData === 'object' ? currentData : {};
    const updatedData = {
      ...safeCurrent,
      search_patterns: [...(safeCurrent.search_patterns || []), interactionData.pattern],
      successful_suggestions: interactionData.success 
        ? [...(safeCurrent.successful_suggestions || []), interactionData]
        : (safeCurrent.successful_suggestions || []),
      unsuccessful_suggestions: !interactionData.success 
        ? [...(safeCurrent.unsuccessful_suggestions || []), interactionData]
        : (safeCurrent.unsuccessful_suggestions || []),
    };

    const { data, error } = await supabase
      .from('profiles')
      .update({ enhanced_ai_interaction_data: updatedData })
      .eq('id', userId);

    if (error) throw error;
    return data;
  }

  static async updateGiftingHistory(userId: string, giftData: any) {
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('enhanced_gifting_history')
      .eq('id', userId)
      .single();

    if (fetchError) throw fetchError;

    const currentHistory = (profile?.enhanced_gifting_history as any) || {};
    const safeHistory = currentHistory && typeof currentHistory === 'object' ? currentHistory : {};
    const updatedHistory = {
      ...safeHistory,
      seasonal_patterns: this.updateSeasonalPatterns(safeHistory.seasonal_patterns, giftData),
      category_success_rates: this.updateCategorySuccessRates(safeHistory.category_success_rates, giftData),
      recipient_type_preferences: this.updateRecipientTypePreferences(safeHistory.recipient_type_preferences, giftData),
    };

    const { data, error } = await supabase
      .from('profiles')
      .update({ enhanced_gifting_history: updatedHistory })
      .eq('id', userId);

    if (error) throw error;
    return data;
  }

  // Phase 2: Smart Auto-Gifting Intelligence
  static async updateAutoGiftingRuleIntelligence(ruleId: string, updates: any) {
    const { data, error } = await supabase
      .from('auto_gifting_rules')
      .update({
        relationship_context: updates.relationship_context,
        recipient_lifestyle_factors: updates.recipient_lifestyle_factors,
        seasonal_adjustment_factors: updates.seasonal_adjustment_factors,
        success_metrics: updates.success_metrics,
      })
      .eq('id', ruleId);

    if (error) throw error;
    return data;
  }

  static async generateContextAwareBudget(userId: string, recipientId: string, occasion: string) {
    // Get user's enhanced preferences
    const { data: profile } = await supabase
      .from('profiles')
      .select('enhanced_gift_preferences, enhanced_gifting_history')
      .eq('id', userId)
      .single();

    // Get relationship context
    const { data: connection } = await supabase
      .from('user_connections')
      .select('relationship_type, data_access_permissions')
      .eq('user_id', userId)
      .eq('connected_user_id', recipientId)
      .single();

    if (!profile || !connection) return null;

    const preferences = (profile.enhanced_gift_preferences as any) || {};
    const history = (profile.enhanced_gifting_history as any) || {};
    
    // Calculate context-aware budget
    const baseRange = preferences?.preferred_price_ranges?.[occasion] || { min: 25, max: 100 };
    const relationshipModifier = preferences?.relationship_budget_modifiers?.[connection.relationship_type] || 1.0;
    
    return {
      min: Math.round(baseRange.min * relationshipModifier),
      max: Math.round(baseRange.max * relationshipModifier),
      confidence: this.calculateBudgetConfidence(history, occasion, connection.relationship_type),
    };
  }

  // Phase 3: Enhanced AI Suggestion Engine
  static async createSuggestionInsight(insight: GiftIntelligenceInsight) {
    const { data, error } = await supabase
      .from('ai_suggestion_insights')
      .insert(insight);

    if (error) throw error;
    return data;
  }

  static async getCachedIntelligence(userId: string, recipientId?: string, type?: string) {
    let query = supabase
      .from('gift_intelligence_cache')
      .select('*')
      .eq('user_id', userId);

    if (recipientId) query = query.eq('recipient_id', recipientId);
    if (type) query = query.eq('intelligence_type', type);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  static async setCachedIntelligence(cache: GiftIntelligenceCache) {
    const { data, error } = await supabase
      .from('gift_intelligence_cache')
      .upsert(cache);

    if (error) throw error;
    return data;
  }

  // Enhanced methods for new/invited user scenarios
  static async getInvitationContextIntelligence(userId: string, recipientIdentifier: string) {
    try {
      // Check for invitation analytics
      const { data: invitationData } = await supabase
        .from('gift_invitation_analytics')
        .select('*')
        .eq('user_id', userId)
        .eq('recipient_email', recipientIdentifier)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!invitationData) return null;

      // Calculate urgency level
      const urgencyLevel = this.calculateEventUrgency(invitationData.occasion);
      
      // Build invitation context
      return {
        invitation_data: invitationData,
        relationship_type: invitationData.relationship_type,
        urgency_level: urgencyLevel,
        is_emergency_scenario: urgencyLevel <= 7,
        invitation_context: {
          sent_at: invitationData.created_at,
          occasion: invitationData.occasion,
          conversion_status: invitationData.conversion_status
        }
      };
    } catch (error) {
      console.error('Error getting invitation context:', error);
      return null;
    }
  }

  static async createEmergencyRecipientProfile(userId: string, recipientIdentifier: string, invitationContext: any) {
    try {
      // Create emergency profile based on invitation context and inviter proxy data
      const { data: inviterProfile } = await supabase
        .from('profiles')
        .select('enhanced_gift_preferences, enhanced_gifting_history')
        .eq('id', userId)
        .single();

      const emergencyProfile = {
        recipient_identifier: recipientIdentifier,
        emergency_profile: true,
        data_sources: ['invitation_context', 'inviter_proxy'],
        confidence_level: 'medium',
        profile_data: {
          relationship_context: {
            type: invitationContext.relationship_type,
            connection_recency: 'new_invitation',
            interaction_level: 'limited'
          },
          inferred_preferences: {
            safe_categories: ['gift_cards', 'flowers', 'gourmet_food', 'books'],
            avoid_categories: ['intimate', 'highly_personal'],
            budget_comfort: this.inferBudgetFromInviterHistory((inviterProfile as any)?.enhanced_gifting_history),
            style_preference: 'thoughtful_and_safe'
          },
          proxy_intelligence: {
            inviter_successful_categories: this.extractSuccessfulCategories((inviterProfile as any)?.enhanced_gifting_history),
            inviter_typical_budget: this.extractTypicalBudget((inviterProfile as any)?.enhanced_gift_preferences),
            inviter_gift_style: (inviterProfile as any)?.enhanced_gift_preferences?.preferred_gift_styles?.[0] || 'thoughtful'
          }
        },
        urgency_factors: {
          time_constraint: invitationContext.urgency_level <= 7,
          profile_building_time: 'limited',
          decision_confidence: 'medium_with_safe_choices'
        }
      };

      // Cache this emergency profile
      await this.setCachedIntelligence({
        user_id: userId,
        intelligence_type: 'emergency_recipient_profile',
        cache_data: emergencyProfile,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      });

      return emergencyProfile;
    } catch (error) {
      console.error('Error creating emergency recipient profile:', error);
      return null;
    }
  }

  static async enhanceGiftSelectionForNewUser(
    userId: string, 
    recipientId: string, 
    occasion: string, 
    budget: number
  ) {
    try {
      // Get invitation context if available
      const invitationContext = await this.getInvitationContextIntelligence(userId, recipientId);
      
      // Create enhanced selection criteria for new users
      const enhancedCriteria = {
        prioritize_universal_appeal: true,
        avoid_highly_personal: true,
        favor_presentation_quality: true,
        include_gift_message: true,
        
        // Budget optimization for new users
        budget_allocation: {
          item_cost: budget * 0.85, // Leave room for premium presentation
          presentation_upgrade: budget * 0.15
        },
        
        // Category priorities based on relationship and urgency
        category_priorities: this.getCategoryPrioritiesForNewUser(
          invitationContext?.relationship_type || 'friend',
          occasion,
          invitationContext?.urgency_level || 30
        ),
        
        // Delivery considerations
        delivery_preferences: {
          expedited_if_urgent: invitationContext?.urgency_level <= 7,
          include_thoughtful_note: true,
          premium_packaging: true
        }
      };

      return enhancedCriteria;
    } catch (error) {
      console.error('Error enhancing gift selection for new user:', error);
      return null;
    }
  }

  static async analyzeWishlistCompatibility(userId: string, recipientId: string) {
    // Get recipient's public wishlists
    const { data: wishlists } = await supabase
      .from('wishlists')
      .select('*, wishlist_items(*)')
      .eq('user_id', recipientId)
      .eq('is_public', true);

    // Get user's budget and preferences
    const budget = await this.generateContextAwareBudget(userId, recipientId, 'general');
    
    if (!wishlists || !budget) return null;

    // Analyze compatibility
    const compatibleItems = wishlists.flatMap(wishlist => 
      wishlist.wishlist_items?.filter(item => 
        item.price >= budget.min && item.price <= budget.max
      ) || []
    );

    return {
      total_items: wishlists.reduce((sum, w) => sum + (w.wishlist_items?.length || 0), 0),
      compatible_items: compatibleItems.length,
      recommendations: compatibleItems.slice(0, 5),
      compatibility_score: compatibleItems.length / Math.max(wishlists.reduce((sum, w) => sum + (w.wishlist_items?.length || 0), 0), 1),
    };
  }

  // Helper methods
  private static updateSeasonalPatterns(current: any, giftData: any) {
    const season = this.getSeason(new Date(giftData.date));
    const base = current && typeof current === 'object' ? current : {};
    return {
      ...base,
      [season]: {
        ...(base[season] || {}),
        total_gifts: ((base[season]?.total_gifts || 0) + 1),
        avg_budget: this.calculateAverageBudget(base[season], giftData.amount),
        popular_categories: this.updatePopularCategories(base[season]?.popular_categories, giftData.category),
      }
    };
  }

  private static updateCategorySuccessRates(current: any, giftData: any) {
    const category = giftData.category;
    const base = current && typeof current === 'object' ? current : {};
    return {
      ...base,
      [category]: {
        total_attempts: ((base[category]?.total_attempts || 0) + 1),
        successful: ((base[category]?.successful || 0) + (giftData.was_successful ? 1 : 0)),
        success_rate: (((base[category]?.successful || 0) + (giftData.was_successful ? 1 : 0)) / 
                     ((base[category]?.total_attempts || 0) + 1)),
      }
    };
  }

  private static updateRecipientTypePreferences(current: any, giftData: any) {
    const recipientType = giftData.recipient_type;
    const base = current && typeof current === 'object' ? current : {};
    return {
      ...base,
      [recipientType]: {
        ...(base[recipientType] || {}),
        preferred_categories: this.updatePopularCategories(base[recipientType]?.preferred_categories, giftData.category),
        avg_budget: this.calculateAverageBudget(base[recipientType], giftData.amount),
      }
    };
  }

  private static getSeason(date: Date): string {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  private static calculateAverageBudget(current: any, newAmount: number) {
    const currentTotal = current?.total_budget || 0;
    const currentCount = current?.gift_count || 0;
    return (currentTotal + newAmount) / (currentCount + 1);
  }

  private static updatePopularCategories(current: any = {}, category: string) {
    return {
      ...current,
      [category]: (current[category] || 0) + 1,
    };
  }

  private static calculateBudgetConfidence(history: any, occasion: string, relationshipType: string): number {
    const seasonalData = (history?.seasonal_patterns as any) || {};
    const relationshipData = (history?.relationship_gift_history as any)?.[relationshipType] || {};
    
    const dataPoints = Object.keys(seasonalData).length + Object.keys(relationshipData).length;
    return Math.min(dataPoints / 10, 1.0); // Max confidence at 10+ data points
  }

  // Helper methods for new user intelligence
  private static calculateEventUrgency(occasion: string): number {
    // Mock urgency calculation - in real implementation, would check actual event dates
    const urgentOccasions = ['birthday', 'anniversary', 'wedding'];
    return urgentOccasions.includes(occasion?.toLowerCase()) ? 5 : 30;
  }

  private static inferBudgetFromInviterHistory(history: any): { min: number, max: number } {
    if (!history?.seasonal_patterns) {
      return { min: 25, max: 75 }; // Safe default range
    }

    const patterns = Object.values(((history?.seasonal_patterns as any) || {})).map((season: any) => season.avg_budget || 50);
    const avgBudget = patterns.reduce((sum: number, val: number) => sum + val, 0) / Math.max(patterns.length, 1);
    
    return {
      min: Math.max(15, avgBudget * 0.6),
      max: Math.max(50, avgBudget * 1.4)
    };
  }

  private static extractSuccessfulCategories(history: any): string[] {
    if (!history?.category_success_rates) return ['gift_cards', 'flowers', 'books'];
    
    return Object.entries(((history?.category_success_rates as any) || {}))
      .filter(([_, data]: [string, any]) => (data as any).success_rate > 0.7)
      .map(([category, _]) => category)
      .slice(0, 5);
  }

  private static extractTypicalBudget(preferences: any): { min: number, max: number } {
    if (!((preferences as any)?.preferred_price_ranges?.general)) {
      return { min: 30, max: 80 };
    }
    
    return (preferences as any).preferred_price_ranges.general;
  }

  private static getCategoryPrioritiesForNewUser(
    relationshipType: string, 
    occasion: string, 
    urgencyLevel: number
  ): string[] {
    const basePriorities = ['gift_cards', 'flowers', 'gourmet_food', 'books', 'wellness'];
    
    // Adjust based on relationship
    switch (relationshipType.toLowerCase()) {
      case 'romantic':
      case 'spouse':
        return ['flowers', 'jewelry', 'experiences', 'gourmet_food', 'wellness'];
      case 'family':
      case 'parent':
        return ['experiences', 'home_decor', 'books', 'gourmet_food', 'gift_cards'];
      case 'professional':
      case 'colleague':
        return ['gift_cards', 'books', 'office_supplies', 'gourmet_food', 'plants'];
      default:
        return basePriorities;
    }
  }
}