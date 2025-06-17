
import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/auth";
import { EnhancedNicoleService, EnhancedNicoleContext, WishlistRecommendation } from "@/services/ai/enhancedNicoleService";
import { chatWithNicole, generateSearchQuery, NicoleMessage, ConversationPhase } from "@/services/ai/nicoleAiService";

export interface EnhancedConversationMessage {
  type: "nicole" | "user" | "wishlist_display" | "product_suggestions";
  content: string;
  timestamp: Date;
  data?: {
    wishlists?: any[];
    recommendations?: WishlistRecommendation[];
    searchSuggestions?: string[];
  };
}

export type EnhancedConversationStep = "greeting" | "discovery" | "wishlist_review" | "alternatives" | "generating" | "complete";

export const useEnhancedNicoleConversation = () => {
  const { user } = useAuth();
  const [conversation, setConversation] = useState<EnhancedConversationMessage[]>([]);
  const [currentStep, setCurrentStep] = useState<EnhancedConversationStep>("greeting");
  const [context, setContext] = useState<EnhancedNicoleContext>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<NicoleMessage[]>([]);

  const addMessage = useCallback((message: EnhancedConversationMessage) => {
    setConversation(prev => [...prev, message]);
  }, []);

  const sendMessage = useCallback(async (userMessage: string) => {
    if (!user) return;

    // Add user message to conversation
    const userConversationMessage: EnhancedConversationMessage = {
      type: "user",
      content: userMessage,
      timestamp: new Date()
    };
    addMessage(userConversationMessage);

    // Add to conversation history for AI
    const userAiMessage: NicoleMessage = {
      role: "user",
      content: userMessage
    };
    setConversationHistory(prev => [...prev, userAiMessage]);

    setIsGenerating(true);

    try {
      // Enhanced conversation analysis
      const analysis = await EnhancedNicoleService.analyzeConversation(
        userMessage,
        context,
        user.id
      );

      // Update context with new information
      setContext(prev => ({ ...prev, conversationPhase: analysis.phase }));

      // Get AI response with enhanced context
      const nicoleContext = {
        ...context,
        conversationPhase: analysis.phase,
        connections: context.connections,
        recipientWishlists: context.recipientWishlists,
        recommendations: analysis.recommendations
      };

      const aiResponse = await chatWithNicole(userMessage, conversationHistory, nicoleContext);
      
      // Add Nicole's response to conversation
      const nicoleConversationMessage: EnhancedConversationMessage = {
        type: "nicole",
        content: aiResponse.response,
        timestamp: new Date()
      };
      addMessage(nicoleConversationMessage);

      // Show wishlist items if applicable
      if (analysis.shouldShowWishlist && analysis.recommendations.length > 0) {
        const wishlistMessage: EnhancedConversationMessage = {
          type: "wishlist_display",
          content: "Here are the best matches from their wishlist:",
          timestamp: new Date(),
          data: {
            recommendations: analysis.recommendations.slice(0, 5) // Show top 5
          }
        };
        addMessage(wishlistMessage);
      }

      // Generate product suggestions if needed
      if (analysis.shouldSearchProducts && context.recipientProfile) {
        const searchSuggestions = await EnhancedNicoleService.generateGPTSuggestions(
          context.recipientProfile,
          nicoleContext,
          context.recipientWishlists || []
        );

        const suggestionsMessage: EnhancedConversationMessage = {
          type: "product_suggestions",
          content: "Based on their interests, here are some thoughtful alternatives:",
          timestamp: new Date(),
          data: {
            searchSuggestions
          }
        };
        addMessage(suggestionsMessage);
      }

      // Add to conversation history
      const nicoleAiMessage: NicoleMessage = {
        role: "assistant",
        content: aiResponse.response
      };
      setConversationHistory(prev => [...prev, nicoleAiMessage]);

      // Update step based on analysis
      switch (analysis.phase) {
        case 'gathering_info':
          setCurrentStep("discovery");
          break;
        case 'providing_suggestions':
          setCurrentStep("wishlist_review");
          break;
        case 'clarifying_needs':
          setCurrentStep("alternatives");
          break;
        default:
          setCurrentStep("discovery");
      }

    } catch (error) {
      console.error("Error in enhanced conversation:", error);
      
      // Add fallback message
      const fallbackMessage: EnhancedConversationMessage = {
        type: "nicole",
        content: "I'm having trouble right now. Let me help you with a basic search instead. What are you looking for?",
        timestamp: new Date()
      };
      addMessage(fallbackMessage);
      
      setCurrentStep("discovery");
    } finally {
      setIsGenerating(false);
    }
  }, [user, conversationHistory, context, addMessage]);

  const generateSearchQueryFromContext = useCallback(async (): Promise<string> => {
    if (context.recipientProfile && context.recipientWishlists) {
      const suggestions = await EnhancedNicoleService.generateGPTSuggestions(
        context.recipientProfile,
        context,
        context.recipientWishlists || []
      );
      return suggestions[0] || generateSearchQuery(context);
    }
    return generateSearchQuery(context);
  }, [context]);

  const resetConversation = useCallback(() => {
    setConversation([]);
    setCurrentStep("greeting");
    setContext({});
    setIsGenerating(false);
    setConversationHistory([]);
  }, []);

  const startConversation = useCallback(async (initialQuery?: string) => {
    if (!user) return;

    // Load user connections at the start
    const connections = await EnhancedNicoleService.getUserConnections(user.id);
    setContext(prev => ({ ...prev, connections }));

    if (initialQuery) {
      await sendMessage(initialQuery);
    } else {
      // Enhanced greeting with connection awareness
      let greetingContent = "Hi! I'm Nicole, your AI gift assistant. I'll help you find the perfect gift.";
      
      if (connections.length > 0) {
        greetingContent += ` I can see you're connected to ${connections.length} people. Who are you shopping for today?`;
      } else {
        greetingContent += " What can I help you find today?";
      }

      const greetingMessage: EnhancedConversationMessage = {
        type: "nicole",
        content: greetingContent,
        timestamp: new Date()
      };
      addMessage(greetingMessage);
      setCurrentStep("discovery");
    }
  }, [user, sendMessage, addMessage]);

  const selectWishlistItem = useCallback((recommendation: WishlistRecommendation) => {
    const message: EnhancedConversationMessage = {
      type: "nicole",
      content: `Great choice! "${recommendation.item.title}" ${recommendation.reasoning}. Would you like me to help you find this item or look for similar alternatives?`,
      timestamp: new Date()
    };
    addMessage(message);
    setCurrentStep("generating");
  }, [addMessage]);

  const searchByQuery = useCallback((query: string) => {
    const message: EnhancedConversationMessage = {
      type: "nicole",
      content: `Perfect! Let me search for "${query}" and find the best options for you.`,
      timestamp: new Date()
    };
    addMessage(message);
    setCurrentStep("generating");
  }, [addMessage]);

  return {
    conversation,
    currentStep,
    context,
    isGenerating,
    sendMessage,
    generateSearchQuery: generateSearchQueryFromContext,
    resetConversation,
    startConversation,
    selectWishlistItem,
    searchByQuery
  };
};
