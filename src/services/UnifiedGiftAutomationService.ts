import { supabase } from "@/integrations/supabase/client";
import { protectedAutoGiftingService } from "./protected-auto-gifting-service";
import { unifiedProfileService } from "./profiles/UnifiedProfileService";
import { recipientAddressResolver } from "./recipientAddressResolver";
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
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'address_required' | 'pending_address';
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
  // Address resolution metadata
  address_metadata?: {
    source?: 'user_verified' | 'giver_provided' | 'missing';
    is_verified?: boolean;
    needs_confirmation?: boolean;
    connection_id?: string;
  };
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
   * Main hierarchical gift selection algorithm with protection measures
   * Tier 1: Wishlist -> Tier 2: Preferences -> Tier 3: Metadata -> Tier 4: AI Guess
   */
  async selectGiftForRecipient(
    recipientId: string, 
    budget: number, 
    occasion: string,
    categories: string[] = [],
    userId?: string
  ): Promise<HierarchicalGiftSelection> {
    console.log(`🎁 Starting hierarchical gift selection for recipient ${recipientId}, budget: $${budget}, occasion: ${occasion}`);
    
    // Check emergency circuit breaker first
    if (!await protectedAutoGiftingService.checkEmergencyCircuitBreaker()) {
      console.log('🚨 Emergency circuit breaker active - returning empty results');
      return {
        tier: 'ai_guess',
        products: [],
        confidence: 0,
        reasoning: 'Auto-gifting temporarily disabled due to budget limits'
      };
    }
    
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
      
      // Tier 2: Use recipient preferences with user context
      const preferenceGifts = await this.getPreferenceBasedGifts(recipientId, budget, occasion, categories, userId);
      if (preferenceGifts.length > 0) {
        console.log(`✅ Tier 2: Found ${preferenceGifts.length} preference-based items`);
        return {
          tier: 'preferences',
          products: preferenceGifts,
          confidence: 0.75,
          reasoning: 'Selected based on recipient\'s stated preferences and interests'
        };
      }
      
      // Tier 3: Use metadata inference with user context
      const metadataGifts = await this.getMetadataBasedGifts(recipientId, budget, occasion, categories, userId);
      if (metadataGifts.length > 0) {
        console.log(`✅ Tier 3: Found ${metadataGifts.length} metadata-based items`);
        return {
          tier: 'metadata',
          products: metadataGifts,
          confidence: 0.60,
          reasoning: 'Selected based on recipient\'s profile data and interaction patterns'
        };
      }
      
      // Tier 4: AI-powered best guess with user context
      const aiGifts = await this.getAIGuessedGifts(recipientId, budget, occasion, categories, userId);
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
            image_url
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
            if (item.price && item.price <= budget) {
              wishlistItems.push({
                product_id: item.product_id,
                title: item.name,
                price: parseFloat(item.price),
                image: item.image_url,
                category: 'Wishlist Item', // Default category for wishlist items
                brand: 'Unknown', // Default brand
                retailer: 'Unknown', // Default retailer
                source: 'wishlist',
                confidence: 0.95
              });
            }
          });
        }
      });

      return this.enforceGiftBudget(wishlistItems, budget);
    } catch (error) {
      console.error('Error fetching wishlist gifts:', error);
      return [];
    }
  }

  /**
   * Tier 2: Get gifts based on recipient's stated preferences
   */
  private async getPreferenceBasedGifts(recipientId: string, budget: number, occasion: string, categories: string[], userId?: string): Promise<any[]> {
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

      // Search for products based on preferences using protected service
      const query = `${searchTerms.slice(0, 3).join(' ')} ${occasion} gift`;
      const priority = protectedAutoGiftingService.isPriorityOccasion(occasion) ? 'high' : 'normal';
      const searchResults = await protectedAutoGiftingService.searchProductsForAutoGifting(
        userId || 'system',
        query, 
        15,
        priority
      );
      
      if (!searchResults || searchResults.length === 0) return [];

      return this.filterAndRankProducts(searchResults, budget, 'preferences');
    } catch (error) {
      console.error('Error fetching preference-based gifts:', error);
      return [];
    }
  }

  /**
   * Tier 3: Get gifts based on recipient's metadata and profile data
   */
  private async getMetadataBasedGifts(recipientId: string, budget: number, occasion: string, categories: string[], userId?: string): Promise<any[]> {
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
        // Fallback to occasion-based search using protected service
        const query = `${occasion} gift popular`;
        const priority = protectedAutoGiftingService.isPriorityOccasion(occasion) ? 'high' : 'normal';
      const searchResults = await protectedAutoGiftingService.searchProductsForAutoGifting(
        userId || 'system',
        query, 
        15,
        priority
      );
        const filteredProducts = searchResults ? this.filterAndRankProducts(searchResults, budget, 'metadata') : [];
        return this.enforceGiftBudget(filteredProducts, budget);
      }

      const query = `${searchTerms.slice(0, 3).join(' ')} gift`;
      const priority = protectedAutoGiftingService.isPriorityOccasion(occasion) ? 'high' : 'normal';
        const searchResults = await protectedAutoGiftingService.searchProductsForAutoGifting(
          userId || 'system',
          query, 
          15,
          priority
        );
      
      const filteredProducts = searchResults ? this.filterAndRankProducts(searchResults, budget, 'metadata') : [];
      return this.enforceGiftBudget(filteredProducts, budget);
    } catch (error) {
      console.error('Error fetching metadata-based gifts:', error);
      return [];
    }
  }

  /**
   * Tier 4: AI-powered best guess based on demographic and occasion patterns
   */
  private async getAIGuessedGifts(recipientId: string, budget: number, occasion: string, categories: string[], userId?: string): Promise<any[]> {
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

      const priority = protectedAutoGiftingService.isPriorityOccasion(occasion) ? 'high' : 'normal';
      const searchResults = await protectedAutoGiftingService.searchProductsForAutoGifting(
        userId || 'system',
        query, 
        20,
        priority
      );
      
      if (!searchResults || searchResults.length === 0) {
        // Ultimate fallback using protected service
        const fallbackResults = await protectedAutoGiftingService.searchProductsForAutoGifting(
          userId || 'system',
          'gift popular', 
          10,
          priority
        );
        const filteredProducts = fallbackResults ? this.filterAndRankProducts(fallbackResults, budget, 'ai_guess') : [];
        return this.enforceGiftBudget(filteredProducts, budget);
      }

      const filteredProducts = this.filterAndRankProducts(searchResults, budget, 'ai_guess');
      return this.enforceGiftBudget(filteredProducts, budget);
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

  /**
   * Enforce budget limit by selecting products that fit within the budget
   */
  private enforceGiftBudget(products: any[], budgetLimit: number): any[] {
    if (!products || products.length === 0) return [];
    
    // Sort products by price (ascending) to prioritize affordable options
    const sortedProducts = [...products].sort((a, b) => a.price - b.price);
    const selectedProducts = [];
    let currentTotal = 0;
    
    for (const product of sortedProducts) {
      if (currentTotal + product.price <= budgetLimit) {
        selectedProducts.push(product);
        currentTotal += product.price;
      }
      
      // Stop if we have enough products or reached a reasonable selection
      if (selectedProducts.length >= 3) break;
    }
    
    // If no products fit, try to find the single most affordable option
    if (selectedProducts.length === 0 && sortedProducts.length > 0) {
      const cheapestProduct = sortedProducts[0];
      if (cheapestProduct.price <= budgetLimit) {
        selectedProducts.push(cheapestProduct);
      }
    }
    
    return selectedProducts;
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

  /**
   * Recover stuck executions for a specific user
   */
  private async recoverUserStuckExecutions(userId: string): Promise<void> {
    console.log(`🔧 Checking for stuck executions for user ${userId}`);
    
    try {
      // Find executions that have been in "processing" status for more than 30 minutes
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      
      const { data: stuckExecutions, error } = await supabase
        .from('automated_gift_executions')
        .select('id, rule_id, status, created_at, updated_at, retry_count')
        .eq('user_id', userId)
        .eq('status', 'processing')
        .lt('updated_at', thirtyMinutesAgo);

      if (error) {
        console.error('❌ Error querying stuck executions:', error);
        return;
      }

      if (!stuckExecutions || stuckExecutions.length === 0) {
        console.log('✅ No stuck executions found for user');
        return;
      }

      console.log(`🔧 Found ${stuckExecutions.length} stuck execution(s) for user ${userId}`);

      for (const execution of stuckExecutions) {
        const maxRetries = 3;
        const shouldRetry = (execution.retry_count || 0) < maxRetries;
        
        if (shouldRetry) {
          // Reset to pending for retry
          console.log(`🔄 Scheduling retry for execution ${execution.id}`);
          
          const { error: updateError } = await supabase
            .from('automated_gift_executions')
            .update({
              status: 'pending',
              retry_count: (execution.retry_count || 0) + 1,
              error_message: 'Recovered from stuck processing state',
              updated_at: new Date().toISOString()
            })
            .eq('id', execution.id);

          if (updateError) {
            console.error(`❌ Failed to update execution ${execution.id}:`, updateError);
          } else {
            console.log(`✅ Execution ${execution.id} reset to pending for retry`);
          }
        } else {
          // Mark as failed after max retries
          console.log(`❌ Marking execution ${execution.id} as failed after ${maxRetries} retries`);
          
          const { error: failError } = await supabase
            .from('automated_gift_executions')
            .update({
              status: 'failed',
              error_message: `Processing stuck and exceeded ${maxRetries} retry attempts`,
              updated_at: new Date().toISOString()
            })
            .eq('id', execution.id);

          if (failError) {
            console.error(`❌ Failed to mark execution ${execution.id} as failed:`, failError);
          }
        }
      }

    } catch (error) {
      console.error('❌ Error in user stuck execution recovery:', error);
    }
  }

  // ============= EXECUTION MANAGEMENT =============

  /**
   * Process pending executions with hierarchical selection and address resolution
   */
  async processPendingExecutions(userId: string): Promise<void> {
    console.log(`🔄 Processing pending auto-gift executions for user ${userId}`);
    
    try {
      // First check for stuck executions for this user
      await this.recoverUserStuckExecutions(userId);
      
      // Then process normally
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
          
          // Validate execution has required data
          if (!execution.auto_gifting_rules) {
            console.error(`❌ Missing rule data for execution ${execution.id}`);
            await supabase
              .from('automated_gift_executions')
              .update({
                status: 'failed',
                error_message: 'Auto-gifting rule no longer exists or is invalid',
                updated_at: new Date().toISOString()
              })
              .eq('id', execution.id);
            continue;
          }
          
          if (!execution.auto_gifting_rules.recipient_id) {
            console.error(`❌ Missing recipient for execution ${execution.id}`);
            await supabase
              .from('automated_gift_executions')
              .update({
                status: 'failed', 
                error_message: 'Recipient information is missing or invalid',
                updated_at: new Date().toISOString()
              })
              .eq('id', execution.id);
            continue;
          }
          
          // Step 1: Validate recipient address availability
          const addressResult = await this.validateRecipientAddress(
            userId, 
            execution.auto_gifting_rules.recipient_id
          );
          
          if (!addressResult.hasAddress) {
            console.log(`📍 No address available for execution ${execution.id}, status: ${addressResult.status}`);
            
            // Update execution status based on address availability
            await supabase
              .from('automated_gift_executions')
              .update({
                status: addressResult.status,
                error_message: addressResult.message,
                updated_at: new Date().toISOString()
              })
              .eq('id', execution.id);
              
            // Send address request if needed
            if (addressResult.needsAddressRequest && addressResult.recipientInfo) {
              await this.sendAddressRequest(userId, addressResult.recipientInfo);
            }
            
            continue;
          }
          
          // Step 2: Use hierarchical gift selection with user context for proper rate limiting
          // Handle both calendar-based events and "just_because" rules without events
          const occasionType = execution.user_special_dates?.date_type || execution.auto_gifting_rules.date_type || 'birthday';
          
          const giftSelection = await this.selectGiftForRecipient(
            execution.auto_gifting_rules.recipient_id,
            execution.auto_gifting_rules.budget_limit || 50,
            occasionType,
            execution.auto_gifting_rules.gift_selection_criteria?.categories || [],
            userId
          );
          
          const totalAmount = giftSelection.products.reduce((sum, product) => sum + product.price, 0);
          
          // Step 3: Update execution with selected products and resolved address
          await supabase
            .from('automated_gift_executions')
            .update({
              selected_products: giftSelection.products,
              total_amount: totalAmount,
              status: execution.auto_gifting_rules.auto_approve_gifts ? 'processing' : 'pending',
              address_metadata: addressResult.addressMeta,
              updated_at: new Date().toISOString()
            })
            .eq('id', execution.id);
            
          console.log(`✅ Updated execution ${execution.id} with ${giftSelection.products.length} products from ${giftSelection.tier} tier`);
          
          // Step 4: Send notification
          await this.sendGiftNotification(userId, {
            type: 'gift_suggestions_ready',
            executionId: execution.id,
            tier: giftSelection.tier,
            productCount: giftSelection.products.length,
            confidence: giftSelection.confidence,
            reasoning: giftSelection.reasoning,
            addressSource: addressResult.addressMeta?.source
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
   * Get executions for a user with better error handling
   */
  async getUserExecutions(userId: string): Promise<UnifiedGiftExecution[]> {
    try {
      const { data, error } = await supabase
        .from('automated_gift_executions')
        .select(`
          *,
          auto_gifting_rules:rule_id (
            id,
            date_type,
            budget_limit,
            gift_selection_criteria,
            recipient_id,
            is_active
          ),
          user_special_dates:event_id (
            id,
            date_type,
            date
          )
        `)
        .eq('user_id', userId)
        .order('execution_date', { ascending: false });

      if (error) {
        console.error('Error fetching user executions:', error);
        // Return executions without rule details instead of throwing
        const { data: basicData, error: basicError } = await supabase
          .from('automated_gift_executions')
          .select('*')
          .eq('user_id', userId)
          .order('execution_date', { ascending: false });
          
        if (basicError) throw basicError;
        
        return (basicData || []).map(execution => ({
          ...execution,
          execution_date: new Date(execution.execution_date),
          next_retry_at: execution.next_retry_at ? new Date(execution.next_retry_at) : undefined,
          created_at: new Date(execution.created_at),
          updated_at: new Date(execution.updated_at),
          error_message: execution.error_message || 'Failed to fetch rule details'
        }));
      }
      
      return (data || []).map(execution => ({
        ...execution,
        execution_date: new Date(execution.execution_date),
        next_retry_at: execution.next_retry_at ? new Date(execution.next_retry_at) : undefined,
        created_at: new Date(execution.created_at),
        updated_at: new Date(execution.updated_at)
      }));
    } catch (error) {
      console.error('Error in getUserExecutions:', error);
      throw error;
    }
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

  // ============= ADDRESS RESOLUTION ============= 

  /**
   * Validate recipient address availability for auto-gift execution
   */
  private async validateRecipientAddress(userId: string, recipientId: string): Promise<{
    hasAddress: boolean;
    status: 'pending' | 'address_required' | 'pending_address';
    message?: string;
    addressMeta?: any;
    needsAddressRequest?: boolean;
    recipientInfo?: { email: string; name: string };
  }> {
    const addressResult = await recipientAddressResolver.resolveRecipientAddress(userId, recipientId);
    
    if (addressResult.success && addressResult.address) {
      return {
        hasAddress: true,
        status: 'pending',
        addressMeta: {
          source: addressResult.address.source,
          is_verified: addressResult.address.is_verified,
          needs_confirmation: addressResult.address.needs_confirmation || false
        }
      };
    }
    
    if (addressResult.requiresAddressRequest) {
      // Get recipient info for address request
      const recipientInfo = await this.getRecipientContactInfo(userId, recipientId);
      
      return {
        hasAddress: false,
        status: 'address_required',
        message: 'Shipping address required from recipient',
        needsAddressRequest: true,
        recipientInfo
      };
    }
    
    return {
      hasAddress: false,
      status: 'address_required',
      message: addressResult.error || 'Address validation failed'
    };
  }

  /**
   * Get recipient contact information for address requests
   */
  private async getRecipientContactInfo(userId: string, recipientId: string): Promise<{ email: string; name: string } | undefined> {
    // First try to get from accepted connection
    const { data: connection } = await supabase
      .from('user_connections')
      .select(`
        profiles!user_connections_connected_user_id_fkey(email, name, first_name, last_name)
      `)
      .eq('user_id', userId)
      .eq('connected_user_id', recipientId)
      .eq('status', 'accepted')
      .single();

    if (connection?.profiles) {
      const profile = Array.isArray(connection.profiles) ? connection.profiles[0] : connection.profiles;
      return {
        email: profile.email,
        name: profile.name || `${profile.first_name} ${profile.last_name}`.trim()
      };
    }

    // Try pending connection
    const { data: pendingConnection } = await supabase
      .from('user_connections')
      .select('pending_recipient_email, pending_recipient_name')
      .eq('user_id', userId)
      .eq('status', 'pending_invitation')
      .single();

    if (pendingConnection) {
      return {
        email: pendingConnection.pending_recipient_email,
        name: pendingConnection.pending_recipient_name
      };
    }

    return undefined;
  }

  /**
   * Send address request to recipient
   */
  private async sendAddressRequest(userId: string, recipientInfo: { email: string; name: string }): Promise<void> {
    const result = await recipientAddressResolver.requestAddressFromRecipient(
      userId,
      recipientInfo.email,
      recipientInfo.name,
      `Hi ${recipientInfo.name}, I'd like to send you an auto-gift! Could you please share your shipping address?`
    );

    if (result.success) {
      console.log(`📤 Address request sent to ${recipientInfo.email}`);
    } else {
      console.error(`❌ Failed to send address request: ${result.error}`);
    }
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