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

    const currentData = profile?.enhanced_ai_interaction_data || {};
    const updatedData = {
      ...currentData,
      search_patterns: [...(currentData.search_patterns || []), interactionData.pattern],
      successful_suggestions: interactionData.success 
        ? [...(currentData.successful_suggestions || []), interactionData]
        : currentData.successful_suggestions,
      unsuccessful_suggestions: !interactionData.success 
        ? [...(currentData.unsuccessful_suggestions || []), interactionData]
        : currentData.unsuccessful_suggestions,
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

    const currentHistory = profile?.enhanced_gifting_history || {};
    const updatedHistory = {
      ...currentHistory,
      seasonal_patterns: this.updateSeasonalPatterns(currentHistory.seasonal_patterns, giftData),
      category_success_rates: this.updateCategorySuccessRates(currentHistory.category_success_rates, giftData),
      recipient_type_preferences: this.updateRecipientTypePreferences(currentHistory.recipient_type_preferences, giftData),
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

    const preferences = profile.enhanced_gift_preferences || {};
    const history = profile.enhanced_gifting_history || {};
    
    // Calculate context-aware budget
    const baseRange = preferences.preferred_price_ranges?.[occasion] || { min: 25, max: 100 };
    const relationshipModifier = preferences.relationship_budget_modifiers?.[connection.relationship_type] || 1.0;
    
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
    return {
      ...current,
      [season]: {
        ...current[season],
        total_gifts: (current[season]?.total_gifts || 0) + 1,
        avg_budget: this.calculateAverageBudget(current[season], giftData.amount),
        popular_categories: this.updatePopularCategories(current[season]?.popular_categories, giftData.category),
      }
    };
  }

  private static updateCategorySuccessRates(current: any, giftData: any) {
    const category = giftData.category;
    return {
      ...current,
      [category]: {
        total_attempts: (current[category]?.total_attempts || 0) + 1,
        successful: (current[category]?.successful || 0) + (giftData.was_successful ? 1 : 0),
        success_rate: ((current[category]?.successful || 0) + (giftData.was_successful ? 1 : 0)) / 
                     ((current[category]?.total_attempts || 0) + 1),
      }
    };
  }

  private static updateRecipientTypePreferences(current: any, giftData: any) {
    const recipientType = giftData.recipient_type;
    return {
      ...current,
      [recipientType]: {
        ...current[recipientType],
        preferred_categories: this.updatePopularCategories(current[recipientType]?.preferred_categories, giftData.category),
        avg_budget: this.calculateAverageBudget(current[recipientType], giftData.amount),
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
    const seasonalData = history.seasonal_patterns || {};
    const relationshipData = history.relationship_gift_history?.[relationshipType] || {};
    
    const dataPoints = Object.keys(seasonalData).length + Object.keys(relationshipData).length;
    return Math.min(dataPoints / 10, 1.0); // Max confidence at 10+ data points
  }
}