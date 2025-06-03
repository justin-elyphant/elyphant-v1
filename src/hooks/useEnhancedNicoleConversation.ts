
import { useState, useCallback } from "react";
import { chatWithNicole, generateSearchQuery, NicoleMessage, NicoleContext } from "@/services/ai/nicoleAiService";

export interface ConversationMessage {
  type: "nicole" | "user";
  content: string;
  timestamp: Date;
}

export type ConversationStep = "greeting" | "chatting" | "generating" | "complete";

export const useEnhancedNicoleConversation = () => {
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [currentStep, setCurrentStep] = useState<ConversationStep>("greeting");
  const [context, setContext] = useState<NicoleContext>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<NicoleMessage[]>([]);

  const addMessage = useCallback((message: ConversationMessage) => {
    setConversation(prev => [...prev, message]);
  }, []);

  const sendMessage = useCallback(async (userMessage: string) => {
    // Add user message to conversation
    const userConversationMessage: ConversationMessage = {
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
    setCurrentStep("chatting");

    try {
      // Get AI response
      const aiResponse = await chatWithNicole(userMessage, conversationHistory, context);
      
      // Add Nicole's response to conversation
      const nicoleConversationMessage: ConversationMessage = {
        type: "nicole",
        content: aiResponse.response,
        timestamp: new Date()
      };
      addMessage(nicoleConversationMessage);

      // Add to conversation history
      const nicoleAiMessage: NicoleMessage = {
        role: "assistant",
        content: aiResponse.response
      };
      setConversationHistory(prev => [...prev, nicoleAiMessage]);

      // Update step based on AI response
      if (aiResponse.shouldGenerateSearch) {
        setCurrentStep("complete");
      } else if (aiResponse.conversationContinues) {
        setCurrentStep("chatting");
      }

    } catch (error) {
      console.error("Error getting AI response:", error);
      
      // Add fallback message
      const fallbackMessage: ConversationMessage = {
        type: "nicole",
        content: "I'm having trouble right now. Let me help you with a basic search instead. What are you looking for?",
        timestamp: new Date()
      };
      addMessage(fallbackMessage);
      
      setCurrentStep("chatting");
    } finally {
      setIsGenerating(false);
    }
  }, [conversationHistory, context, addMessage]);

  const generateSearchQueryFromContext = useCallback(async (): Promise<string> => {
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
    if (initialQuery) {
      await sendMessage(initialQuery);
    } else {
      // Add initial greeting
      const greetingMessage: ConversationMessage = {
        type: "nicole",
        content: "Hi! I'm Nicole, your AI gift assistant. I'll help you find the perfect gift. What can I help you find today?",
        timestamp: new Date()
      };
      addMessage(greetingMessage);
      setCurrentStep("chatting");
    }
  }, [sendMessage, addMessage]);

  return {
    conversation,
    currentStep,
    context,
    isGenerating,
    sendMessage,
    generateSearchQuery: generateSearchQueryFromContext,
    resetConversation,
    startConversation
  };
};
