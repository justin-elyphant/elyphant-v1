
import { supabase } from "@/integrations/supabase/client";

export type ConversationPhase = 'greeting' | 'gathering_info' | 'clarifying_needs' | 'providing_suggestions';

export type UserIntent = 'finding_gift' | 'exploring' | 'comparing' | 'ready_to_buy';

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
  conversationPhase?: ConversationPhase;
  userIntent?: UserIntent;
  connections?: any[];
  recipientWishlists?: any[];
  recipientProfile?: any;
  recommendations?: any[];
  detectedBrands?: string[];
  ageGroup?: string;
  exactAge?: number;
}

export interface NicoleResponse {
  response: string;
  context: NicoleContext;
  suggestedQueries?: string[];
  shouldShowProducts?: boolean;
}

const NICOLE_SYSTEM_PROMPT = `You are Nicole, a helpful AI gift advisor. You help users find perfect gifts by understanding their needs and providing personalized recommendations.

Key behaviors:
- Be warm, friendly, and conversational
- Ask clarifying questions to understand the recipient and occasion
- Suggest specific products and categories when appropriate
- Keep responses concise but helpful
- Guide users through the gift-finding process step by step

Remember: You're helping find the perfect gift, so focus on understanding who it's for, what the occasion is, and what the recipient likes.`;

export async function chatWithNicole(
  message: string,
  conversationHistory: NicoleMessage[],
  context: NicoleContext = {}
): Promise<NicoleResponse> {
  try {
    // Build the conversation with system prompt and history
    const messages = [
      { role: 'system', content: NICOLE_SYSTEM_PROMPT },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    // For now, return a contextual response
    // This would be replaced with actual AI service call
    const response = generateContextualResponse(message, context);
    
    return {
      response,
      context: {
        ...context,
        conversationPhase: determinePhase(context),
      },
      shouldShowProducts: shouldShowProducts(context)
    };
    
  } catch (error) {
    console.error('Error in Nicole chat:', error);
    return {
      response: "I'm having trouble right now, but I'm here to help you find the perfect gift! What are you looking for?",
      context,
      shouldShowProducts: false
    };
  }
}

function generateContextualResponse(message: string, context: NicoleContext): string {
  const lowerMessage = message.toLowerCase();
  
  // Enhanced brand detection
  if (context.detectedBrands && context.detectedBrands.length > 0) {
    const brands = context.detectedBrands.join(', ');
    return `I see you're interested in ${brands}! That's a great choice. Can you tell me more about who this gift is for and what the occasion is?`;
  }
  
  // Age-aware responses
  if (context.ageGroup) {
    return `Great! Shopping for a ${context.ageGroup} is exciting. What are they interested in? Any specific hobbies or activities they love?`;
  }
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return "Hi! I'm Nicole, your AI gift advisor. I'm here to help you find the perfect gift. Who are you shopping for today?";
  }
  
  if (context.recipient && !context.occasion) {
    return `Great! You're shopping for your ${context.recipient}. What's the occasion?`;
  }
  
  if (context.recipient && context.occasion && !context.interests) {
    return `Perfect! A gift for your ${context.recipient}'s ${context.occasion}. What are they interested in? Any hobbies, favorite activities, or things they've mentioned wanting?`;
  }
  
  if (context.recipient && context.occasion && context.interests) {
    return `Excellent! I have a good understanding now. Let me find some perfect gift options for your ${context.recipient}'s ${context.occasion} based on their interests in ${context.interests?.join(', ')}.`;
  }
  
  return "Tell me more about what you're looking for! Who is this gift for and what's the occasion?";
}

function determinePhase(context: NicoleContext): ConversationPhase {
  if (!context.recipient) return 'greeting';
  if (context.recipient && !context.occasion) return 'gathering_info';
  if (context.recipient && context.occasion && !context.interests && !context.detectedBrands) return 'clarifying_needs';
  return 'providing_suggestions';
}

function shouldShowProducts(context: NicoleContext): boolean {
  return Boolean(context.recipient && (context.occasion || context.interests || context.detectedBrands));
}

export function generateSearchQuery(context: NicoleContext): string {
  const parts: string[] = [];
  
  // Brand-first approach
  if (context.detectedBrands && context.detectedBrands.length > 0) {
    parts.push(context.detectedBrands[0]);
  }
  
  if (context.interests && context.interests.length > 0) {
    parts.push(context.interests.join(' '));
  }
  
  if (context.ageGroup) {
    parts.push(`for ${context.ageGroup}`);
  } else if (context.recipient) {
    parts.push(`for ${context.recipient}`);
  }
  
  if (context.occasion) {
    parts.push(context.occasion);
  }
  
  if (context.budget) {
    const [min, max] = context.budget;
    parts.push(`under $${max}`);
  }
  
  return parts.join(' ') || 'gifts';
}
