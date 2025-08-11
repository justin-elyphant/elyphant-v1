/**
 * ENHANCED AUTO-GIFTING SERVICE - Nicole Integration
 * 
 * This service enhances the existing auto-gifting system with Nicole AI capabilities
 * while preserving all existing security, budget controls, and ZMA integration.
 */

import { supabase } from "@/integrations/supabase/client";
import { unifiedGiftManagementService } from "./UnifiedGiftManagementService";
import { nicoleAIService, NicoleGiftSelectionContext } from "./ai/unified/nicoleAIService";
import { toast } from "sonner";

export interface EnhancedAutoGiftExecution {
  id: string;
  rule_id: string;
  event_id: string;
  user_id: string;
  execution_date: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'needs_approval';
  selected_products?: any[];
  total_amount?: number;
  order_id?: string;
  error_message?: string;
  retry_count: number;
  next_retry_at?: Date;
  ai_agent_source?: {
    agent: 'nicole' | 'system';
    confidence_score: number;
    data_sources: string[];
    discovery_method: string;
    reasoning?: string;
  };
  approval_method?: 'email' | 'nicole_chat' | 'auto';
  created_at: Date;
  updated_at: Date;
}

class EnhancedAutoGiftingService {

  // ============= PHASE 1: NICOLE-POWERED GIFT SELECTION =============

  /**
   * Enhanced gift selection using Nicole AI for context-aware recommendations
   */
  async selectGiftsWithNicole(
    rule: any,
    event: any,
    userProfile?: any
  ): Promise<{
    products: any[];
    confidence: number;
    aiAttribution: any;
    selectionTier: string;
    reasoning: string;
  }> {
    try {
      console.log('🎁 Enhanced Auto-Gifting: Using Nicole for gift selection');
      
      // Build Nicole's context for gift selection
      const nicoleContext: NicoleGiftSelectionContext = {
        recipientId: rule.recipient_id,
        budget: rule.budget_limit || 50,
        occasion: event.event_type,
        relationshipType: rule.relationship_context?.relationshipType,
        recipientProfile: userProfile,
        userPreferences: rule.gift_selection_criteria
      };

      // Get Nicole's enhanced gift selection
      const nicoleSelection = await nicoleAIService.enhanceGiftSelection(nicoleContext);
      
      // Use Nicole's search query with the existing protected search system
      const searchResults = await this.searchWithNicoleQuery(
        nicoleSelection.searchQuery,
        rule.budget_limit || 50,
        rule.user_id,
        nicoleSelection.selectionCriteria
      );

      if (searchResults.length === 0) {
        // Fallback to original system if Nicole's search yields no results
        console.log('🔄 Nicole search yielded no results, falling back to original system');
        return this.fallbackToOriginalSelection(rule, event);
      }

      // Rank and select products using Nicole's criteria
      const selectedProducts = this.rankProductsWithNicole(
        searchResults,
        nicoleSelection,
        rule.budget_limit || 50
      );

      return {
        products: selectedProducts,
        confidence: nicoleSelection.confidence,
        aiAttribution: nicoleSelection.aiAttribution,
        selectionTier: 'nicole_ai',
        reasoning: nicoleSelection.reasoning
      };

    } catch (error) {
      console.error('Error in Nicole gift selection:', error);
      // Fallback to original system on error
      return this.fallbackToOriginalSelection(rule, event);
    }
  }

  /**
   * Search products using Nicole's enhanced query
   */
  private async searchWithNicoleQuery(
    query: string,
    budget: number,
    userId: string,
    criteria: any
  ): Promise<any[]> {
    try {
      // **PHASE 2 FIX: Use zinc-search instead of get-products**
      const { data: searchResults, error } = await supabase.functions.invoke('zinc-search', {
        body: {
          query: query,
          page: 1,
          limit: 25, // Increased for better selection
          filters: {
            max_price: budget,
            min_price: Math.max(10, budget * 0.2), // Minimum 20% of budget
            categories: criteria.categories || []
          },
          enhanced: true, // Flag for Nicole-enhanced search
          user_id: userId
        }
      });

      if (error) {
        console.error('Error in Nicole-enhanced product search:', error);
        return [];
      }

      return searchResults?.products || [];
    } catch (error) {
      console.error('Error searching with Nicole query:', error);
      return [];
    }
  }

  /**
   * Rank products using Nicole's selection criteria
   */
  private rankProductsWithNicole(
    products: any[],
    nicoleSelection: any,
    budget: number
  ): any[] {
    return products
      .filter(product => {
        const price = parseFloat(product.price) || 0;
        return price > 0 && price <= budget;
      })
      .sort((a, b) => {
        // Score products based on Nicole's criteria
        const aScore = this.calculateNicoleScore(a, nicoleSelection);
        const bScore = this.calculateNicoleScore(b, nicoleSelection);
        return bScore - aScore;
      })
      .slice(0, 3) // Top 3 products
      .map(product => ({
        product_id: product.product_id,
        title: product.title,
        price: parseFloat(product.price),
        image: product.image,
        category: product.category,
        retailer: product.retailer,
        rating: parseFloat(product.stars) || 0,
        review_count: parseInt(product.num_reviews) || 0,
        selected: true,
        nicole_score: this.calculateNicoleScore(product, nicoleSelection),
        ai_reasoning: `Selected by Nicole AI based on ${nicoleSelection.reasoning}`
      }));
  }

  /**
   * Calculate Nicole's scoring for product ranking
   */
  private calculateNicoleScore(product: any, nicoleSelection: any): number {
    let score = 0;
    
    // Base score from ratings
    const rating = parseFloat(product.stars) || 0;
    const reviewCount = parseInt(product.num_reviews) || 0;
    score += (rating * 20) + Math.min(reviewCount / 100, 10);
    
    // Nicole's confidence boost
    score += nicoleSelection.confidence * 30;
    
    // Price optimization (products around 70-90% of budget score higher)
    const price = parseFloat(product.price) || 0;
    const budget = nicoleSelection.selectionCriteria.budget || 50;
    const priceRatio = price / budget;
    if (priceRatio >= 0.7 && priceRatio <= 0.9) {
      score += 15;
    }
    
    return score;
  }

  /**
   * Fallback to original gift selection system
   */
  private async fallbackToOriginalSelection(rule: any, event: any): Promise<any> {
    console.log('🔄 Using fallback gift selection system');
    
    try {
      const originalSelection = await unifiedGiftManagementService.selectGiftForRecipient(
        rule.recipient_id,
        rule.budget_limit || 50,
        event.event_type,
        rule.gift_selection_criteria?.categories || [],
        rule.user_id,
        rule.relationship_context?.relationshipType
      );

      return {
        products: originalSelection.products,
        confidence: originalSelection.confidence,
        aiAttribution: {
          agent: 'system',
          confidence_score: originalSelection.confidence,
          data_sources: ['unified_gift_management'],
          discovery_method: 'hierarchical_fallback'
        },
        selectionTier: originalSelection.tier,
        reasoning: originalSelection.reasoning
      };
    } catch (error) {
      console.error('Error in fallback selection:', error);
      throw error;
    }
  }

  // ============= PHASE 2: HYBRID APPROVAL SYSTEM =============

  /**
   * Create approval with both email and Nicole chat options
   */
  async createHybridApproval(execution: EnhancedAutoGiftExecution): Promise<{
    emailTokenId: string;
    conversationId?: string;
    approvalMethods: string[];
  }> {
    try {
      console.log('📧💬 Creating hybrid approval for execution:', execution.id);
      
      // Create email approval token (existing system)
      const { data: emailToken, error: tokenError } = await supabase
        .from('email_approval_tokens')
        .insert({
          user_id: execution.user_id,
          execution_id: execution.id,
          token: this.generateApprovalToken(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        })
        .select()
        .single();

      if (tokenError) throw tokenError;

      let conversationId: string | undefined;
      
      // Initialize Nicole conversation for chat approval
      try {
        const approvalContext = {
          executionId: execution.id,
          selectedProducts: execution.selected_products || [],
          totalAmount: execution.total_amount || 0,
          eventDetails: await this.getEventDetails(execution.event_id),
          userBudgetLimits: await this.getUserBudgetLimits(execution.user_id)
        };

        const nicoleConversation = await nicoleAIService.initializeApprovalConversation(
          emailToken.id,
          approvalContext
        );
        
        conversationId = nicoleConversation.conversationId;
      } catch (nicoleError) {
        console.error('Nicole conversation initialization failed:', nicoleError);
        // Continue with email-only approval if Nicole fails
      }

      // Send approval email (existing system)
      await this.sendApprovalEmail(emailToken, execution);

      return {
        emailTokenId: emailToken.id,
        conversationId,
        approvalMethods: conversationId ? ['email', 'nicole_chat'] : ['email']
      };

    } catch (error) {
      console.error('Error creating hybrid approval:', error);
      throw error;
    }
  }

  /**
   * Process approval through Nicole chat
   */
  async processNicoleApproval(
    conversationId: string,
    decision: 'approve' | 'reject' | 'modify',
    customizations?: any
  ): Promise<{
    success: boolean;
    executionId: string;
    newStatus: string;
  }> {
    try {
      // Get conversation details
      const { data: conversation, error: convError } = await supabase
        .from('approval_conversations')
        .select(`
          *,
          email_approval_tokens (*)
        `)
        .eq('id', conversationId)
        .single();

      if (convError) throw convError;

      // Update approval token
      await supabase
        .from('email_approval_tokens')
        .update({
          approved_at: decision === 'approve' ? new Date().toISOString() : null,
          rejected_at: decision === 'reject' ? new Date().toISOString() : null,
          approved_via: 'nicole_chat'
        })
        .eq('id', conversation.approval_token_id);

      // Update execution status
      const newStatus = decision === 'approve' ? 'approved' : 
                       decision === 'reject' ? 'rejected' : 'pending';

      await supabase
        .from('automated_gift_executions')
        .update({
          status: newStatus,
          approval_method: 'nicole_chat',
          updated_at: new Date().toISOString()
        })
        .eq('id', conversation.execution_id);

      // Complete conversation
      await supabase
        .from('approval_conversations')
        .update({
          status: 'completed',
          approval_decision: decision,
          completed_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      // If approved, trigger processing
      if (decision === 'approve') {
        await supabase.functions.invoke('process-auto-gifts', {
          body: { 
            executionId: conversation.execution_id,
            approvalMethod: 'nicole_chat',
            customizations 
          }
        });
      }

      return {
        success: true,
        executionId: conversation.execution_id,
        newStatus
      };

    } catch (error) {
      console.error('Error processing Nicole approval:', error);
      throw error;
    }
  }

  // ============= PHASE 3: CONVERSATIONAL RULE MANAGEMENT =============

  /**
   * Create auto-gifting rule from natural language input via Nicole
   */
  async createRuleWithNicole(
    userId: string,
    naturalLanguageInput: string
  ): Promise<{
    ruleId: string;
    ruleData: any;
    confidence: number;
    nicoleResponse: any;
  }> {
    try {
      console.log('📋 Creating rule with Nicole:', naturalLanguageInput);
      
      // Get user's existing rules and preferences
      const { data: existingRules } = await supabase
        .from('auto_gifting_rules')
        .select('*')
        .eq('user_id', userId);

      const { data: userPreferences } = await supabase
        .from('auto_gifting_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Generate rule with Nicole
      const ruleCreation = await nicoleAIService.createRuleFromConversation({
        userId,
        naturalLanguageInput,
        existingRules: existingRules || [],
        userPreferences
      });

      // Create the rule in database
      const { data: newRule, error: ruleError } = await supabase
        .from('auto_gifting_rules')
        .insert({
          ...ruleCreation.ruleData,
          user_id: userId,
          ai_agent_source: {
            agent: 'nicole',
            confidence_score: ruleCreation.confidence,
            data_sources: ['natural_language_processing', 'user_preferences'],
            discovery_method: 'conversational_rule_creation',
            original_input: naturalLanguageInput
          }
        })
        .select()
        .single();

      if (ruleError) throw ruleError;

      return {
        ruleId: newRule.id,
        ruleData: newRule,
        confidence: ruleCreation.confidence,
        nicoleResponse: ruleCreation.nicoleResponse
      };

    } catch (error) {
      console.error('Error creating rule with Nicole:', error);
      throw error;
    }
  }

  // ============= HELPER METHODS =============

  private generateApprovalToken(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private async getEventDetails(eventId: string): Promise<any> {
    const { data, error } = await supabase
      .from('user_special_dates')
      .select('*')
      .eq('id', eventId)
      .single();
    
    return data;
  }

  private async getUserBudgetLimits(userId: string): Promise<any> {
    const { data, error } = await supabase
      .from('auto_gifting_settings')
      .select('budget_tracking, default_budget_limit')
      .eq('user_id', userId)
      .single();
    
    return data;
  }

  private async sendApprovalEmail(token: any, execution: EnhancedAutoGiftExecution): Promise<void> {
    try {
      await supabase.functions.invoke('send-auto-gift-approval-email', {
        body: {
          tokenId: token.id,
          executionId: execution.id,
          userEmail: execution.user_id, // Would need to get actual email
          products: execution.selected_products,
          totalAmount: execution.total_amount
        }
      });
    } catch (error) {
      console.error('Error sending approval email:', error);
      // Don't throw - email sending is not critical for the approval process
    }
  }
}

export const enhancedAutoGiftingService = new EnhancedAutoGiftingService();