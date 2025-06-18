
import { supabase } from "@/integrations/supabase/client";

export type ConversationPhase = 'greeting' | 'gathering_info' | 'clarifying_needs' | 'providing_suggestions';

export type UserIntent = 'finding_gift' | 'exploring' | 'comparing' | 'ready_to_buy';

export interface NicoleMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ContextualLink {
  label: string;
  text: string;
  url: string;
  type: 'search' | 'product' | 'category' | 'action' | 'connections' | 'wishlist' | 'schedule';
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
  askedForOccasion?: boolean;
  askedForInterests?: boolean;
  askedForBudget?: boolean;
}

export interface NicoleResponse {
  response: string;
  context: NicoleContext;
  suggestedQueries?: string[];
  shouldShowProducts?: boolean;
  contextualLinks?: ContextualLink[];
  shouldGenerateSearch?: boolean;
}

const NICOLE_SYSTEM_PROMPT = `You are Nicole, a helpful AI gift advisor. You help users find perfect gifts by understanding their needs and providing personalized recommendations.

Key behaviors:
- Be warm, friendly, and conversational
- Ask clarifying questions to understand the recipient and occasion
- Gather comprehensive information before suggesting products
- NEVER ask the same question twice
- NEVER suggest searching until you have recipient + occasion + interests/budget
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

    // Enhanced contextual response generation
    const response = generateEnhancedContextualResponse(message, context);
    const updatedPhase = determineEnhancedPhase(context);
    
    return {
      response,
      context: {
        ...context,
        conversationPhase: updatedPhase,
      },
      shouldShowProducts: shouldShowProducts(context),
      contextualLinks: [],
      shouldGenerateSearch: shouldGenerateSearch(context)
    };
    
  } catch (error) {
    console.error('Error in Nicole chat:', error);
    return {
      response: "I'm having trouble right now, but I'm here to help you find the perfect gift! What are you looking for?",
      context,
      shouldShowProducts: false,
      contextualLinks: [],
      shouldGenerateSearch: false
    };
  }
}

function generateEnhancedContextualResponse(message: string, context: NicoleContext): string {
  const lowerMessage = message.toLowerCase();
  
  // Enhanced brand detection
  if (context.detectedBrands && context.detectedBrands.length > 0) {
    if (!context.interests && !context.budget) {
      return `I see you're interested in ${context.detectedBrands.join(', ')}! That's a great choice. To help me find the perfect ${context.detectedBrands[0]} gift, what are ${context.recipient || 'they'} interested in? Any hobbies or activities they love?`;
    }
  }
  
  // Age-aware responses
  if (context.ageGroup && !context.interests && !context.askedForInterests) {
    return `Great! Shopping for a ${context.ageGroup} is exciting. What are they interested in? Any specific hobbies, activities, or things they've mentioned wanting recently?`;
  }
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return "Hi! I'm Nicole, your AI gift advisor. I'm here to help you find the perfect gift. Who are you shopping for today?";
  }
  
  // Progressive information gathering with tracking to prevent duplicate questions
  if (context.recipient && !context.occasion && !context.askedForOccasion) {
    return `Great! You're shopping for your ${context.recipient}. What's the special occasion?`;
  }
  
  if (context.recipient && context.occasion && !context.interests && !context.detectedBrands && !context.askedForInterests) {
    return `Perfect! A gift for your ${context.recipient}'s ${context.occasion}. To find something they'll absolutely love, what are they interested in? Any hobbies, favorite activities, or things they've been wanting?`;
  }
  
  if (context.recipient && context.occasion && (context.interests || context.detectedBrands) && !context.budget && !context.askedForBudget) {
    const interestText = context.interests ? `their interests in ${context.interests.join(', ')}` : `their love for ${context.detectedBrands?.join(', ')}`;
    return `Excellent! I love that you know about ${interestText}. What's your budget range for this ${context.occasion} gift?`;
  }
  
  // Only proceed to suggestions when we have comprehensive information
  if (context.recipient && context.occasion && (context.interests || context.detectedBrands) && context.budget) {
    const detailsText = context.interests ? 
      `their interests in ${context.interests.join(', ')}` : 
      `their preference for ${context.detectedBrands?.join(', ')}`;
    return `Perfect! I have everything I need now. Let me find some amazing ${context.occasion} gift options for your ${context.recipient} based on ${detailsText} within your $${context.budget[0]}-$${context.budget[1]} budget.`;
  }
  
  // If we've already asked for something but haven't gotten a clear answer, be more specific
  if (context.askedForOccasion && !context.occasion) {
    return "I'd love to help you find the perfect gift! Could you tell me what the occasion is? For example, is it a birthday, holiday, anniversary, or something else?";
  }
  
  if (context.askedForInterests && !context.interests) {
    return "To find the best gift, I'd like to know more about what they enjoy. What are some of their hobbies or favorite activities?";
  }
  
  if (context.askedForBudget && !context.budget) {
    return "What budget range are you thinking for this gift? This will help me suggest options that work for you.";
  }
  
  return "Tell me more about what you're looking for! Who is this gift for and what's the occasion?";
}

function determineEnhancedPhase(context: NicoleContext): ConversationPhase {
  if (!context.recipient && !context.relationship) return 'greeting';
  if ((context.recipient || context.relationship) && !context.occasion) return 'gathering_info';
  if (context.recipient && context.occasion && (!context.interests && !context.detectedBrands)) return 'clarifying_needs';
  if (context.recipient && context.occasion && (context.interests || context.detectedBrands) && !context.budget) return 'clarifying_needs';
  return 'providing_suggestions';
}

function shouldShowProducts(context: NicoleContext): boolean {
  // Only show products when we have comprehensive information
  return Boolean(
    context.recipient && 
    context.occasion && 
    (context.interests || context.detectedBrands) && 
    context.budget
  );
}

function shouldGenerateSearch(context: NicoleContext): boolean {
  // Only generate search when we have all necessary information
  return Boolean(
    context.recipient && 
    context.occasion && 
    (context.interests || context.detectedBrands) && 
    context.budget
  );
}

export function generateSearchQuery(context: NicoleContext): string {
  const parts: string[] = [];
  
  // Brand-first approach (preserving Enhanced Zinc API System logic)
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
