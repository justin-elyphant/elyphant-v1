
import { supabase } from "@/integrations/supabase/client";

export type ConversationPhase = 'greeting' | 'gathering_info' | 'clarifying_needs' | 'ready_to_search' | 'providing_suggestions';

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
  awaitingConfirmation?: boolean;
  hasReceivedSuggestions?: boolean;
  shouldNavigateToMarketplace?: boolean;
}

export interface NicoleResponse {
  response: string;
  context: NicoleContext;
  suggestedQueries?: string[];
  shouldShowProducts?: boolean;
  contextualLinks?: ContextualLink[];
  shoul


generateSearch?: boolean;
}

export async function chatWithNicole(
  message: string,
  conversationHistory: NicoleMessage[],
  context: NicoleContext = {}
): Promise<NicoleResponse & { showSearchButton?: boolean }> {
  try {
    console.log('🤖 Nicole: Enhanced Zinc API GPT request with smart CTA system:', {
      message: message.substring(0, 100) + '...',
      contextSummary: {
        recipient: context.recipient,
        occasion: context.occasion,
        interests: context.interests,
        budget: context.budget,
        conversationPhase: context.conversationPhase
      }
    });
    
    // Enhanced context extraction with smart relationship detection (preserve Enhanced Zinc API)
    const enhancedContext = extractEnhancedContextFromMessage(message, context);
    
    // Call the enhanced nicole-chat edge function with improved CTA logic
    const { data, error } = await supabase.functions.invoke('nicole-chat', {
      body: {
        message,
        conversationHistory,
        context: enhancedContext
      }
    });

    if (error) {
      console.error('❌ Nicole: Edge function error:', error);
      throw error;
    }

    console.log('✅ Nicole: Enhanced Zinc API GPT response received:', {
      hasResponse: Boolean(data?.response),
      hasContext: Boolean(data?.context),
      showSearchButton: data?.showSearchButton,
      contextUpdate: data?.context ? {
        recipient: data.context.recipient,
        occasion: data.context.occasion,
        interests: data.context.interests,
        conversationPhase: data.context.conversationPhase
      } : null
    });

    // Merge contexts with Enhanced Zinc API preservation
    const mergedContext = {
      ...enhancedContext,
      ...(data.context || {}),
      // Preserve Enhanced Zinc fields
      detectedBrands: data.context?.detectedBrands || enhancedContext.detectedBrands || context.detectedBrands,
      ageGroup: data.context?.ageGroup || enhancedContext.ageGroup || context.ageGroup,
      exactAge: data.context?.exactAge || enhancedContext.exactAge || context.exactAge,
      // Fix budget array properly
      budget: validateBudgetArray(data.context?.budget || enhancedContext.budget || context.budget),
      // Merge interests arrays
      interests: [
        ...new Set([
          ...(context.interests || []),
          ...(enhancedContext.interests || []),
          ...(data.context?.interests || [])
        ])
      ]
    };

    console.log('🎯 Nicole: Final context merge completed:', {
      hasRecipient: Boolean(mergedContext.recipient),
      hasOccasion: Boolean(mergedContext.occasion),
      hasInterests: Boolean(mergedContext.interests?.length),
      hasBudget: Boolean(mergedContext.budget),
      conversationPhase: mergedContext.conversationPhase,
      showSearchButton: data.showSearchButton
    });

    return {
      response: data.response || "I'm here to help you find the perfect gift! What are you looking for?",
      context: mergedContext,
      shouldShowProducts: shouldShowProducts(mergedContext),
      contextualLinks: data.contextualLinks || [],
      shouldGenerateSearch: false, // CTA button handles this now
      showSearchButton: data.showSearchButton || false
    };
    
  } catch (error) {
    console.error('❌ Error in Enhanced Zinc API Nicole chat with smart CTA:', error);
    
    // Enhanced fallback with context extraction
    const enhancedContext = extractEnhancedContextFromMessage(message, context);
    
    return {
      response: "I'm having trouble connecting right now, but I'm here to help you find the perfect gift! What are you looking for?",
      context: enhancedContext,
      shouldShowProducts: false,
      contextualLinks: [],
      shouldGenerateSearch: false,
      showSearchButton: false
    };
  }
}

function extractEnhancedContextFromMessage(userMessage: string, currentContext: NicoleContext): NicoleContext {
  const lowerMessage = userMessage.toLowerCase();
  let updatedContext = { ...currentContext };

  // Enhanced relationship detection with smart mapping
  const relationshipPatterns = [
    { pattern: /\bmy son\b/i, recipient: 'son', relationship: 'child' },
    { pattern: /\bmy daughter\b/i, recipient: 'daughter', relationship: 'child' },
    { pattern: /\bmy mom\b|\bmy mother\b/i, recipient: 'mom', relationship: 'parent' },
    { pattern: /\bmy dad\b|\bmy father\b/i, recipient: 'dad', relationship: 'parent' },
    { pattern: /\bmy friend\b/i, recipient: 'friend', relationship: 'friend' },
    { pattern: /\bmy wife\b/i, recipient: 'wife', relationship: 'spouse' },
    { pattern: /\bmy husband\b/i, recipient: 'husband', relationship: 'spouse' },
    { pattern: /\bmy brother\b/i, recipient: 'brother', relationship: 'sibling' },
    { pattern: /\bmy sister\b/i, recipient: 'sister', relationship: 'sibling' },
    { pattern: /\bmy girlfriend\b/i, recipient: 'girlfriend', relationship: 'partner' },
    { pattern: /\bmy boyfriend\b/i, recipient: 'boyfriend', relationship: 'partner' }
  ];

  // Check for relationship patterns
  for (const { pattern, recipient, relationship } of relationshipPatterns) {
    if (pattern.test(userMessage)) {
      updatedContext.recipient = recipient;
      updatedContext.relationship = relationship;
      console.log(`🎯 Smart relationship detected: ${recipient} (${relationship}) from: "${userMessage}"`);
      break;
    }
  }

  // Enhanced occasion detection with age patterns
  const occasionPatterns = [
    { pattern: /birthday|turning \d+|he's turning|she's turning|\d+th birthday|\d+st birthday|\d+nd birthday|\d+rd birthday/i, occasion: 'birthday' },
    { pattern: /christmas|holiday|holidays/i, occasion: 'christmas' },
    { pattern: /anniversary|anniversaries/i, occasion: 'anniversary' },
    { pattern: /graduation|graduating/i, occasion: 'graduation' },
    { pattern: /wedding|marriage/i, occasion: 'wedding' },
    { pattern: /valentine|valentine's/i, occasion: 'valentine\'s day' },
    { pattern: /mother's day|mothers day/i, occasion: 'mother\'s day' },
    { pattern: /father's day|fathers day/i, occasion: 'father\'s day' },
    { pattern: /housewarming|house warming/i, occasion: 'housewarming' }
  ];

  for (const { pattern, occasion } of occasionPatterns) {
    if (pattern.test(userMessage)) {
      updatedContext.occasion = occasion;
      updatedContext.askedForOccasion = true;
      console.log(`🎉 Occasion detected: ${occasion} from: "${userMessage}"`);
      break;
    }
  }

  // Enhanced age detection for birthday context
  const agePatterns = [
    /turning (\d+)/i,
    /he's turning (\d+)/i,
    /she's turning (\d+)/i,
    /(\d+)th birthday/i,
    /(\d+)st birthday/i,  
    /(\d+)nd birthday/i,
    /(\d+)rd birthday/i
  ];

  for (const pattern of agePatterns) {
    const match = userMessage.match(pattern);
    if (match) {
      const age = parseInt(match[1]);
      if (!isNaN(age) && age > 0 && age < 120) {
        updatedContext.exactAge = age;
        if (!updatedContext.occasion) {
          updatedContext.occasion = 'birthday';
          updatedContext.askedForOccasion = true;
        }
        console.log(`🎂 Age detected: ${age} from: "${userMessage}"`);
        break;
      }
    }
  }

  // Enhanced budget extraction with proper validation
  const budgetPatterns = [
    /no more than \$(\d+)/i,
    /under \$(\d+)/i,
    /up to \$(\d+)/i,
    /around \$(\d+)/i,
    /about \$(\d+)/i,
    /\$(\d+)(?:\s*-\s*\$?(\d+))?/g,
    /between\s+\$?(\d+)\s+and\s+\$?(\d+)/i,
    /budget.*?\$(\d+)/i
  ];

  for (const pattern of budgetPatterns) {
    const match = userMessage.match(pattern);
    if (match) {
      const num1 = parseInt(match[1]);
      const num2 = match[2] ? parseInt(match[2]) : null;
      
      if (!isNaN(num1) && num1 > 0) {
        if (num2 && !isNaN(num2) && num2 > 0) {
          updatedContext.budget = [Math.min(num1, num2), Math.max(num1, num2)];
        } else if (lowerMessage.includes('no more than') || lowerMessage.includes('under') || lowerMessage.includes('up to')) {
          updatedContext.budget = [Math.max(10, Math.floor(num1 * 0.5)), num1];
        } else {
          updatedContext.budget = [Math.floor(num1 * 0.8), Math.ceil(num1 * 1.2)];
        }
        updatedContext.askedForBudget = true;
        console.log('💰 Enhanced budget detected:', updatedContext.budget);
      }
      break;
    }
  }

  // Enhanced brand detection
  const brandPatterns = [
    /\b(nike|adidas|lululemon|apple|samsung|sony|microsoft|google)\b/gi
  ];

  for (const pattern of brandPatterns) {
    const matches = userMessage.match(pattern);
    if (matches) {
      updatedContext.detectedBrands = [...new Set([
        ...(updatedContext.detectedBrands || []),
        ...matches.map(brand => brand.toLowerCase())
      ])];
    }
  }

  // Enhanced interest detection
  const interestPatterns = [
    /(?:likes?|loves?|enjoys?|interested in|into)\s+([^,.!?]+)/gi,
    /(dallas cowboys|golf|cooking|bbq|barbecue|yoga|fitness|gaming|reading|music|art|sports|travel|photography)/gi
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

function detectEnhancedConfirmation(message: string): boolean {
  const lowerMessage = message.toLowerCase().trim();
  const confirmationPhrases = [
    'yes', 'yeah', 'yep', 'yup',
    'sounds good', 'sounds great', 'sounds perfect', 'sounds good to me',
    'that\'s right', 'that\'s correct', 'that\'s perfect', 'that sounds right',
    'perfect', 'great', 'awesome', 'excellent',
    'looks good', 'looks great', 'looks perfect',
    'let\'s do it', 'let\'s go', 'go ahead', 'find them',
    'okay', 'ok', 'sure', 'absolutely',
    'that works', 'works for me', 'sounds like a plan'
  ];

  const isConfirming = confirmationPhrases.some(phrase => 
    lowerMessage === phrase || 
    lowerMessage.startsWith(phrase + ' ') ||
    lowerMessage.includes(' ' + phrase + ' ') ||
    lowerMessage.endsWith(' ' + phrase)
  );

  console.log('✅ Enhanced confirmation detection:', { 
    message: lowerMessage, 
    isConfirming,
    matchedPhrases: confirmationPhrases.filter(phrase => 
      lowerMessage === phrase || 
      lowerMessage.startsWith(phrase + ' ') ||
      lowerMessage.includes(' ' + phrase + ' ') ||
      lowerMessage.endsWith(' ' + phrase)
    )
  });

  return isConfirming;
}

function validateBudgetArray(budget: any): [number, number] | undefined {
  if (!budget || !Array.isArray(budget) || budget.length !== 2) {
    return undefined;
  }
  
  const [min, max] = budget;
  const numMin = typeof min === 'number' ? min : parseFloat(min);
  const numMax = typeof max === 'number' ? max : parseFloat(max);
  
  if (isNaN(numMin) || isNaN(numMax) || numMin <= 0 || numMax <= 0) {
    return undefined;
  }
  
  return [numMin, numMax];
}

function shouldShowProducts(context: NicoleContext): boolean {
  return Boolean(
    context.recipient && 
    context.occasion && 
    (context.interests || context.detectedBrands) && 
    context.budget
  );
}

export function generateSearchQuery(context: NicoleContext): string {
  const parts: string[] = [];
  
  // Brand-first approach (Enhanced Zinc API System)
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
  
  // Fix budget formatting to avoid NaN
  if (context.budget && Array.isArray(context.budget) && context.budget.length === 2) {
    const [min, max] = context.budget;
    if (!isNaN(max) && max > 0) {
      parts.push(`under $${max}`);
    }
  }
  
  return parts.join(' ') || 'gifts';
}
