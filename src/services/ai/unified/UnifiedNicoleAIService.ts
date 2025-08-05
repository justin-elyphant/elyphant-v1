import { supabase } from "@/integrations/supabase/client";
import { chatWithNicole, NicoleContext, NicoleResponse as OriginalNicoleResponse } from "../nicoleAiService";
import { EnhancedNicoleService } from "../enhancedNicoleService";
import { generateEnhancedSearchQuery } from "../enhancedSearchQueryGenerator";
import { UnifiedNicoleContext, NicoleCapability, NicoleConversationState, NicoleResponse } from "./types";
import { NicoleCapabilityRouter } from "./NicoleCapabilityRouter";

export class UnifiedNicoleAIService {
  private static instance: UnifiedNicoleAIService;
  private capabilityRouter: NicoleCapabilityRouter;
  private conversationStates: Map<string, NicoleConversationState> = new Map();

  private constructor() {
    this.capabilityRouter = new NicoleCapabilityRouter();
  }

  static getInstance(): UnifiedNicoleAIService {
    if (!UnifiedNicoleAIService.instance) {
      UnifiedNicoleAIService.instance = new UnifiedNicoleAIService();
    }
    return UnifiedNicoleAIService.instance;
  }

  /**
   * Main conversation interface - preserves existing chatWithNicole functionality
   */
  async chat(
    message: string,
    context: UnifiedNicoleContext,
    sessionId: string = 'default'
  ): Promise<NicoleResponse> {
    try {
      // Preserve existing conversation state
      const conversationState = this.getConversationState(sessionId);
      
      // Route to appropriate capability
      const capability = this.capabilityRouter.determineCapability(message, context);
      
      // Update context with capability
      const enhancedContext = {
        ...context,
        capability,
        conversationPhase: this.determineConversationPhase(message, context)
      };

      let response: NicoleResponse;

      // Core Nicole conversation - preserving existing functionality
      if (capability === 'conversation' || capability === 'search') {
        // Convert unified context to original Nicole context
        const nicoleContext: NicoleContext = this.convertToNicoleContext(enhancedContext);
        
        // Use existing chatWithNicole service to preserve functionality
        const nicoleResponse = await chatWithNicole(message, nicoleContext);
        
        response = {
          message: nicoleResponse.message,
          context: enhancedContext,
          capability,
          actions: this.extractActions(nicoleResponse),
          searchQuery: this.generateSearchQuery(enhancedContext),
          showSearchButton: nicoleResponse.showSearchButton || false
        };
      } else {
        // Route to specialized capabilities
        response = await this.handleSpecializedCapability(message, enhancedContext, capability);
      }

      // Update conversation state
      this.updateConversationState(sessionId, {
        lastMessage: message,
        lastResponse: response,
        context: enhancedContext,
        conversationHistory: [
          ...conversationState.conversationHistory,
          { role: 'user', content: message },
          { role: 'assistant', content: response.message }
        ]
      });

      return response;
    } catch (error) {
      console.error('UnifiedNicoleAIService chat error:', error);
      
      // Fallback to basic Nicole service to preserve functionality
      try {
        const nicoleContext: NicoleContext = this.convertToNicoleContext(context);
        const fallbackResponse = await chatWithNicole(message, nicoleContext);
        return {
          message: fallbackResponse.message,
          context,
          capability: 'conversation',
          actions: [],
          searchQuery: this.generateSearchQuery(context),
          showSearchButton: fallbackResponse.showSearchButton || false
        };
      } catch (fallbackError) {
        console.error('Fallback Nicole service also failed:', fallbackError);
        return {
          message: "I'm having trouble right now. Please try again in a moment.",
          context,
          capability: 'conversation',
          actions: [],
          showSearchButton: false
        };
      }
    }
  }

  /**
   * Generate enhanced search query - preserves existing functionality
   */
  generateSearchQuery(context: UnifiedNicoleContext): string {
    return generateEnhancedSearchQuery({
      recipient: context.recipient,
      relationship: context.relationship,
      occasion: context.occasion,
      exactAge: context.exactAge,
      interests: context.interests,
      budget: context.budget,
      detectedBrands: context.detectedBrands
    });
  }

  /**
   * Get conversation context for a session
   */
  getConversationContext(sessionId: string): UnifiedNicoleContext {
    const state = this.conversationStates.get(sessionId);
    return state?.context || this.getDefaultContext();
  }

  /**
   * Update conversation context
   */
  updateConversationContext(sessionId: string, updates: Partial<UnifiedNicoleContext>): void {
    const state = this.getConversationState(sessionId);
    const updatedContext = { ...state.context, ...updates };
    
    this.updateConversationState(sessionId, {
      ...state,
      context: updatedContext
    });
  }

  /**
   * Clear conversation state
   */
  clearConversation(sessionId: string): void {
    this.conversationStates.delete(sessionId);
  }

  /**
   * Get all active capabilities for current context
   */
  getAvailableCapabilities(context: UnifiedNicoleContext): NicoleCapability[] {
    return this.capabilityRouter.getAvailableCapabilities(context);
  }

  // Private methods
  private getConversationState(sessionId: string): NicoleConversationState {
    if (!this.conversationStates.has(sessionId)) {
      this.conversationStates.set(sessionId, {
        sessionId,
        context: this.getDefaultContext(),
        conversationHistory: [],
        lastMessage: '',
        lastResponse: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    return this.conversationStates.get(sessionId)!;
  }

  private updateConversationState(sessionId: string, updates: Partial<NicoleConversationState>): void {
    const currentState = this.getConversationState(sessionId);
    this.conversationStates.set(sessionId, {
      ...currentState,
      ...updates,
      updatedAt: new Date()
    });
  }

  private getDefaultContext(): UnifiedNicoleContext {
    return {
      conversationPhase: 'greeting',
      capability: 'conversation',
      interests: [],
      detectedBrands: []
    };
  }

  private determineConversationPhase(message: string, context: UnifiedNicoleContext): string {
    // Simple phase detection - can be enhanced
    if (!context.recipient && message.toLowerCase().includes('gift')) {
      return 'recipient_identification';
    }
    if (context.recipient && !context.occasion) {
      return 'occasion_identification';
    }
    if (context.recipient && context.occasion && !context.budget) {
      return 'budget_discussion';
    }
    if (context.recipient && context.occasion && context.budget) {
      return 'recommendation_ready';
    }
    return 'conversation';
  }

  private extractActions(nicoleResponse: OriginalNicoleResponse): string[] {
    const actions: string[] = [];
    
    if (nicoleResponse.showSearchButton) {
      actions.push('show_search_button');
    }
    if (nicoleResponse.generateSearch) {
      actions.push('search_ready');
    }
    
    return actions;
  }

  private convertToNicoleContext(unifiedContext: UnifiedNicoleContext): NicoleContext {
    return {
      recipient: unifiedContext.recipient,
      relationship: unifiedContext.relationship,
      occasion: unifiedContext.occasion,
      interests: unifiedContext.interests,
      budget: unifiedContext.budget,
      exactAge: unifiedContext.exactAge,
      conversationPhase: unifiedContext.conversationPhase as any,
      detectedBrands: unifiedContext.detectedBrands,
      ageGroup: this.determineAgeGroup(unifiedContext.exactAge)
    };
  }

  private determineAgeGroup(exactAge?: number): string | undefined {
    if (!exactAge) return undefined;
    if (exactAge < 13) return 'child';
    if (exactAge < 20) return 'teen';
    if (exactAge < 30) return 'young_adult';
    if (exactAge < 50) return 'adult';
    return 'senior';
  }

  private async handleSpecializedCapability(
    message: string,
    context: UnifiedNicoleContext,
    capability: NicoleCapability
  ): Promise<NicoleResponse> {
    switch (capability) {
      case 'gift_advisor':
        return this.handleGiftAdvisorCapability(message, context);
      case 'auto_gifting':
        return this.handleAutoGiftingCapability(message, context);
      case 'budget_analysis':
        return this.handleBudgetAnalysisCapability(message, context);
      default:
        // Fallback to conversation
        const nicoleContext: NicoleContext = this.convertToNicoleContext(context);
        const response = await chatWithNicole(message, nicoleContext);
        return {
          message: response.message,
          context,
          capability: 'conversation',
          actions: this.extractActions(response),
          searchQuery: this.generateSearchQuery(context),
          showSearchButton: response.showSearchButton || false
        };
    }
  }

  private async handleGiftAdvisorCapability(
    message: string,
    context: UnifiedNicoleContext
  ): Promise<NicoleResponse> {
    // **PHASE 2.3: ChatGPT Agent Integration with existing system**
    
    // Check if this is a quick-gift flow - use ChatGPT Agent
    if (context.conversationPhase === 'quick-gift' || context.giftCollectionPhase) {
      console.log('🎁 Using ChatGPT Agent for quick-gift flow');
      return this.handleChatGPTAgentFlow(message, context, 'default');
    }
    
    // **PHASE 4.1: Preserve existing fallback chain**
    // Use enhanced Nicole service for regular gift advisor functionality
    try {
      const nicoleContext: NicoleContext = this.convertToNicoleContext(context);
      const response = await chatWithNicole(message, {
        ...nicoleContext,
        conversationPhase: 'gathering_info'
      });
      
      return {
        message: response.message,
        context,
        capability: 'gift_advisor',
        actions: this.extractActions(response),
        searchQuery: this.generateSearchQuery(context),
        showSearchButton: response.showSearchButton || false
      };
    } catch (error) {
      console.error('Gift advisor capability error:', error);
      // Fallback to basic conversation
      const nicoleContext: NicoleContext = this.convertToNicoleContext(context);
      try {
        const fallback = await chatWithNicole(message, nicoleContext);
        return {
          message: fallback.message,
          context,
          capability: 'conversation',
          actions: [],
          searchQuery: this.generateSearchQuery(context),
          showSearchButton: fallback.showSearchButton || false
        };
      } catch (fallbackError) {
        console.error('All gift advisor methods failed:', fallbackError);
        return {
          message: "I'd love to help you find the perfect gift! Tell me who you're shopping for and what the occasion is.",
          context,
          capability: 'gift_advisor',
          actions: ['continue_conversation'],
          searchQuery: '',
          showSearchButton: false
        };
      }
    }
  }

  private async handleAutoGiftingCapability(
    message: string,
    context: UnifiedNicoleContext
  ): Promise<NicoleResponse> {
    // Enhanced auto-gifting conversation logic
    if (context.recipient && !context.occasion) {
      // Analyze recipient and suggest occasions
      const response = `Perfect! I see you want to set up auto-gifting for ${context.recipient}. Based on your relationship as ${context.relationship || 'friends'}, I recommend setting up ${context.recipient}'s birthday first. Should I also add their anniversary in June if you'd like both covered?`;
      
      return {
        message: response,
        context: { ...context, conversationPhase: 'occasion_confirmation' },
        capability: 'auto_gifting',
        actions: ['confirm_occasion', 'setup_auto_gifting'],
        searchQuery: this.generateSearchQuery(context),
        showSearchButton: false
      };
    }
    
    if (context.recipient && context.occasion && !context.budget) {
      // Suggest relationship-based budget
      const relationshipMultiplier = context.relationship === 'close_friend' ? 1.1 : 
                                   context.relationship === 'family' ? 1.2 : 1.0;
      const suggestedMin = Math.round(50 * 0.7 * relationshipMultiplier);
      const suggestedMax = Math.round(75 * relationshipMultiplier);
      
      const response = `Great! Based on your ${context.relationship || 'friendship'} with ${context.recipient}, I suggest $${suggestedMin}-${suggestedMax} for ${context.occasion} gifts. Sound good, or would you prefer a different range?`;
      
      return {
        message: response,
        context: { ...context, conversationPhase: 'budget_confirmation', budget: [suggestedMin, suggestedMax] },
        capability: 'auto_gifting',
        actions: ['confirm_budget', 'setup_auto_gifting'],
        searchQuery: this.generateSearchQuery(context),
        showSearchButton: false
      };
    }
    
    // Fallback to general auto-gifting conversation
    const nicoleContext: NicoleContext = {
      ...this.convertToNicoleContext(context),
      conversationPhase: 'gathering_info'
    };
    
    const response = await chatWithNicole(message, nicoleContext);

    return {
      message: response.message,
      context,
      capability: 'auto_gifting',
      actions: ['setup_auto_gifting'],
      searchQuery: this.generateSearchQuery(context),
      showSearchButton: response.showSearchButton || false
    };
  }

  private async handleBudgetAnalysisCapability(
    message: string,
    context: UnifiedNicoleContext
  ): Promise<NicoleResponse> {
    // Handle budget analysis conversations
    const nicoleContext: NicoleContext = {
      ...this.convertToNicoleContext(context),
      conversationPhase: 'gathering_info'
    };
    
    const response = await chatWithNicole(message, nicoleContext);

    return {
      message: response.message,
      context,
      capability: 'budget_analysis',
      actions: ['analyze_budget'],
      searchQuery: this.generateSearchQuery(context),
      showSearchButton: response.showSearchButton || false
    };
  }

  /**
   * Handle ChatGPT Agent flow for quick gift collection
   */
  private async handleChatGPTAgentFlow(
    message: string,
    context: UnifiedNicoleContext,
    sessionId: string
  ): Promise<NicoleResponse> {
    try {
      const response = await supabase.functions.invoke('nicole-chatgpt-agent', {
        body: { message, context, sessionId }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    } catch (error) {
      console.error('ChatGPT Agent error, falling back to original Nicole:', error);
      
      // Fallback to original gift advisor capability
      return await this.handleGiftAdvisorCapability(message, context);
    }
  }
}

// Export singleton instance
export const unifiedNicoleAI = UnifiedNicoleAIService.getInstance();