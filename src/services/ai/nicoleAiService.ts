
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

export async function chatWithNicole(
  message: string,
  conversationHistory: NicoleMessage[],
  context: NicoleContext = {}
): Promise<NicoleResponse> {
  try {
    console.log('Nicole: Calling GPT-powered edge function with context:', context);
    
    // Call the existing nicole-chat edge function
    const { data, error } = await supabase.functions.invoke('nicole-chat', {
      body: {
        message,
        conversationHistory,
        context
      }
    });

    if (error) {
      console.error('Nicole: Edge function error:', error);
      throw error;
    }

    console.log('Nicole: GPT response received:', data);

    // Extract enhanced context from the message if GPT didn't process it
    const enhancedContext = extractContextFromMessage(message, context);
    
    // Merge the context from GPT response with our enhanced context detection
    const finalContext = {
      ...enhancedContext,
      ...context,
      // Preserve any context updates from the GPT response
      conversationPhase: determinePhase(enhancedContext),
    };

    return {
      response: data.response || "I'm here to help you find the perfect gift! What are you looking for?",
      context: finalContext,
      shouldShowProducts: shouldShowProducts(finalContext),
      contextualLinks: data.contextualLinks || [],
      shouldGenerateSearch: data.shouldGenerateSearch || shouldGenerateSearch(finalContext)
    };
    
  } catch (error) {
    console.error('Error in Nicole GPT chat:', error);
    
    // Fallback response with context extraction
    const enhancedContext = extractContextFromMessage(message, context);
    
    return {
      response: "I'm having trouble connecting right now, but I'm here to help you find the perfect gift! What are you looking for?",
      context: enhancedContext,
      shouldShowProducts: false,
      contextualLinks: [],
      shouldGenerateSearch: false
    };
  }
}

function extractContextFromMessage(userMessage: string, currentContext: NicoleContext): NicoleContext {
  const lowerMessage = userMessage.toLowerCase();
  let updatedContext = { ...currentContext };

  // Enhanced occasion detection with more comprehensive patterns
  const occasionPatterns = [
    { pattern: /birthday/i, occasion: 'birthday' },
    { pattern: /christmas|holiday|holidays/i, occasion: 'christmas' },
    { pattern: /anniversary|anniversaries/i, occasion: 'anniversary' },
    { pattern: /graduation|graduating/i, occasion: 'graduation' },
    { pattern: /wedding|marriage/i, occasion: 'wedding' },
    { pattern: /valentine|valentine's/i, occasion: 'valentine\'s day' },
    { pattern: /mother's day|mothers day/i, occasion: 'mother\'s day' },
    { pattern: /father's day|fathers day/i, occasion: 'father\'s day' },
    { pattern: /housewarming|house warming/i, occasion: 'housewarming' },
    { pattern: /retirement|retiring/i, occasion: 'retirement' },
    { pattern: /promotion|new job/i, occasion: 'promotion' },
    { pattern: /baby shower|baby|newborn/i, occasion: 'baby shower' },
    { pattern: /thanksgiving/i, occasion: 'thanksgiving' },
    { pattern: /easter/i, occasion: 'easter' }
  ];

  // Check for occasion patterns
  for (const { pattern, occasion } of occasionPatterns) {
    if (pattern.test(userMessage)) {
      updatedContext.occasion = occasion;
      updatedContext.askedForOccasion = true;
      console.log(`Detected occasion: ${occasion} from message: "${userMessage}"`);
      break;
    }
  }

  // Extract budget information with various patterns
  const budgetPatterns = [
    /\$(\d+)(?:\s*-\s*\$?(\d+))?/g,
    /between\s+\$?(\d+)\s+and\s+\$?(\d+)/i,
    /around\s+\$(\d+)/i,
    /under\s+\$(\d+)/i,
    /budget.*?\$(\d+)/i
  ];

  for (const pattern of budgetPatterns) {
    const match = userMessage.match(pattern);
    if (match) {
      const num1 = parseInt(match[1]);
      const num2 = match[2] ? parseInt(match[2]) : null;
      
      if (num2) {
        updatedContext.budget = [Math.min(num1, num2), Math.max(num1, num2)];
      } else if (lowerMessage.includes('under')) {
        updatedContext.budget = [Math.max(10, num1 * 0.5), num1];
      } else {
        updatedContext.budget = [num1 * 0.8, num1 * 1.2];
      }
      updatedContext.askedForBudget = true;
      break;
    }
  }

  // Enhanced interest detection
  const interestPatterns = [
    /(?:likes?|loves?|enjoys?|interested in|into)\s+([^,.!?]+)/gi,
    /(?:hobby|hobbies).*?([^,.!?]+)/gi,
    /(reading|gaming|cooking|sports|music|art|fitness|travel|photography|gardening|tech|technology)/gi
  ];

  for (const pattern of interestPatterns) {
    let match;
    while ((match = pattern.exec(userMessage)) !== null) {
      const interest = match[1].trim().toLowerCase();
      if (interest && interest.length > 2) {
        updatedContext.interests = [...new Set([...(updatedContext.interests || []), interest])];
        updatedContext.askedForInterests = true;
      }
    }
  }

  return updatedContext;
}

function determinePhase(context: NicoleContext): ConversationPhase {
  if (!context.recipient && !context.relationship) return 'greeting';
  if ((context.recipient || context.relationship) && !context.occasion) return 'gathering_info';
  if (context.recipient && context.occasion && (!context.interests && !context.detectedBrands)) return 'clarifying_needs';
  if (context.recipient && context.occasion && (context.interests || context.detectedBrands) && !context.budget) return 'clarifying_needs';
  return 'providing_suggestions';
}

function shouldShowProducts(context: NicoleContext): boolean {
  return Boolean(
    context.recipient && 
    context.occasion && 
    (context.interests || context.detectedBrands) && 
    context.budget
  );
}

function shouldGenerateSearch(context: NicoleContext): boolean {
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
