import { supabase } from "@/integrations/supabase/client";
import { chatWithNicole, NicoleContext, NicoleResponse as OriginalNicoleResponse } from "../nicoleAiService";
import { EnhancedNicoleService } from "../enhancedNicoleService";
import { generateEnhancedSearchQuery } from "../enhancedSearchQueryGenerator";
import { UnifiedNicoleContext, NicoleCapability, NicoleConversationState, NicoleResponse } from "./types";
import { NicoleCapabilityRouter } from "./NicoleCapabilityRouter";
import { autoGiftIntelligenceService } from "../AutoGiftIntelligenceService";

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
      
      // Handle special trigger messages for dynamic conversation initiation
      const isFirstMessage = conversationState.conversationHistory.length === 0;
      const isDynamicGreeting = message === "__START_AUTO_GIFT__" || message === "__START_DYNAMIC_CHAT__" || (isFirstMessage && context.greetingContext);
      
      // Don't add trigger messages to conversation history
      let updatedHistory = conversationState.conversationHistory;
      if (!isDynamicGreeting) {
        updatedHistory = [
          ...conversationState.conversationHistory,
          { role: 'user', content: message }
        ];
      }
      
      // Update the conversation state with current message
      this.updateConversationState(sessionId, {
        conversationHistory: updatedHistory,
        lastMessage: message
      });
      
      // Extract recipient info from natural conversation with context awareness
      const extractedRecipient = this.capabilityRouter.extractRecipientFromMessage(message, context);
      
      // Route to appropriate capability
      const capability = this.capabilityRouter.determineCapability(message, context);
      
      // Pre-load auto-gift intelligence for auto-gifting flows
      let intelligenceContext = context;
      if (capability === 'auto_gifting' && context.currentUserId && !context.autoGiftIntelligence) {
        try {
          const intelligence = await autoGiftIntelligenceService.analyzeUserAutoGiftOpportunities(context.currentUserId);
          intelligenceContext = {
            ...context,
            autoGiftIntelligence: {
              hasIntelligence: intelligence.primaryRecommendation !== null,
              primaryRecommendation: intelligence.primaryRecommendation ? {
                recipientName: intelligence.primaryRecommendation.recipient.name,
                recipientId: intelligence.primaryRecommendation.recipient.id,
                occasionType: intelligence.primaryRecommendation.occasion.type,
                occasionDate: intelligence.primaryRecommendation.occasion.date,
                budgetRange: [intelligence.primaryRecommendation.budget.min, intelligence.primaryRecommendation.budget.max],
                confidence: intelligence.primaryRecommendation.confidence
              } : undefined,
              alternativeOptions: intelligence.alternativeOptions.map(alt => ({
                recipientName: alt.recipient.name,
                occasionType: alt.occasion.type,
                occasionDate: alt.occasion.date
              })),
              canUseOptimalFlow: autoGiftIntelligenceService.canUseOptimalFlow(intelligence)
            }
          };
        } catch (error) {
          console.error('Failed to load auto-gift intelligence:', error);
          // Continue without intelligence
        }
      }
      
      // Update context with capability and extracted info
      const enhancedContext = {
        ...intelligenceContext,
        ...extractedRecipient,
        capability,
        conversationPhase: this.determineConversationPhase(message, intelligenceContext),
        // Update lastMentionedRecipient for pronoun resolution
        lastMentionedRecipient: extractedRecipient.recipient || intelligenceContext.lastMentionedRecipient
      };

      let response: NicoleResponse;

      // Route to specialized capabilities or use ChatGPT Agent 
      if (capability === 'auto_gifting' || enhancedContext.selectedIntent === 'auto-gift') {
        // Use ChatGPT Agent for auto-gifting flows
        console.log('🎁 Routing to ChatGPT Agent for auto-gifting');
        response = await this.handleChatGPTAgentFlow(message, enhancedContext, sessionId);
      } else if (capability === 'gift_advisor' && enhancedContext.recipient) {
        // Use ChatGPT Agent for gift advisor with recipient
        console.log('🎁 Routing to ChatGPT Agent for gift advisor');
        response = await this.handleChatGPTAgentFlow(message, enhancedContext, sessionId);
      } else if (isDynamicGreeting || capability === 'conversation' || capability === 'search') {
        // Use ChatGPT Agent for dynamic greetings and general conversation
        console.log('💬 Routing to ChatGPT Agent for conversation');
        response = await this.handleChatGPTAgentFlow(message, enhancedContext, sessionId);
      } else {
        // Route to specialized capabilities
        response = await this.handleSpecializedCapability(message, enhancedContext, capability);
      }

      // Update conversation state with assistant response
      const finalHistory = [
        ...this.getConversationState(sessionId).conversationHistory,
        { role: 'assistant', content: response.message }
      ];
      
      this.updateConversationState(sessionId, {
        lastResponse: response,
        context: enhancedContext,
        conversationHistory: finalHistory
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
   * Generate enhanced search query with direct API integration
   */
  generateSearchQuery(context: UnifiedNicoleContext): string {
    console.log('🎯 UnifiedNicole: Generating search query with context:', context);
    
    const enhancedQuery = generateEnhancedSearchQuery({
      recipient: context.recipient,
      relationship: context.relationship,
      occasion: context.occasion,
      exactAge: context.exactAge,
      interests: context.interests,
      budget: context.budget,
      detectedBrands: context.detectedBrands
    });

    // **PHASE 1: Direct API Pipeline - Store context for marketplace**
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('nicoleContext', JSON.stringify({
        ...context,
        searchQuery: enhancedQuery,
        timestamp: Date.now(),
        source: 'unified-nicole'
      }));
      console.log('🎯 UnifiedNicole: Context stored for marketplace integration');
    }

    return enhancedQuery;
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
    // Enhanced phase detection with 2-question flow support
    const messageLower = message.toLowerCase();
    
    // Auto-gift optimal flow phases
    if (context.capability === 'auto_gifting' && context.autoGiftIntelligence?.canUseOptimalFlow) {
      if (!context.recipient && !context.occasion) {
        return 'smart_recipient_occasion_confirmation';
      }
      if (context.recipient && context.occasion && !context.budget) {
        return 'intelligent_budget_confirmation';
      }
      if (context.recipient && context.occasion && context.budget) {
        return 'auto_gift_setup_complete';
      }
    }
    
    // Traditional 3-question fallback flow
    if (!context.recipient && messageLower.includes('gift')) {
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
    // Optimal 2-question flow with intelligence
    if (context.autoGiftIntelligence?.canUseOptimalFlow) {
      return this.handleOptimalAutoGiftFlow(message, context);
    }
    
    // Traditional 3-question fallback flow
    return this.handleTraditionalAutoGiftFlow(message, context);
  }

  /**
   * Handle optimal 2-question auto-gift flow with casual, first-name conversation
   */
  private async handleOptimalAutoGiftFlow(
    message: string,
    context: UnifiedNicoleContext
  ): Promise<NicoleResponse> {
    const intelligence = context.autoGiftIntelligence!;
    const firstName = context.userFirstName || context.greetingContext?.firstName || 'there';
    
    // Question 1: Smart recipient + occasion confirmation (casual style)
    if (context.conversationPhase === 'smart_recipient_occasion_confirmation') {
      const primaryRec = intelligence.primaryRecommendation;
      let smartQuestion1 = `Hey ${firstName}! `;
      
      if (primaryRec) {
        smartQuestion1 += `I see ${primaryRec.recipientName}'s ${primaryRec.occasionType} is coming up on ${primaryRec.occasionDate}. Want me to set up automatic gifting for their ${primaryRec.occasionType}?`;
        
        if (intelligence.alternativeOptions.length > 0) {
          const altOption = intelligence.alternativeOptions[0];
          smartQuestion1 += ` I could also add ${altOption.recipientName}'s ${altOption.occasionType} if you'd like both covered.`;
        }
      } else {
        smartQuestion1 += `I found some great auto-gifting opportunities for you! Who should I help you set up gifting for first?`;
      }

      return {
        message: smartQuestion1,
        context: { 
          ...context, 
          conversationPhase: 'intelligent_budget_confirmation',
          recipient: primaryRec?.recipientName,
          occasion: primaryRec?.occasionType,
          userFirstName: firstName
        },
        capability: 'auto_gifting',
        actions: ['smart_recipient_occasion_confirmation'],
        searchQuery: this.generateSearchQuery(context),
        showSearchButton: false
      };
    }

    // Question 2: Intelligent budget confirmation
    if (context.conversationPhase === 'intelligent_budget_confirmation' && intelligence.primaryRecommendation) {
      const smartQuestion2 = autoGiftIntelligenceService.generateSmartQuestion2({
        name: intelligence.primaryRecommendation.recipientName,
        relationship: context.relationship || 'friend',
        suggestedBudget: {
          min: intelligence.primaryRecommendation.budgetRange[0],
          max: intelligence.primaryRecommendation.budgetRange[1],
          recommended: Math.round((intelligence.primaryRecommendation.budgetRange[0] + intelligence.primaryRecommendation.budgetRange[1]) / 2),
          reasoning: `This range works well for ${context.relationship || 'friend'} relationships.`
        }
      } as any);

      return {
        message: smartQuestion2,
        context: { 
          ...context, 
          conversationPhase: 'intelligent_budget_confirmation',
          budget: intelligence.primaryRecommendation.budgetRange
        },
        capability: 'auto_gifting',
        actions: ['intelligent_budget_confirmation', 'setup_auto_gifting'],
        searchQuery: this.generateSearchQuery(context),
        showSearchButton: false
      };
    }

    // Setup complete
    if (context.conversationPhase === 'auto_gift_setup_complete') {
      return {
        message: `Perfect! I've set up auto-gifting for ${context.recipient}'s ${context.occasion} with a $${context.budget?.[0]}-${context.budget?.[1]} budget. You'll get a notification a few days before the event so you can review and approve the gift selection.`,
        context: { ...context, conversationPhase: 'auto_gift_setup_complete' },
        capability: 'auto_gifting',
        actions: ['setup_auto_gifting'],
        searchQuery: this.generateSearchQuery(context),
        showSearchButton: false
      };
    }

    // Fallback to traditional flow
    return this.handleTraditionalAutoGiftFlow(message, context);
  }

  /**
   * Handle traditional 3-question fallback flow with casual conversation
   */
  private async handleTraditionalAutoGiftFlow(
    message: string,
    context: UnifiedNicoleContext
  ): Promise<NicoleResponse> {
    const firstName = context.userFirstName || context.greetingContext?.firstName || 'there';
    
    // Traditional fallback for when intelligence isn't available
    if (!context.recipient) {
      return {
        message: `Hey ${firstName}! Who should I help you set up auto-gifting for? I can find perfect gifts for anyone special to you.`,
        context: { ...context, conversationPhase: 'recipient_identification', userFirstName: firstName },
        capability: 'auto_gifting',
        actions: ['identify_recipient'],
        showSearchButton: false
      };
    }
    
    if (!context.occasion) {
      return {
        message: `Great choice with ${context.recipient}! What occasion should I set up auto-gifting for?`,
        context: { ...context, conversationPhase: 'occasion_identification', userFirstName: firstName },
        capability: 'auto_gifting',
        actions: ['identify_occasion'],
        showSearchButton: false
      };
    }
    
    if (!context.budget) {
      const relationship = context.relationship || 'friend';
      return {
        message: `Perfect! For ${context.recipient}'s ${context.occasion}, what budget range works for you? Since they're a ${relationship}, I can suggest a range if you'd like.`,
        context: { ...context, conversationPhase: 'budget_discussion', userFirstName: firstName },
        capability: 'auto_gifting',
        actions: ['set_budget'],
        showSearchButton: false
      };
    }
    
    return {
      message: `Awesome! I've set up auto-gifting for ${context.recipient}'s ${context.occasion} with your $${context.budget?.[0]}-${context.budget?.[1]} budget. I'll find amazing gifts that fit perfectly!`,
      context: { ...context, conversationPhase: 'auto_gift_setup_complete', userFirstName: firstName },
      capability: 'auto_gifting',
      actions: ['setup_complete'],
      showSearchButton: true
    };
    
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
      // Fetch user connections to provide to the AI
      let userConnections: any[] = [];
      if (context.currentUserId) {
        try {
          const { data: connectionsData, error } = await supabase
            .from('user_connections')
            .select(`
              *,
              profiles!user_connections_connected_user_id_fkey (
                id,
                name,
                username,
                profile_image,
                interests
              )
            `)
            .eq('user_id', context.currentUserId)
            .eq('status', 'accepted');
          
          if (!error && connectionsData) {
            userConnections = connectionsData.map(conn => ({
              id: conn.connected_user_id,
              name: conn.profiles?.name || conn.profiles?.username || 'Unknown',
              relationship: conn.relationship_type,
              interests: conn.profiles?.interests || []
            }));
          }
          
          console.log(`Found ${userConnections.length} connections for user ${context.currentUserId}`);
        } catch (connError) {
          console.error('Error fetching user connections:', connError);
        }
      }

      // Prepare context for ChatGPT Agent with proper structure
      const agentContext = {
        ...context,
        conversationPhase: context.conversationPhase || 'initial',
        selectedIntent: context.selectedIntent || 'auto-gift',
        userConnections, // Include real connection data
        // Ensure currentUserId and userFirstName are properly passed
        currentUserId: context.currentUserId,
        userFirstName: context.userFirstName
      };

      console.log('🚀 Sending context to ChatGPT Agent:', {
        hasUserId: !!agentContext.currentUserId,
        hasFirstName: !!agentContext.userFirstName,
        firstName: agentContext.userFirstName
      });

      // Get current conversation history (already includes the user message)
      const conversationState = this.getConversationState(sessionId);
      
      const response = await supabase.functions.invoke('nicole-chat', {
        body: { 
          message, 
          context: agentContext,
          conversationHistory: conversationState.conversationHistory,
          enhancedFeatures: {
            multiCategorySearch: true,
            brandCategoryMapping: true,
            groupedResults: true,
            conversationEnhancement: true,
            connectionIntegration: true,
            wishlistIntegration: true
          },
          hasConnections: userConnections.length > 0,
          hasWishlists: false // We can add wishlist support later
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Convert ChatGPT Agent response to unified format
      const agentData = response.data;
      const actionsFromAgent = agentData.actions || [];

      // Proactively offer auto-gifting when recipient and occasion are present
      const shouldOfferAutoGifting = Boolean((agentData.context || context)?.recipient && (agentData.context || context)?.occasion);
      const mergedActions = shouldOfferAutoGifting && !actionsFromAgent.includes('offer_auto_gifting')
        ? [...actionsFromAgent, 'offer_auto_gifting']
        : actionsFromAgent;

      return {
        message: agentData.message || agentData.response,
        context: agentData.context || context,
        capability: (context.selectedIntent === 'auto-gift' ? 'auto_gifting' : 'gift_advisor') as NicoleCapability,
        actions: mergedActions,
        searchQuery: agentData.searchQuery || '',
        showSearchButton: agentData.showSearchButton || false,
        metadata: agentData.metadata
      };
    } catch (error) {
      console.error('ChatGPT Agent error, falling back to original Nicole:', error);
      
      // Fallback to original gift advisor capability
      return await this.handleGiftAdvisorCapability(message, context);
    }
  }
}

// Export singleton instance
export const unifiedNicoleAI = UnifiedNicoleAIService.getInstance();