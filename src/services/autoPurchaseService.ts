import { supabase } from "@/integrations/supabase/client";
import { GiftSelectionService, GiftSelectionCriteria } from "./giftSelectionService";
import { Database } from "@/integrations/supabase/types";

type AutoGiftingRule = Database['public']['Tables']['auto_gifting_rules']['Row'];
type AutoGiftingSettings = Database['public']['Tables']['auto_gifting_settings']['Row'];
type ScheduledGiftEvent = Database['public']['Tables']['user_special_dates']['Row'];

export interface AutoPurchaseRecommendation {
  ruleId: string;
  eventId: string;
  products: Array<{
    productId: string;
    productName: string;
    productImage?: string;
    price: number;
    confidence: number;
    reasoning: string;
  }>;
  totalAmount: number;
  needsApproval: boolean;
  approvalDeadline: Date;
}

export interface AutoPurchaseNotification {
  type: 'approval_needed' | 'purchase_success' | 'purchase_failed' | 'budget_warning';
  title: string;
  message: string;
  actionRequired: boolean;
  approvalId?: string;
}

export class AutoPurchaseService {
  /**
   * Check for upcoming gift events that need processing
   */
  static async getUpcomingAutoGiftEvents(daysAhead: number = 7): Promise<any[]> {
    const { data, error } = await supabase.rpc('get_upcoming_auto_gift_events', {
      days_ahead: daysAhead
    });

    if (error) {
      console.error('Error fetching upcoming events:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Generate gift recommendations for an auto-gifting rule
   */
  static async generateAutoGiftRecommendations(
    rule: AutoGiftingRule,
    event: ScheduledGiftEvent
  ): Promise<AutoPurchaseRecommendation | null> {
    try {
      // Get user's auto-gifting settings
      const { data: settings } = await supabase
        .from('auto_gifting_settings')
        .select('*')
        .eq('user_id', rule.user_id)
        .single();

      if (!settings?.has_payment_method) {
        console.warn(`No payment method for user ${rule.user_id}`);
        return null;
      }

      // Get recipient information for better recommendations
      let recipientData: any = {};
      if (rule.recipient_id) {
        const { data: recipient } = await supabase
          .from('profiles')
          .select('birth_year, enhanced_gift_preferences')
          .eq('id', rule.recipient_id)
          .single();
        
        recipientData = recipient || {};
      }

      // Generate selection criteria
      const criteria = this.createSelectionCriteria(rule, event, recipientData);
      
      // Create search query for AI gift search
      const searchQuery = GiftSelectionService.createSearchQuery(criteria);
      
      // Call AI gift search service
      const { data: searchResults, error: searchError } = await supabase.functions.invoke('ai-gift-search', {
        body: {
          query: searchQuery,
          budget_range: {
            min: criteria.budgetLimit * 0.5,
            max: criteria.budgetLimit
          },
          categories: criteria.giftCategories,
          recipient_data: {
            birth_year: criteria.recipientBirthYear,
            relationship: criteria.relationshipType
          }
        }
      });

      if (searchError) {
        console.error('AI gift search error:', searchError);
        throw searchError;
      }

      // Filter and score recommendations
      const filteredProducts = GiftSelectionService.filterInappropriateItems(
        searchResults?.recommendations || [],
        criteria
      );

      const scoredProducts = filteredProducts
        .map(product => ({
          ...product,
          confidence: GiftSelectionService.scoreGiftRecommendation(product, criteria),
          reasoning: this.generateRecommendationReasoning(product, criteria)
        }))
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 3); // Top 3 recommendations

      if (scoredProducts.length === 0) {
        console.warn('No suitable products found for auto-gift');
        return null;
      }

      const totalAmount = scoredProducts.reduce((sum, p) => sum + p.price, 0);
      const needsApproval = this.needsManualApproval(totalAmount, rule, settings);
      
      return {
        ruleId: rule.id,
        eventId: event.id,
        products: scoredProducts,
        totalAmount,
        needsApproval,
        approvalDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      };

    } catch (error) {
      console.error('Error generating auto-gift recommendations:', error);
      return null;
    }
  }

  /**
   * Create selection criteria from rule and event data
   */
  private static createSelectionCriteria(
    rule: AutoGiftingRule,
    event: ScheduledGiftEvent,
    recipientData: any
  ): GiftSelectionCriteria {
    const giftPreferences = rule.gift_selection_criteria as any || {};
    const relationshipContext = rule.relationship_context as any || {};
    
    return {
      relationshipType: relationshipContext.relationship_type || 'friend',
      budgetLimit: rule.budget_limit || 100,
      giftCategories: giftPreferences.categories || [],
      recipientBirthYear: recipientData.birth_year,
      dateType: event.date_type,
      excludeItems: giftPreferences.exclude_items || []
    };
  }

  /**
   * Determine if manual approval is needed
   */
  private static needsManualApproval(
    totalAmount: number,
    rule: AutoGiftingRule,
    settings: AutoGiftingSettings
  ): boolean {
    // Always require approval if auto-approve is disabled
    if (!settings.auto_approve_gifts) {
      return true;
    }

    // Require approval for high-value gifts
    const approvalThreshold = 75; // $75 threshold for auto-approval
    if (totalAmount > approvalThreshold) {
      return true;
    }

    // Require approval if over budget limit
    if (rule.budget_limit && totalAmount > rule.budget_limit) {
      return true;
    }

    return false;
  }

  /**
   * Generate reasoning for recommendation
   */
  private static generateRecommendationReasoning(
    product: any,
    criteria: GiftSelectionCriteria
  ): string {
    const reasons: string[] = [];
    
    if (product.price <= criteria.budgetLimit * 0.8) {
      reasons.push("Great value within budget");
    } else if (product.price <= criteria.budgetLimit) {
      reasons.push("Within your budget");
    }
    
    if (criteria.giftCategories.some(cat => 
      product.category?.toLowerCase().includes(cat.toLowerCase())
    )) {
      reasons.push("Matches preferred categories");
    }
    
    if (criteria.recipientBirthYear) {
      const ageCategory = GiftSelectionService.getAgeCategory(criteria.recipientBirthYear);
      reasons.push(`Age-appropriate for ${ageCategory}`);
    }
    
    const relationshipText = criteria.relationshipType.replace('_', ' ');
    reasons.push(`Perfect for your ${relationshipText}`);
    
    return reasons.join(", ");
  }

  /**
   * Process auto-purchase approval
   */
  static async processAutoPurchaseApproval(
    recommendationId: string,
    approved: boolean,
    selectedProductIds?: string[]
  ): Promise<{ success: boolean; orderId?: string; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('process-auto-purchase', {
        body: {
          recommendation_id: recommendationId,
          approved,
          selected_product_ids: selectedProductIds
        }
      });

      if (error) {
        throw error;
      }

      return { success: true, orderId: data?.order_id };
    } catch (error) {
      console.error('Error processing auto-purchase approval:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Check spending limits and budgets
   */
  static async checkSpendingLimits(
    userId: string,
    amount: number
  ): Promise<{ withinLimits: boolean; warnings: string[] }> {
    const warnings: string[] = [];
    
    try {
      // Get user's auto-gifting settings
      const { data: settings } = await supabase
        .from('auto_gifting_settings')
        .select('budget_tracking')
        .eq('user_id', userId)
        .single();

      const budgetTracking = settings?.budget_tracking as any || {};
      
      // Check monthly limit
      if (budgetTracking.monthly_limit) {
        const monthlySpent = budgetTracking.spent_this_month || 0;
        if (monthlySpent + amount > budgetTracking.monthly_limit) {
          warnings.push(`Would exceed monthly limit of $${budgetTracking.monthly_limit}`);
          return { withinLimits: false, warnings };
        }
        
        if (monthlySpent + amount > budgetTracking.monthly_limit * 0.8) {
          warnings.push(`Approaching monthly limit of $${budgetTracking.monthly_limit}`);
        }
      }
      
      // Check annual limit
      if (budgetTracking.annual_limit) {
        const annualSpent = budgetTracking.spent_this_year || 0;
        if (annualSpent + amount > budgetTracking.annual_limit) {
          warnings.push(`Would exceed annual limit of $${budgetTracking.annual_limit}`);
          return { withinLimits: false, warnings };
        }
        
        if (annualSpent + amount > budgetTracking.annual_limit * 0.8) {
          warnings.push(`Approaching annual limit of $${budgetTracking.annual_limit}`);
        }
      }
      
      return { withinLimits: true, warnings };
      
    } catch (error) {
      console.error('Error checking spending limits:', error);
      return { withinLimits: true, warnings: ['Could not verify spending limits'] };
    }
  }

  /**
   * Send notification to user
   */
  static async sendAutoGiftNotification(
    userId: string,
    notification: AutoPurchaseNotification
  ): Promise<void> {
    try {
      // Store notification in database
      await supabase
        .from('auto_gift_notifications')
        .insert({
          user_id: userId,
          notification_type: notification.type,
          title: notification.title,
          message: notification.message,
          is_read: false
        });

      // TODO: Send email notification if user has email notifications enabled
      
    } catch (error) {
      console.error('Error sending auto-gift notification:', error);
    }
  }
}