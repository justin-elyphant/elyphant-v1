/**
 * NICOLE AI SERVICE - Unified Intelligence for Auto-Gifting
 * 
 * This service provides Nicole's AI capabilities for the enhanced auto-gifting system,
 * including context-aware gift selection, conversational approvals, and predictive analytics.
 */

import { supabase } from "@/integrations/supabase/client";
import { UnifiedNicoleContext, NicoleResponse } from "./types";

export interface NicoleGiftSelectionContext {
  recipientId: string;
  budget: number;
  occasion: string;
  relationshipType?: string;
  recipientProfile?: any;
  previousGifts?: any[];
  userPreferences?: any;
}

export interface NicoleApprovalContext {
  executionId: string;
  selectedProducts: any[];
  totalAmount: number;
  eventDetails: any;
  userBudgetLimits: any;
}

export interface NicoleRuleCreationContext {
  userId: string;
  naturalLanguageInput: string;
  existingRules?: any[];
  userPreferences?: any;
}

class NicoleAIService {
  
  // ============= PHASE 1: ENHANCED GIFT SELECTION =============
  
  /**
   * Use Nicole AI to generate context-aware gift search queries and enhance selection
   */
  async enhanceGiftSelection(context: NicoleGiftSelectionContext): Promise<{
    searchQuery: string;
    confidence: number;
    reasoning: string;
    selectionCriteria: any;
    aiAttribution: any;
  }> {
    try {
      console.log('🎁 Nicole: Enhancing gift selection with context:', context);
      
      // Build Nicole's context for gift selection
      const nicoleContext: UnifiedNicoleContext = {
        conversationPhase: 'gift_selection',
        capability: 'gift_advisor',
        recipient: context.recipientId,
        occasion: context.occasion,
        budget: [context.budget * 0.8, context.budget * 1.2], // 20% flexibility
        currentUserId: context.recipientId,
        userPreferences: context.userPreferences,
        previousMessages: []
      };

      // Generate enhanced search query with Nicole's intelligence
      const prompt = this.buildGiftSelectionPrompt(context);
      
      const { data: nicoleResponse, error } = await supabase.functions.invoke('nicole-chat', {
        body: {
          message: prompt,
          context: nicoleContext,
          capability: 'gift_advisor',
          sessionId: `gift-selection-${context.recipientId}-${Date.now()}`
        }
      });

      if (error) {
        console.error('Nicole gift selection error:', error);
        throw new Error(`Nicole gift selection failed: ${error.message}`);
      }

      const response = nicoleResponse as NicoleResponse;
      
      // Parse Nicole's response for gift selection criteria
      const selectionData = this.parseGiftSelectionResponse(response, context);
      
      return {
        searchQuery: selectionData.searchQuery,
        confidence: response.metadata?.confidence || 0.75,
        reasoning: response.message,
        selectionCriteria: selectionData.criteria,
        aiAttribution: {
          agent: 'nicole',
          confidence_score: response.metadata?.confidence || 0.75,
          data_sources: ['recipient_profile', 'relationship_context', 'occasion_analysis'],
          discovery_method: 'contextual_ai_analysis'
        }
      };
      
    } catch (error) {
      console.error('Error in Nicole gift selection:', error);
      throw error;
    }
  }

  // ============= PHASE 2: CONVERSATIONAL APPROVALS =============
  
  /**
   * Initialize Nicole-powered approval conversation
   */
  async initializeApprovalConversation(
    approvalTokenId: string, 
    context: NicoleApprovalContext
  ): Promise<{
    conversationId: string;
    initialMessage: string;
    nicoleResponse: NicoleResponse;
  }> {
    try {
      console.log('💬 Nicole: Initializing approval conversation for execution:', context.executionId);
      
      // Create approval conversation record
      const { data: conversation, error: convError } = await supabase
        .from('approval_conversations')
        .insert({
          user_id: context.eventDetails.user_id,
          execution_id: context.executionId,
          approval_token_id: approvalTokenId,
          conversation_data: {
            products: context.selectedProducts,
            totalAmount: context.totalAmount,
            event: context.eventDetails
          },
          status: 'active'
        })
        .select()
        .single();

      if (convError) throw convError;

      // Build Nicole's context for approval conversation
      const nicoleContext: UnifiedNicoleContext = {
        conversationPhase: 'approval_review',
        capability: 'auto_gifting',
        recipient: context.eventDetails.recipient_name,
        occasion: context.eventDetails.event_type,
        budget: [context.totalAmount, context.totalAmount],
        currentUserId: context.eventDetails.user_id,
        giftSelections: context.selectedProducts.map(p => ({
          productId: p.product_id,
          name: p.title,
          price: p.price,
          image: p.image
        })),
        previousMessages: []
      };

      // Generate Nicole's initial approval message
      const initialPrompt = this.buildApprovalPrompt(context);
      
      const { data: nicoleResponse, error: nicoleError } = await supabase.functions.invoke('nicole-chat', {
        body: {
          message: initialPrompt,
          context: nicoleContext,
          capability: 'auto_gifting',
          sessionId: `approval-${conversation.id}`
        }
      });

      if (nicoleError) throw nicoleError;

      return {
        conversationId: conversation.id,
        initialMessage: initialPrompt,
        nicoleResponse: nicoleResponse as NicoleResponse
      };
      
    } catch (error) {
      console.error('Error initializing Nicole approval conversation:', error);
      throw error;
    }
  }

  /**
   * Continue Nicole approval conversation
   */
  async continueApprovalConversation(
    conversationId: string,
    userMessage: string
  ): Promise<NicoleResponse> {
    try {
      // Get conversation context
      const { data: conversation, error: convError } = await supabase
        .from('approval_conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (convError) throw convError;

      // Build context from conversation data
      const nicoleContext: UnifiedNicoleContext = {
        conversationPhase: 'approval_discussion',
        capability: 'auto_gifting',
        giftSelections: conversation.conversation_data.products || [],
        previousMessages: conversation.conversation_data.messages || [],
        currentUserId: conversation.user_id
      };

      const { data: nicoleResponse, error: nicoleError } = await supabase.functions.invoke('nicole-chat', {
        body: {
          message: userMessage,
          context: nicoleContext,
          capability: 'auto_gifting',
          sessionId: `approval-${conversationId}`
        }
      });

      if (nicoleError) throw nicoleError;

      // Update conversation with new message
      await this.updateConversationHistory(conversationId, userMessage, nicoleResponse);

      return nicoleResponse as NicoleResponse;
      
    } catch (error) {
      console.error('Error in Nicole approval conversation:', error);
      throw error;
    }
  }

  // ============= PHASE 3: CONVERSATIONAL RULE CREATION =============
  
  /**
   * Create auto-gifting rules through natural language conversation with Nicole
   */
  async createRuleFromConversation(context: NicoleRuleCreationContext): Promise<{
    ruleData: any;
    confidence: number;
    nicoleResponse: NicoleResponse;
  }> {
    try {
      console.log('📋 Nicole: Creating auto-gifting rule from conversation:', context.naturalLanguageInput);
      
      const nicoleContext: UnifiedNicoleContext = {
        conversationPhase: 'rule_creation',
        capability: 'auto_gifting',
        currentUserId: context.userId,
        userPreferences: context.userPreferences,
        previousMessages: []
      };

      const prompt = this.buildRuleCreationPrompt(context);
      
      const { data: nicoleResponse, error } = await supabase.functions.invoke('nicole-chat', {
        body: {
          message: prompt,
          context: nicoleContext,
          capability: 'auto_gifting',
          sessionId: `rule-creation-${context.userId}-${Date.now()}`
        }
      });

      if (error) throw error;

      const response = nicoleResponse as NicoleResponse;
      const ruleData = this.parseRuleCreationResponse(response, context);
      
      return {
        ruleData,
        confidence: response.metadata?.confidence || 0.8,
        nicoleResponse: response
      };
      
    } catch (error) {
      console.error('Error in Nicole rule creation:', error);
      throw error;
    }
  }

  // ============= PHASE 4: PREDICTIVE ANALYTICS =============
  
  /**
   * Generate predictive insights for auto-gifting optimization
   */
  async generatePredictiveInsights(userId: string): Promise<{
    suggestions: any[];
    budgetOptimizations: any[];
    timingRecommendations: any[];
    confidence: number;
  }> {
    try {
      console.log('📊 Nicole: Generating predictive insights for user:', userId);
      
      // Get user's auto-gifting history and success patterns
      const { data: executions, error: executionError } = await supabase
        .from('automated_gift_executions')
        .select(`
          *,
          auto_gifting_rules (*),
          user_special_dates (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (executionError) throw executionError;

      const nicoleContext: UnifiedNicoleContext = {
        conversationPhase: 'analytics_generation',
        capability: 'budget_analysis',
        currentUserId: userId,
        userPreferences: { historicalData: executions }
      };

      const prompt = this.buildAnalyticsPrompt(userId, executions || []);
      
      const { data: nicoleResponse, error } = await supabase.functions.invoke('nicole-chat', {
        body: {
          message: prompt,
          context: nicoleContext,
          capability: 'budget_analysis',
          sessionId: `analytics-${userId}-${Date.now()}`
        }
      });

      if (error) throw error;

      const response = nicoleResponse as NicoleResponse;
      const insights = this.parseAnalyticsResponse(response);
      
      return {
        suggestions: insights.suggestions,
        budgetOptimizations: insights.budgetOptimizations,
        timingRecommendations: insights.timingRecommendations,
        confidence: response.metadata?.confidence || 0.75
      };
      
    } catch (error) {
      console.error('Error generating predictive insights:', error);
      throw error;
    }
  }

  // ============= HELPER METHODS =============

  private buildGiftSelectionPrompt(context: NicoleGiftSelectionContext): string {
    return `I need to select the perfect gift for an auto-gifting execution. Here's the context:

Recipient: ${context.recipientId}
Occasion: ${context.occasion}
Budget: $${context.budget}
Relationship: ${context.relationshipType || 'friend'}
Previous gifts: ${context.previousGifts?.length || 0} recorded

Please analyze this context and provide:
1. An optimized search query for finding the best gifts
2. Specific selection criteria based on the relationship and occasion
3. Your reasoning for these recommendations

Focus on thoughtful, personalized gift selection that matches the relationship level and occasion significance.`;
  }

  private buildApprovalPrompt(context: NicoleApprovalContext): string {
    const productList = context.selectedProducts.map(p => 
      `• ${p.title} - $${p.price}`
    ).join('\n');

    return `I've selected these gifts for your upcoming ${context.eventDetails.event_type}:

${productList}

Total: $${context.totalAmount}

I analyzed the recipient's preferences and selected items that match your relationship and the occasion. Would you like to:
1. Approve these gifts as selected
2. Discuss any changes or alternatives
3. See my reasoning for these specific choices

What would you prefer to do?`;
  }

  private buildRuleCreationPrompt(context: NicoleRuleCreationContext): string {
    return `I'd like to help you create an auto-gifting rule. You said: "${context.naturalLanguageInput}"

Based on your request, I'll help you set up:
1. Who this rule applies to
2. What occasions trigger it
3. Budget and gift preferences
4. Notification settings

Let me translate your request into a structured auto-gifting rule. Please provide any additional details about your preferences.`;
  }

  private buildAnalyticsPrompt(userId: string, executions: any[]): string {
    const successRate = executions.filter(e => e.status === 'completed').length / Math.max(executions.length, 1) * 100;
    const avgAmount = executions.reduce((sum, e) => sum + (e.total_amount || 0), 0) / Math.max(executions.length, 1);

    return `Analyze this user's auto-gifting patterns and provide optimization insights:

Historical Performance:
- Success Rate: ${successRate.toFixed(1)}%
- Average Gift Amount: $${avgAmount.toFixed(2)}
- Total Executions: ${executions.length}

Please provide:
1. Budget optimization suggestions
2. Timing pattern analysis
3. Rule improvement recommendations
4. Proactive suggestions for upcoming events

Focus on actionable insights that can improve gift success and user satisfaction.`;
  }

  private parseGiftSelectionResponse(response: NicoleResponse, context: NicoleGiftSelectionContext) {
    // Extract search query from Nicole's response
    const searchQuery = response.searchQuery || 
      `${context.occasion} gift ${context.relationshipType || ''} budget ${context.budget}`;
    
    // Build enhanced selection criteria
    const criteria = {
      occasion: context.occasion,
      relationshipType: context.relationshipType,
      budget: context.budget,
      aiEnhanced: true,
      nicoleReasoning: response.message
    };

    return {
      searchQuery,
      criteria
    };
  }

  private parseRuleCreationResponse(response: NicoleResponse, context: NicoleRuleCreationContext) {
    // This would parse Nicole's structured response into auto-gifting rule format
    // For now, return a basic structure that can be enhanced
    return {
      user_id: context.userId,
      date_type: 'birthday', // Would be extracted from Nicole's analysis
      budget_limit: 50, // Would be extracted from Nicole's analysis
      gift_selection_criteria: {
        source: 'both',
        categories: [],
        aiEnhanced: true,
        nicoleGenerated: true
      },
      notification_preferences: {
        enabled: true,
        days_before: [7, 3, 1],
        email: true,
        push: false
      },
      is_active: true
    };
  }

  private parseAnalyticsResponse(response: NicoleResponse) {
    // Parse Nicole's analytics insights
    return {
      suggestions: [],
      budgetOptimizations: [],
      timingRecommendations: []
    };
  }

  private async updateConversationHistory(
    conversationId: string, 
    userMessage: string, 
    nicoleResponse: NicoleResponse
  ) {
    const { data: conversation } = await supabase
      .from('approval_conversations')
      .select('conversation_data')
      .eq('id', conversationId)
      .single();

    const messages = conversation?.conversation_data?.messages || [];
    messages.push(
      { role: 'user', content: userMessage, timestamp: new Date().toISOString() },
      { role: 'nicole', content: nicoleResponse.message, timestamp: new Date().toISOString() }
    );

    await supabase
      .from('approval_conversations')
      .update({
        conversation_data: {
          ...conversation?.conversation_data,
          messages
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);
  }
}

export const nicoleAIService = new NicoleAIService();