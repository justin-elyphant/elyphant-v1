import { supabase } from "@/integrations/supabase/client";
import { enhancedZincApiService } from "./enhancedZincApiService";
import { unifiedProfileService } from "./unifiedProfileService";
import { toast } from "sonner";

// Core Interfaces
export interface UnifiedGiftRule {
  id: string;
  user_id: string;
  recipient_id: string;
  date_type: string;
  event_id?: string;
  is_active: boolean;
  budget_limit?: number;
  gift_message?: string;
  notification_preferences: {
    enabled: boolean;
    days_before: number[];
    email: boolean;
    push: boolean;
  };
  gift_selection_criteria: {
    source: "wishlist" | "ai" | "both" | "specific";
    max_price?: number;
    min_price?: number;
    categories: string[];
    exclude_items: string[];
    specific_product_id?: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface UnifiedGiftSettings {
  id: string;
  user_id: string;
  default_budget_limit: number;
  default_notification_days: number[];
  email_notifications: boolean;
  push_notifications: boolean;
  auto_approve_gifts: boolean;
  default_gift_source: "wishlist" | "ai" | "both" | "specific";
  budget_tracking: {
    monthly_limit?: number;
    annual_limit?: number;
    spent_this_month: number;
    spent_this_year: number;
  };
  created_at?: string;
  updated_at?: string;
}

export interface UnifiedGiftExecution {
  id: string;
  rule_id: string;
  event_id: string;
  user_id: string;
  execution_date: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  selected_products?: any[];
  total_amount?: number;
  order_id?: string;
  error_message?: string;
  retry_count: number;
  next_retry_at?: Date;
  created_at: Date;
  updated_at: Date;
  // Selection tier used for this execution
  selection_tier?: 'wishlist' | 'preferences' | 'metadata' | 'ai_guess';
  // Optional joined fields
  auto_gifting_rules?: any;
  user_special_dates?: any;
}

export interface GiftTimingPreferences {
  autoGiftingEnabled: boolean;
  defaultBudgetLimit: number;
  defaultNotificationDays: number[];
  preferredDeliveryTimeframe: string;
  defaultGiftMessage?: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export interface ScheduledGiftEvent {
  id: string;
  type: 'automated' | 'manual';
  userId: string;
  recipientId?: string;
  scheduledDate: Date;
  eventType?: string;
  giftOptions: {
    budget?: number;
    giftMessage?: string;
    isHidden?: boolean;
  };
  status: 'scheduled' | 'processed' | 'cancelled';
}

export interface HierarchicalGiftSelection {
  tier: 'wishlist' | 'preferences' | 'metadata' | 'ai_guess';
  products: any[];
  confidence: number;
  reasoning: string;
}

class UnifiedGiftAutomationService {

  // ============= HIERARCHICAL GIFT SELECTION ============= 

  /**
   * Main hierarchical gift selection algorithm
   * Tier 1: Wishlist -> Tier 2: Preferences -> Tier 3: Metadata -> Tier 4: AI Guess
   */
  async selectGiftForRecipient(
    recipientId: string, 
    budget: number, 
    occasion: string,
    categories: string[] = []
  ): Promise<HierarchicalGiftSelection> {
    console.log(`🎁 Starting hierarchical gift selection for recipient ${recipientId}, budget: $${budget}, occasion: ${occasion}`);
    
    try {
      // Tier 1: Check recipient's public wishlist first
      const wishlistGifts = await this.getWishlistGifts(recipientId, budget);
      if (wishlistGifts.length > 0) {
        console.log(`✅ Tier 1: Found ${wishlistGifts.length} wishlist items`);
        return {
          tier: 'wishlist',
          products: wishlistGifts,
          confidence: 0.95,
          reasoning: 'Selected from recipient\'s public wishlist - highest confidence'
        };
      }
      
      // Tier 2: Use recipient preferences  
      const preferenceGifts = await this.getPreferenceBasedGifts(recipientId, budget, occasion, categories);
      if (preferenceGifts.length > 0) {
        console.log(`✅ Tier 2: Found ${preferenceGifts.length} preference-based items`);
        return {
          tier: 'preferences',
          products: preferenceGifts,
          confidence: 0.75,
          reasoning: 'Selected based on recipient\'s stated preferences and interests'
        };
      }
      
      // Tier 3: Use metadata inference
      const metadataGifts = await this.getMetadataBasedGifts(recipientId, budget, occasion, categories);
      if (metadataGifts.length > 0) {
        console.log(`✅ Tier 3: Found ${metadataGifts.length} metadata-based items`);
        return {
          tier: 'metadata',
          products: metadataGifts,
          confidence: 0.60,
          reasoning: 'Selected based on recipient\'s profile data and interaction patterns'
        };
      }
      
      // Tier 4: AI-powered best guess
      const aiGifts = await this.getAIGuessedGifts(recipientId, budget, occasion, categories);
      console.log(`✅ Tier 4: Generated ${aiGifts.length} AI-suggested items`);
      return {
        tier: 'ai_guess',
        products: aiGifts,
        confidence: 0.40,
        reasoning: 'AI-generated suggestions based on general demographic and occasion patterns'
      };
      
    } catch (error) {
      console.error('❌ Error in hierarchical gift selection:', error);
      throw new Error(`Gift selection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Tier 1: Get gifts from recipient's public wishlist
   */
  private async getWishlistGifts(recipientId: string, budget: number): Promise<any[]> {
    try {
      const { data: wishlists, error } = await supabase
        .from('wishlists')
        .select(`
          *,
          wishlist_items (
            id,
            product_id,
            name,
            price,
            image_url,
            category,
            brand,
            retailer,
            is_purchased
          )
        `)
        .eq('user_id', recipientId)
        .eq('is_public', true)
        .eq('is_active', true);

      if (error || !wishlists) return [];

      const wishlistItems: any[] = [];
      wishlists.forEach(wishlist => {
        if (wishlist.wishlist_items) {
          wishlist.wishlist_items.forEach((item: any) => {
            if (!item.is_purchased && item.price && item.price <= budget) {
              wishlistItems.push({
                product_id: item.product_id,
                title: item.name,
                price: parseFloat(item.price),
                image: item.image_url,
                category: item.category,
                brand: item.brand,
                retailer: item.retailer,
                source: 'wishlist',
                confidence: 0.95
              });
            }
          });
        }
      });

      return wishlistItems.slice(0, 5); // Top 5 wishlist items
    } catch (error) {
      console.error('Error fetching wishlist gifts:', error);
      return [];
    }
  }

  /**
   * Tier 2: Get gifts based on recipient's stated preferences
   */
  private async getPreferenceBasedGifts(recipientId: string, budget: number, occasion: string, categories: string[]): Promise<any[]> {
    try {
      // Get recipient's profile with preferences
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('gift_preferences, interests')
        .eq('id', recipientId)
        .single();

      if (error || !profile) return [];

      // Build search query from preferences
      const searchTerms = [];
      
      // Add gift preferences
      if (profile.gift_preferences && Array.isArray(profile.gift_preferences)) {
        profile.gift_preferences.forEach((pref: any) => {
          if (typeof pref === 'string') {
            searchTerms.push(pref);
          } else if (pref.category) {
            searchTerms.push(pref.category);
          }
        });
      }

      // Add interests
      if (profile.interests && Array.isArray(profile.interests)) {
        searchTerms.push(...profile.interests);
      }

      // Add provided categories
      searchTerms.push(...categories);

      if (searchTerms.length === 0) return [];

      // Search for products based on preferences
      const query = `${searchTerms.slice(0, 3).join(' ')} ${occasion} gift`;
      const searchResult = await enhancedZincApiService.searchProducts(query, 1, 15);
      
      if (!searchResult.results) return [];

      return this.filterAndRankProducts(searchResult.results, budget, 'preferences');
    } catch (error) {
      console.error('Error fetching preference-based gifts:', error);
      return [];
    }
  }

  /**
   * Tier 3: Get gifts based on recipient's metadata and profile data
   */
  private async getMetadataBasedGifts(recipientId: string, budget: number, occasion: string, categories: string[]): Promise<any[]> {
    try {
      // Get recipient's profile metadata
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('bio, birth_year, profile_type')
        .eq('id', recipientId)
        .single();

      if (error || !profile) return [];

      // Infer preferences from metadata
      const searchTerms = [];
      
      // Age-based suggestions
      if (profile.birth_year) {
        const age = new Date().getFullYear() - profile.birth_year;
        if (age < 25) {
          searchTerms.push('trendy', 'tech', 'college');
        } else if (age < 40) {
          searchTerms.push('professional', 'lifestyle', 'home');
        } else if (age < 60) {
          searchTerms.push('quality', 'comfort', 'family');
        } else {
          searchTerms.push('classic', 'wellness', 'hobby');
        }
      }

      // Bio-based keywords (simple keyword extraction)
      if (profile.bio) {
        const bioKeywords = profile.bio.toLowerCase().match(/\b(travel|music|art|books|cooking|fitness|photography|gaming|coffee|wine|gardening|sports)\b/g);
        if (bioKeywords) {
          searchTerms.push(...bioKeywords.slice(0, 2));
        }
      }

      // Add categories and occasion
      searchTerms.push(...categories, occasion);

      if (searchTerms.length === 0) {
        // Fallback to occasion-based search
        const query = `${occasion} gift popular`;
        const searchResult = await enhancedZincApiService.searchProducts(query, 1, 15);
        return searchResult.results ? this.filterAndRankProducts(searchResult.results, budget, 'metadata') : [];
      }

      const query = `${searchTerms.slice(0, 3).join(' ')} gift`;
      const searchResult = await enhancedZincApiService.searchProducts(query, 1, 15);
      
      return searchResult.results ? this.filterAndRankProducts(searchResult.results, budget, 'metadata') : [];
    } catch (error) {
      console.error('Error fetching metadata-based gifts:', error);
      return [];
    }
  }

  /**
   * Tier 4: AI-powered best guess based on demographic and occasion patterns
   */
  private async getAIGuessedGifts(recipientId: string, budget: number, occasion: string, categories: string[]): Promise<any[]> {
    try {
      // Fallback to popular/trending items for the occasion and budget
      const occasionQueries = {
        'birthday': 'birthday gift popular trending',
        'anniversary': 'anniversary gift romantic popular',
        'wedding': 'wedding gift classic popular',
        'graduation': 'graduation gift practical popular',
        'holiday': 'holiday gift popular trending',
        'christmas': 'christmas gift popular bestseller',
        'valentines': 'valentine gift romantic popular'
      };

      const occasionType = occasion.toLowerCase();
      let query = occasionQueries[occasionType as keyof typeof occasionQueries] || 'popular gift bestseller';
      
      // Add categories if provided
      if (categories.length > 0) {
        query = `${categories[0]} ${query}`;
      }

      const searchResult = await enhancedZincApiService.searchProducts(query, 1, 20);
      
      if (!searchResult.results) {
        // Ultimate fallback
        const fallbackResult = await enhancedZincApiService.searchProducts('gift popular', 1, 10);
        return fallbackResult.results ? this.filterAndRankProducts(fallbackResult.results, budget, 'ai_guess') : [];
      }

      return this.filterAndRankProducts(searchResult.results, budget, 'ai_guess');
    } catch (error) {
      console.error('Error generating AI gift suggestions:', error);
      return [];
    }
  }

  /**
   * Filter and rank products based on budget and source tier
   */
  private filterAndRankProducts(products: any[], budget: number, source: string): any[] {
    // Filter by budget
    let affordableProducts = products.filter(product => {
      const price = parseFloat(product.price) || 0;
      return price > 0 && price <= budget;
    });

    // Sort by rating and review count
    affordableProducts.sort((a, b) => {
      const aRating = parseFloat(a.stars) || 0;
      const bRating = parseFloat(b.stars) || 0;
      const aReviews = parseInt(a.num_reviews) || 0;
      const bReviews = parseInt(b.num_reviews) || 0;
      
      // Prioritize higher ratings, then higher review counts
      if (aRating !== bRating) return bRating - aRating;
      return bReviews - aReviews;
    });

    // Return top products with metadata
    return affordableProducts.slice(0, 5).map(product => ({
      product_id: product.product_id,
      title: product.title,
      price: parseFloat(product.price),
      image: product.image,
      category: product.category,
      brand: product.brand,
      retailer: product.retailer,
      rating: parseFloat(product.stars) || 0,
      review_count: parseInt(product.num_reviews) || 0,
      source,
      confidence: source === 'wishlist' ? 0.95 : source === 'preferences' ? 0.75 : source === 'metadata' ? 0.60 : 0.40
    }));
  }

  // ============= RULE MANAGEMENT ============= 

  /**
   * Create a new auto-gifting rule with protection measures
   */
  async createRule(rule: Omit<UnifiedGiftRule, 'id' | 'created_at' | 'updated_at'>): Promise<UnifiedGiftRule> {
    // Validate user consent and permissions
    await this.validateUserConsent(rule.user_id);
    
    // Validate budget limits
    await this.validateBudgetLimits(rule.user_id, rule.budget_limit || 0);

    const { data, error } = await supabase
      .from('auto_gifting_rules')
      .insert(rule)
      .select()
      .single();

    if (error) throw error;
    
    // Log rule creation for audit
    await this.logGiftAutomationActivity(rule.user_id, 'rule_created', { rule_id: data.id });
    
    return data;
  }

  /**
   * Update an existing auto-gifting rule
   */
  async updateRule(id: string, updates: Partial<UnifiedGiftRule>): Promise<UnifiedGiftRule> {
    const { data, error } = await supabase
      .from('auto_gifting_rules')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete an auto-gifting rule
   */
  async deleteRule(id: string): Promise<void> {
    const { error } = await supabase
      .from('auto_gifting_rules')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Get all rules for a user
   */
  async getUserRules(userId: string): Promise<UnifiedGiftRule[]> {
    const { data, error } = await supabase
      .from('auto_gifting_rules')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  }

  // ============= SETTINGS MANAGEMENT ============= 

  /**
   * Get user settings
   */
  async getSettings(userId: string): Promise<UnifiedGiftSettings | null> {
    const { data, error } = await supabase
      .from('auto_gifting_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /**
   * Upsert user settings
   */
  async upsertSettings(settings: Omit<UnifiedGiftSettings, 'id' | 'created_at' | 'updated_at'>): Promise<UnifiedGiftSettings> {
    const { data, error } = await supabase
      .from('auto_gifting_settings')
      .upsert(settings, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ============= EXECUTION MANAGEMENT ============= 

  /**
   * Process pending executions with hierarchical selection
   */
  async processPendingExecutions(userId: string): Promise<void> {
    console.log(`🔄 Processing pending auto-gift executions for user ${userId}`);
    
    try {
      // Get all pending executions for this user
      const { data: executions, error } = await supabase
        .from('automated_gift_executions')
        .select(`
          *,
          auto_gifting_rules (*),
          user_special_dates (*)
        `)
        .eq('user_id', userId)
        .eq('status', 'pending');

      if (error) throw error;
      
      for (const execution of executions || []) {
        try {
          console.log(`📦 Processing execution ${execution.id}`);
          
          // Use hierarchical gift selection
          const giftSelection = await this.selectGiftForRecipient(
            execution.auto_gifting_rules.recipient_id,
            execution.auto_gifting_rules.budget_limit || 50,
            execution.user_special_dates.date_type || 'birthday',
            execution.auto_gifting_rules.gift_selection_criteria?.categories || []
          );
          
          const totalAmount = giftSelection.products.reduce((sum, product) => sum + product.price, 0);
          
          // Update execution with selected products and tier used
          await supabase
            .from('automated_gift_executions')
            .update({
              selected_products: giftSelection.products,
              total_amount: totalAmount,
              selection_tier: giftSelection.tier,
              status: execution.auto_gifting_rules.auto_approve_gifts ? 'processing' : 'pending',
              updated_at: new Date().toISOString()
            })
            .eq('id', execution.id);
            
          console.log(`✅ Updated execution ${execution.id} with ${giftSelection.products.length} products from ${giftSelection.tier} tier`);
          
          // Send notification
          await this.sendGiftNotification(userId, {
            type: 'gift_suggestions_ready',
            executionId: execution.id,
            tier: giftSelection.tier,
            productCount: giftSelection.products.length,
            confidence: giftSelection.confidence,
            reasoning: giftSelection.reasoning
          });
          
        } catch (error) {
          console.error(`❌ Failed to process execution ${execution.id}:`, error);
          
          // Update execution with error
          await supabase
            .from('automated_gift_executions')
            .update({
              status: 'failed',
              error_message: error instanceof Error ? error.message : 'Unknown error',
              retry_count: execution.retry_count + 1,
              updated_at: new Date().toISOString()
            })
            .eq('id', execution.id);
        }
      }
      
    } catch (error) {
      console.error('❌ Error processing pending executions:', error);
      throw error;
    }
  }

  /**
   * Get executions for a user
   */
  async getUserExecutions(userId: string): Promise<UnifiedGiftExecution[]> {
    const { data, error } = await supabase
      .from('automated_gift_executions')
      .select(`
        *,
        auto_gifting_rules (*),
        user_special_dates (*)
      `)
      .eq('user_id', userId)
      .order('execution_date', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(execution => ({
      ...execution,
      execution_date: new Date(execution.execution_date),
      next_retry_at: execution.next_retry_at ? new Date(execution.next_retry_at) : undefined,
      created_at: new Date(execution.created_at),
      updated_at: new Date(execution.updated_at)
    }));
  }

  /**
   * Approve execution with selected products
   */
  async approveExecution(executionId: string, selectedProductIds: string[]): Promise<void> {
    const { error } = await supabase
      .from('automated_gift_executions')
      .update({
        status: 'processing',
        selected_products: selectedProductIds,
        updated_at: new Date().toISOString()
      })
      .eq('id', executionId);

    if (error) throw error;
    
    console.log(`✅ Auto-gift execution ${executionId} approved for processing`);
  }

  // ============= TIMING AND SCHEDULING ============= 

  /**
   * Get comprehensive gift timing preferences
   */
  async getUserGiftTimingPreferences(userId: string): Promise<GiftTimingPreferences> {
    const settings = await this.getSettings(userId);
    
    return {
      autoGiftingEnabled: !!settings?.auto_approve_gifts,
      defaultBudgetLimit: settings?.default_budget_limit || 50,
      defaultNotificationDays: settings?.default_notification_days || [7, 3, 1],
      preferredDeliveryTimeframe: 'standard',
      emailNotifications: settings?.email_notifications ?? true,
      pushNotifications: settings?.push_notifications ?? false,
    };
  }

  /**
   * Get all scheduled gifts (automated and manual)
   */
  async getUserScheduledGifts(userId: string): Promise<ScheduledGiftEvent[]> {
    const scheduledGifts: ScheduledGiftEvent[] = [];

    // Get automated gifts from rules
    const rules = await this.getUserRules(userId);
    for (const rule of rules.filter(r => r.is_active)) {
      if (rule.event_id) {
        const { data: events } = await supabase
          .from('user_special_dates')
          .select('*')
          .eq('id', rule.event_id);

        if (events) {
          events.forEach(event => {
            scheduledGifts.push({
              id: `auto-${rule.id}`,
              type: 'automated',
              userId,
              recipientId: rule.recipient_id,
              scheduledDate: new Date(event.date),
              eventType: event.date_type,
              giftOptions: {
                budget: rule.budget_limit || undefined,
              },
              status: 'scheduled'
            });
          });
        }
      }
    }

    // Get manual scheduled gifts from orders
    const { data: scheduledOrders } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .not('scheduled_delivery_date', 'is', null)
      .eq('status', 'pending');

    if (scheduledOrders) {
      scheduledOrders.forEach(order => {
        scheduledGifts.push({
          id: `manual-${order.id}`,
          type: 'manual',
          userId,
          scheduledDate: new Date(order.scheduled_delivery_date!),
          giftOptions: {
            giftMessage: order.gift_message || undefined,
            isHidden: order.is_surprise_gift || false,
          },
          status: 'scheduled'
        });
      });
    }

    return scheduledGifts.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
  }

  /**
   * Get upcoming gift reminders
   */
  async getUpcomingGiftReminders(userId: string, daysAhead: number = 7): Promise<ScheduledGiftEvent[]> {
    const allScheduled = await this.getUserScheduledGifts(userId);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

    return allScheduled.filter(gift => 
      gift.scheduledDate <= cutoffDate && 
      gift.scheduledDate >= new Date() &&
      gift.status === 'scheduled'
    );
  }

  // ============= PROTECTION MEASURES ============= 

  /**
   * Validate user consent for auto-gifting
   */
  private async validateUserConsent(userId: string): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user || user.user.id !== userId) {
      throw new Error('Unauthorized: User consent validation failed');
    }
    
    const settings = await this.getSettings(userId);
    if (!settings) {
      throw new Error('Auto-gifting settings must be configured before creating rules');
    }
  }

  /**
   * Validate budget limits and spending
   */
  private async validateBudgetLimits(userId: string, amount: number): Promise<void> {
    const settings = await this.getSettings(userId);
    if (!settings) return;

    const { budget_tracking } = settings;
    
    if (budget_tracking.monthly_limit && 
        budget_tracking.spent_this_month + amount > budget_tracking.monthly_limit) {
      throw new Error('Gift amount would exceed monthly spending limit');
    }
    
    if (budget_tracking.annual_limit && 
        budget_tracking.spent_this_year + amount > budget_tracking.annual_limit) {
      throw new Error('Gift amount would exceed annual spending limit');
    }
  }

  /**
   * Log automation activity for audit trail
   */
  private async logGiftAutomationActivity(userId: string, activity: string, details: any): Promise<void> {
    await supabase
      .from('auto_gift_data_access')
      .insert({
        user_id: userId,
        accessed_data_type: 'automation_activity',
        access_reason: activity,
        data_points_accessed: details
      });
  }

  /**
   * Send gift-related notifications
   */
  private async sendGiftNotification(userId: string, notification: any): Promise<void> {
    await supabase
      .from('auto_gift_notifications')
      .insert({
        user_id: userId,
        notification_type: notification.type,
        title: this.getNotificationTitle(notification),
        message: this.getNotificationMessage(notification),
        execution_id: notification.executionId
      });

    // Show toast for immediate feedback
    toast.success("Auto-gift suggestions ready", {
      description: `Found ${notification.productCount} gift options using ${notification.tier} selection (${Math.round(notification.confidence * 100)}% confidence)`
    });
  }

  private getNotificationTitle(notification: any): string {
    switch (notification.type) {
      case 'gift_suggestions_ready': return 'Gift Suggestions Ready';
      case 'budget_warning': return 'Budget Limit Warning';
      case 'execution_failed': return 'Auto-Gift Failed';
      default: return 'Auto-Gift Update';
    }
  }

  private getNotificationMessage(notification: any): string {
    switch (notification.type) {
      case 'gift_suggestions_ready': 
        return `Found ${notification.productCount} gift options using ${notification.tier} selection. ${notification.reasoning}`;
      case 'budget_warning': 
        return 'Your auto-gift budget limit is approaching. Review your settings.';
      case 'execution_failed': 
        return 'Failed to process auto-gift. Please review and try again.';
      default: 
        return 'Auto-gift system update';
    }
  }

  // ============= SYSTEM STATS ============= 

  /**
   * Get system statistics for dashboard
   */
  async getSystemStats(userId: string) {
    const [scheduledGifts, executions, settings] = await Promise.all([
      this.getUserScheduledGifts(userId),
      this.getUserExecutions(userId),
      this.getSettings(userId)
    ]);

    const automatedCount = scheduledGifts.filter(g => g.type === 'automated').length;
    const manualCount = scheduledGifts.filter(g => g.type === 'manual').length;
    const upcomingCount = (await this.getUpcomingGiftReminders(userId, 7)).length;
    
    return {
      totalScheduled: scheduledGifts.length,
      automatedGifts: automatedCount,
      manualScheduled: manualCount,
      upcomingInWeek: upcomingCount,
      totalExecutions: executions.length,
      pendingExecutions: executions.filter(e => e.status === 'pending').length,
      completedExecutions: executions.filter(e => e.status === 'completed').length,
      budgetUsed: settings?.budget_tracking.spent_this_month || 0,
      budgetLimit: settings?.budget_tracking.monthly_limit || null
    };
  }
}

// Export singleton instance
export const unifiedGiftAutomationService = new UnifiedGiftAutomationService();