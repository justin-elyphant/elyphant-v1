
import { supabase } from "@/integrations/supabase/client";

export interface NicoleMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface NicoleContext {
  recipient?: string;
  relationship?: string;
  occasion?: string;
  budget?: [number, number];
  interests?: string[];
  step?: string;
}

export interface NicoleResponse {
  response: string;
  shouldGenerateSearch: boolean;
  conversationContinues: boolean;
  fallback?: boolean;
  error?: string;
}

/**
 * Send a message to Nicole AI and get a response
 */
export const chatWithNicole = async (
  message: string,
  conversationHistory: NicoleMessage[] = [],
  context: NicoleContext = {}
): Promise<NicoleResponse> => {
  try {
    console.log('Sending message to Nicole AI:', message);
    
    const { data, error } = await supabase.functions.invoke('nicole-chat', {
      body: {
        message: message.trim(),
        conversationHistory,
        context
      }
    });

    if (error) {
      console.error('Nicole chat error:', error);
      throw new Error(`Nicole AI error: ${error.message}`);
    }

    console.log('Nicole AI response received');
    return data as NicoleResponse;

  } catch (error) {
    console.error('Error calling Nicole AI:', error);
    
    // Return fallback response
    return {
      response: "I'm having trouble connecting to my AI service right now. Let me help you with a basic gift search instead. What kind of gift are you looking for?",
      shouldGenerateSearch: false,
      conversationContinues: true,
      fallback: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Generate a search query based on conversation context
 */
export const generateSearchQuery = (context: NicoleContext): string => {
  let query = "gifts";
  
  if (context.recipient) {
    query += ` for ${context.recipient}`;
  }
  
  if (context.relationship) {
    query += ` ${context.relationship}`;
  }
  
  if (context.occasion) {
    query += ` ${context.occasion}`;
  }
  
  if (context.interests && context.interests.length > 0) {
    query += ` ${context.interests.join(" ")}`;
  }
  
  if (context.budget) {
    const [min, max] = context.budget;
    if (max < 100) {
      query += ` under $${max}`;
    }
  }
  
  return query.trim();
};

/**
 * Test if Nicole AI is available and working
 */
export const testNicoleConnection = async (): Promise<boolean> => {
  try {
    const result = await chatWithNicole("Hello", [], {});
    return !result.fallback && !result.error;
  } catch {
    return false;
  }
};
