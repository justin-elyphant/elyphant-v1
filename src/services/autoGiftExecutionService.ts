import { supabase } from "@/integrations/supabase/client";
import { enhancedZincApiService } from "./enhancedZincApiService";
import { autoGiftingService, AutoGiftingRule } from "./autoGiftingService";
import { toast } from "sonner";

// 🚨 DEPRECATION WARNING - Phase 5 Migration
// This service has been consolidated into UnifiedGiftManagementService
// Please migrate to use unifiedGiftManagementService instead
// This service will be removed in a future version
console.warn(`
⚠️  DEPRECATED: autoGiftExecutionService
📦 Use: unifiedGiftManagementService from @/services/UnifiedGiftManagementService
🔄 Migration: Phase 5 Gift System Consolidation
⏰ Will be removed in future version
`);

export interface AutoGiftExecution {
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
  // Optional joined fields
  auto_gifting_rules?: any;
  user_special_dates?: any;
}

export interface GiftSelectionCriteria {
  source: "wishlist" | "ai" | "both" | "specific";
  max_price?: number;
  min_price?: number;
  categories: string[];
  exclude_items: string[];
  preferred_brands?: string[];
  recipient_preferences?: any;
  specific_product_id?: string;
}

class AutoGiftExecutionService {
  
  /**
   * Select products for auto-gifting using Zinc API
   */
  async selectGiftsForRule(rule: AutoGiftingRule, eventData: any): Promise<any[]> {
    console.log(`Selecting gifts for rule ${rule.id} with budget ${rule.budget_limit}`);
    
    const criteria = rule.gift_selection_criteria as GiftSelectionCriteria;
    const maxBudget = rule.budget_limit || 50;
    
    let searchQuery = this.buildSearchQuery(criteria, eventData);
    
    try {
      // Search for products using your enhanced Zinc API
      const searchResult = await enhancedZincApiService.searchProducts(searchQuery, 1, 20);
      
      if (!searchResult.results || searchResult.results.length === 0) {
        console.log("No products found, trying broader search");
        searchQuery = this.buildFallbackQuery(eventData.date_type);
        const fallbackResult = await enhancedZincApiService.searchProducts(searchQuery, 1, 20);
        
        if (!fallbackResult.results || fallbackResult.results.length === 0) {
          throw new Error("No suitable products found for auto-gifting");
        }
        
        return this.filterAndSelectProducts(fallbackResult.results, maxBudget, criteria);
      }
      
      return this.filterAndSelectProducts(searchResult.results, maxBudget, criteria);
      
    } catch (error) {
      console.error("Error selecting gifts:", error);
      throw new Error(`Failed to select gifts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build search query based on selection criteria and event data
   */
  private buildSearchQuery(criteria: GiftSelectionCriteria, eventData: any): string {
    const eventType = eventData.date_type?.toLowerCase() || '';
    const categories = criteria.categories || [];
    
    // Build query based on event type and categories
    let query = '';
    
    if (eventType.includes('birthday')) {
      query = 'birthday gift';
    } else if (eventType.includes('anniversary')) {
      query = 'anniversary gift';
    } else if (eventType.includes('wedding')) {
      query = 'wedding gift';
    } else if (eventType.includes('graduation')) {
      query = 'graduation gift';
    } else {
      query = 'gift';
    }
    
    // Add category preferences
    if (categories.length > 0) {
      const categoryString = categories.join(' ');
      query = `${categoryString} ${query}`;
    }
    
    console.log(`Built search query: "${query}"`);
    return query;
  }

  /**
   * Build fallback query for when specific searches fail
   */
  private buildFallbackQuery(eventType: string): string {
    const eventLower = eventType?.toLowerCase() || '';
    
    if (eventLower.includes('birthday')) return 'birthday gift popular';
    if (eventLower.includes('anniversary')) return 'anniversary gift ideas';
    if (eventLower.includes('wedding')) return 'wedding gift popular';
    if (eventLower.includes('graduation')) return 'graduation gift ideas';
    
    return 'popular gift ideas';
  }

  /**
   * Filter and select the best products based on budget and criteria
   */
  private filterAndSelectProducts(products: any[], maxBudget: number, criteria: GiftSelectionCriteria): any[] {
    console.log(`Filtering ${products.length} products with budget ${maxBudget}`);
    
    // Filter by budget
    let affordableProducts = products.filter(product => {
      const price = parseFloat(product.price) || 0;
      return price > 0 && price <= maxBudget;
    });
    
    // Filter by minimum price if specified
    if (criteria.min_price) {
      affordableProducts = affordableProducts.filter(product => {
        const price = parseFloat(product.price) || 0;
        return price >= criteria.min_price!;
      });
    }
    
    // Exclude items if specified
    if (criteria.exclude_items && criteria.exclude_items.length > 0) {
      affordableProducts = affordableProducts.filter(product => {
        const title = product.title?.toLowerCase() || '';
        return !criteria.exclude_items.some(excluded => 
          title.includes(excluded.toLowerCase())
        );
      });
    }
    
    // Sort by rating and review count (prioritize well-reviewed items)
    affordableProducts.sort((a, b) => {
      const aRating = parseFloat(a.stars) || 0;
      const bRating = parseFloat(b.stars) || 0;
      const aReviews = parseInt(a.num_reviews) || 0;
      const bReviews = parseInt(b.num_reviews) || 0;
      
      // Prioritize higher ratings, then higher review counts
      if (aRating !== bRating) return bRating - aRating;
      return bReviews - aReviews;
    });
    
    console.log(`Found ${affordableProducts.length} suitable products`);
    
    // Return top 3 products for selection
    return affordableProducts.slice(0, 3).map(product => ({
      product_id: product.product_id,
      title: product.title,
      price: parseFloat(product.price),
      image: product.image,
      category: product.category,
      retailer: product.retailer,
      rating: parseFloat(product.stars) || 0,
      review_count: parseInt(product.num_reviews) || 0,
      selected: false // User can approve/select from these options
    }));
  }

  /**
   * Create an execution record for auto-gifting
   */
  async createExecution(rule: AutoGiftingRule, eventId: string): Promise<string> {
    const { data, error } = await supabase
      .from('automated_gift_executions')
      .insert({
        rule_id: rule.id,
        event_id: eventId,
        user_id: rule.user_id,
        execution_date: new Date().toISOString().split('T')[0], // Today's date
        status: 'pending',
        retry_count: 0
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  }

  /**
   * Process pending auto-gift executions
   */
  async processPendingExecutions(userId: string): Promise<void> {
    console.log(`Processing pending auto-gift executions for user ${userId}`);
    
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
          console.log(`Processing execution ${execution.id}`);
          
          // Select gifts for this execution
          const selectedProducts = await this.selectGiftsForRule(
            execution.auto_gifting_rules,
            execution.user_special_dates
          );
          
          const totalAmount = selectedProducts.reduce((sum, product) => sum + product.price, 0);
          
          // Update execution with selected products
          await supabase
            .from('automated_gift_executions')
            .update({
              selected_products: selectedProducts,
              total_amount: totalAmount,
              status: execution.auto_gifting_rules.auto_approve_gifts ? 'processing' : 'pending',
              updated_at: new Date().toISOString()
            })
            .eq('id', execution.id);
            
          console.log(`Updated execution ${execution.id} with ${selectedProducts.length} products`);
          
          // Show notification to user
          toast.success("Auto-gift suggestions ready", {
            description: `Found ${selectedProducts.length} gift options for ${execution.user_special_dates.date_type}`
          });
          
        } catch (error) {
          console.error(`Failed to process execution ${execution.id}:`, error);
          
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
      console.error('Error processing pending executions:', error);
      throw error;
    }
  }

  /**
   * Get executions for a user
   */
  async getUserExecutions(userId: string): Promise<AutoGiftExecution[]> {
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
   * Approve selected products for auto-gifting
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
    
    // Here you would trigger the actual order creation
    // This would integrate with your existing order processing system
    console.log(`Auto-gift execution ${executionId} approved for processing`);
  }
}

export const autoGiftExecutionService = new AutoGiftExecutionService();
