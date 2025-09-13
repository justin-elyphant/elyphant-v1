import { supabase } from "@/integrations/supabase/client";
import { EnhancedGiftIntelligenceService } from "./enhancedGiftIntelligenceService";

export interface EnhancedAutoGiftingRule {
  id?: string;
  user_id: string;
  recipient_id: string;
  date_type: string;
  is_active?: boolean;
  budget_limit?: number;
  gift_preferences?: any;
  notification_preferences?: any;
  gift_selection_criteria?: any;
  relationship_context?: any;
  recipient_lifestyle_factors?: any;
  seasonal_adjustment_factors?: any;
  success_metrics?: any;
}

export interface PredictiveGiftOpportunity {
  event_date: string;
  event_type: string;
  recipient_id: string;
  confidence_score: number;
  suggested_budget: { min: number; max: number };
  recommended_categories: string[];
  optimal_purchase_timing: string;
}

export class EnhancedAutoGiftingService {
  // Phase 2: Smart Auto-Gifting Intelligence
  static async createEnhancedAutoGiftingRule(rule: EnhancedAutoGiftingRule) {
    // Set intelligent defaults based on user data
    const intelligentRule = await this.enhanceRuleWithIntelligence(rule);
    
    const { data, error } = await supabase
      .from('auto_gifting_rules')
      .insert(intelligentRule);

    if (error) throw error;
    return data;
  }

  static async updateAutoGiftingSettings(userId: string, settings: any) {
    const { data, error } = await supabase
      .from('auto_gifting_settings')
      .upsert({
        user_id: userId,
        ...settings,
      });

    if (error) throw error;
    return data;
  }

  static async analyzeRelationshipContext(userId: string, recipientId: string) {
    // Get connection data
    const { data: connection } = await supabase
      .from('user_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('connected_user_id', recipientId)
      .single();

    if (!connection) return null;

    // Calculate relationship metrics
    const connectionAgeMonths = Math.floor(
      (new Date().getTime() - new Date(connection.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30)
    );

    // Get interaction frequency from messages
    const { data: messages } = await supabase
      .from('messages')
      .select('created_at')
      .or(`and(sender_id.eq.${userId},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${userId})`)
      .order('created_at', { ascending: false })
      .limit(20);

    const interactionFrequency = this.calculateInteractionFrequency(messages || []);
    
    // Calculate closeness level (1-10 scale)
    const closenessLevel = this.calculateClosenessLevel(
      connection.relationship_type,
      connectionAgeMonths,
      interactionFrequency
    );

    return {
      closeness_level: closenessLevel,
      relationship_duration_months: connectionAgeMonths,
      interaction_frequency: interactionFrequency,
      special_considerations: this.getSpecialConsiderations(connection),
    };
  }

  static async generateDynamicBudgetRecommendation(userId: string, recipientId: string, occasion: string) {
    // Get user's enhanced preferences and history
    const { data: profile } = await supabase
      .from('profiles')
      .select('enhanced_gift_preferences, enhanced_gifting_history')
      .eq('id', userId)
      .single();

    if (!profile) return null;

    // Get relationship context
    const relationshipContext = await this.analyzeRelationshipContext(userId, recipientId);
    
    // Get seasonal adjustments
    const seasonalFactors = this.getSeasonalAdjustments(occasion, new Date());
    
    // Calculate dynamic budget
    const prefs = (profile?.enhanced_gift_preferences as any) || {};
    const baseRange = prefs.preferred_price_ranges?.[occasion] || { min: 25, max: 100 };
    const relationshipMultiplier = relationshipContext?.closeness_level ? 
      (relationshipContext.closeness_level / 10) * 1.5 + 0.5 : 1.0;
    
    const adjustedBudget = {
      min: Math.round(baseRange.min * relationshipMultiplier * seasonalFactors.multiplier),
      max: Math.round(baseRange.max * relationshipMultiplier * seasonalFactors.multiplier),
    };

    return {
      budget: adjustedBudget,
      confidence: this.calculateBudgetConfidence(profile.enhanced_gifting_history, relationshipContext),
      reasoning: {
        relationship_factor: relationshipMultiplier,
        seasonal_factor: seasonalFactors.multiplier,
        base_range: baseRange,
      },
    };
  }

  // Phase 3: Predictive Intelligence
  static async predictUpcomingGiftOpportunities(userId: string): Promise<PredictiveGiftOpportunity[]> {
    // Get user's connections and their special dates
    const { data: connections } = await supabase
      .from('user_connections')
      .select(`
        connected_user_id,
        relationship_type,
        user_special_dates!inner(date, date_type)
      `)
      .eq('user_id', userId)
      .eq('status', 'accepted');

    if (!connections) return [];

    const opportunities: PredictiveGiftOpportunity[] = [];
    const now = new Date();
    const futureDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days ahead

    for (const connection of connections) {
      // Parse and check upcoming dates
      for (const specialDate of connection.user_special_dates || []) {
        const eventDate = this.parseSpecialDate(specialDate.date);
        
        if (eventDate && eventDate > now && eventDate < futureDate) {
          const budget = await this.generateDynamicBudgetRecommendation(
            userId, 
            connection.connected_user_id, 
            specialDate.date_type
          );

          const categories = await this.predictGiftCategories(
            userId, 
            connection.connected_user_id, 
            specialDate.date_type
          );

          opportunities.push({
            event_date: eventDate.toISOString(),
            event_type: specialDate.date_type,
            recipient_id: connection.connected_user_id,
            confidence_score: this.calculateOpportunityConfidence(connection, specialDate),
            suggested_budget: budget?.budget || { min: 25, max: 100 },
            recommended_categories: categories,
            optimal_purchase_timing: this.calculateOptimalPurchaseTiming(eventDate),
          });
        }
      }
    }

    return opportunities.sort((a, b) => 
      new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
    );
  }

  static async predictGiftCategories(userId: string, recipientId: string, occasion: string): Promise<string[]> {
    // Get recipient's public preferences and wishlists
    const { data: recipientProfile } = await supabase
      .from('profiles')
      .select('enhanced_gift_preferences, interests')
      .eq('id', recipientId)
      .single();

    const { data: wishlists } = await supabase
      .from('wishlists')
      .select('category, wishlist_items(brand)')
      .eq('user_id', recipientId)
      .eq('is_public', true);

    // Get user's gifting history for this recipient type
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('enhanced_gifting_history')
      .eq('id', userId)
      .single();

    // Analyze and predict categories
    const categories = new Set<string>();

    const interests = (recipientProfile?.interests as any[]) || [];
    interests.forEach((interest: any) => {
      categories.add(this.mapInterestToCategory(String(interest)));
    });

    // From recipient's wishlist patterns
    if (wishlists) {
      wishlists.forEach(wishlist => {
        if (wishlist.category) categories.add(wishlist.category);
      });
    }

    const giftHistory = (userProfile?.enhanced_gifting_history as any) || {};
    if (giftHistory.category_success_rates) {
      Object.entries(giftHistory.category_success_rates)
        .filter(([_, data]: [string, any]) => (data as any).success_rate > 0.7)
        .forEach(([category]) => categories.add(category));
    }

    return Array.from(categories).slice(0, 5);
  }

  static async optimizeGiftTiming(eventDate: Date, recipientId: string): Promise<string> {
    // Analyze recipient's preferences and past delivery patterns
    const { data: profile } = await supabase
      .from('profiles')
      .select('enhanced_gift_preferences')
      .eq('id', recipientId)
      .single();

    const preferences = (profile?.enhanced_gift_preferences as any)?.gift_timing_preferences;
    const advanceDays = preferences?.advance_notice_days || 3;
    
    const optimalDate = new Date(eventDate.getTime() - advanceDays * 24 * 60 * 60 * 1000);
    return optimalDate.toISOString();
  }

  // Helper methods
  private static async enhanceRuleWithIntelligence(rule: EnhancedAutoGiftingRule): Promise<EnhancedAutoGiftingRule> {
    const relationshipContext = await this.analyzeRelationshipContext(rule.user_id, rule.recipient_id);
    
    return {
      ...rule,
      relationship_context: relationshipContext || {
        closeness_level: 5,
        relationship_duration_months: 12,
        interaction_frequency: "regular",
        special_considerations: [],
      },
      recipient_lifestyle_factors: {
        life_stage: "adult",
        current_situation: "stable",
        interests_evolution: [],
        lifestyle_changes: [],
      },
      seasonal_adjustment_factors: {
        holiday_multiplier: 1.2,
        birthday_month_boost: 1.1,
        seasonal_preferences: {},
        timing_optimizations: {},
      },
      success_metrics: {
        past_gift_success_rate: 0,
        recipient_satisfaction_score: 0,
        budget_efficiency: 0,
        timing_accuracy: 0,
      },
    };
  }

  private static calculateInteractionFrequency(messages: any[]): string {
    if (!messages.length) return "rare";
    
    const recentMessages = messages.filter(m => 
      new Date(m.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );
    
    if (recentMessages.length > 10) return "very_frequent";
    if (recentMessages.length > 5) return "frequent";
    if (recentMessages.length > 2) return "regular";
    return "occasional";
  }

  private static calculateClosenessLevel(relationshipType: string, ageMonths: number, frequency: string): number {
    let base = 5;
    
    // Relationship type modifier
    switch (relationshipType) {
      case 'family': base = 9; break;
      case 'close_friend': base = 8; break;
      case 'friend': base = 6; break;
      case 'colleague': base = 4; break;
      default: base = 3;
    }
    
    // Age modifier
    if (ageMonths > 24) base += 1;
    if (ageMonths > 60) base += 1;
    
    // Frequency modifier
    switch (frequency) {
      case 'very_frequent': base += 2; break;
      case 'frequent': base += 1; break;
      case 'occasional': base -= 1; break;
      case 'rare': base -= 2; break;
    }
    
    return Math.max(1, Math.min(10, base));
  }

  private static getSpecialConsiderations(connection: any): string[] {
    const considerations: string[] = [];
    
    if (connection.relationship_type === 'family') {
      considerations.push('family_bond');
    }
    
    if (connection.data_access_permissions?.gift_preferences) {
      considerations.push('shared_preferences');
    }
    
    return considerations;
  }

  private static getSeasonalAdjustments(occasion: string, date: Date) {
    const month = date.getMonth();
    let multiplier = 1.0;
    
    // Holiday season boost
    if (month === 11) multiplier = 1.3; // December
    if (month === 10) multiplier = 1.2; // November
    
    // Birthday month boost
    if (occasion === 'birthday') multiplier *= 1.1;
    
    return { multiplier };
  }

  private static calculateBudgetConfidence(giftingHistory: any, relationshipContext: any): number {
    let confidence = 0.5; // Base confidence
    
    if (giftingHistory?.category_success_rates) {
      const rates = Object.values(giftingHistory.category_success_rates) as any[];
      const avgSuccessRate = rates.length > 0 ? 
        rates.reduce((sum: number, rate: any) => sum + (rate.success_rate || 0), 0) / rates.length : 0;
      confidence += avgSuccessRate * 0.3;
    }
    
    if (relationshipContext?.closeness_level) {
      confidence += (relationshipContext.closeness_level / 10) * 0.2;
    }
    
    return Math.min(1.0, confidence);
  }

  private static parseSpecialDate(dateStr: string): Date | null {
    try {
      // Handle MM-DD format
      if (dateStr.match(/^\d{2}-\d{2}$/)) {
        const [month, day] = dateStr.split('-').map(Number);
        const currentYear = new Date().getFullYear();
        const date = new Date(currentYear, month - 1, day);
        
        // If the date has passed this year, use next year
        if (date < new Date()) {
          date.setFullYear(currentYear + 1);
        }
        
        return date;
      }
      
      return new Date(dateStr);
    } catch {
      return null;
    }
  }

  private static calculateOpportunityConfidence(connection: any, specialDate: any): number {
    let confidence = 0.7; // Base confidence
    
    // Relationship type boost
    if (connection.relationship_type === 'family') confidence += 0.2;
    if (connection.relationship_type === 'close_friend') confidence += 0.15;
    
    // Date type boost
    if (specialDate.date_type === 'birthday') confidence += 0.1;
    if (specialDate.date_type === 'anniversary') confidence += 0.05;
    
    return Math.min(1.0, confidence);
  }

  private static calculateOptimalPurchaseTiming(eventDate: Date): string {
    // Calculate optimal purchase time (typically 3-7 days before)
    const optimalDate = new Date(eventDate.getTime() - 5 * 24 * 60 * 60 * 1000);
    return optimalDate.toISOString();
  }

  private static mapInterestToCategory(interest: string): string {
    const mapping: { [key: string]: string } = {
      'technology': 'Electronics',
      'books': 'Books & Media',
      'music': 'Entertainment',
      'sports': 'Sports & Outdoors',
      'cooking': 'Home & Kitchen',
      'fashion': 'Clothing & Accessories',
      'travel': 'Travel & Experience',
      'art': 'Arts & Crafts',
      'gaming': 'Gaming',
      'fitness': 'Health & Fitness',
    };
    
    return mapping[interest.toLowerCase()] || 'General';
  }
}