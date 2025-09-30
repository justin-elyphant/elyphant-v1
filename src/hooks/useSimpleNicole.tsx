import { useState, useCallback } from "react";
import { useAuthSession } from "@/contexts/auth/useAuthSession";
import { supabase } from "@/integrations/supabase/client";

export interface SimpleNicoleContext {
  recipient?: string;
  occasion?: string;
  budget?: [number, number];
  relationship?: string;
  interests?: string[];
  conversationPhase?: string;
  capability?: string;
}

export interface NicoleCTAButton {
  id: string;
  text: string;
  action: string;
  data: any;
}

export interface SimpleNicoleResponse {
  message: string;
  context: SimpleNicoleContext;
  capability: string;
  ctaButtons: NicoleCTAButton[];
  actions: string[];
  showSearchButton: boolean;
  metadata?: any;
}

export const useSimpleNicole = () => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; ctaButtons?: NicoleCTAButton[] }>>([]);
  const [context, setContext] = useState<SimpleNicoleContext>({});
  const [isLoading, setIsLoading] = useState(false);
  const { session } = useAuthSession();

  const sendMessage = useCallback(async (message: string): Promise<SimpleNicoleResponse> => {
    setIsLoading(true);
    
    try {
      // Add user message to chat
      setMessages(prev => [...prev, { role: 'user', content: message }]);

      const { data, error } = await supabase.functions.invoke('nicole-unified-agent', {
        body: {
          message,
          context,
          userId: session?.user?.id,
          sessionId: `session-${Date.now()}`
        }
      });

      if (error) {
        throw error;
      }

      const response: SimpleNicoleResponse = data;
      
      // Update context with response
      setContext(response.context);
      
      // Add assistant response to chat
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.message,
        ctaButtons: response.ctaButtons
      }]);

      return response;
      
    } catch (error) {
      console.error('Nicole conversation error:', error);
      
      const fallbackResponse: SimpleNicoleResponse = {
        message: "Sorry, I'm having trouble right now. Please try again.",
        context,
        capability: 'conversation',
        ctaButtons: [],
        actions: [],
        showSearchButton: false
      };
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: fallbackResponse.message 
      }]);
      
      return fallbackResponse;
    } finally {
      setIsLoading(false);
    }
  }, [context, session]);

  const startDynamicGreeting = useCallback(async (greetingContext?: any): Promise<SimpleNicoleResponse> => {
    return sendMessage('__START_DYNAMIC_CHAT__');
  }, [sendMessage]);

  const clearConversation = useCallback(() => {
    setMessages([]);
    setContext({});
  }, []);

  const updateContext = useCallback((updates: Partial<SimpleNicoleContext>) => {
    setContext(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    messages,
    context,
    isLoading,
    sendMessage,
    startDynamicGreeting,
    clearConversation,
    updateContext
  };
};