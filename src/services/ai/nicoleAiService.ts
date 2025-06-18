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
    
    // Enhanced system prompt with confirmation phase
    const enhancedContext = {
      ...context,
      systemInstructions: `You are Nicole, an AI gift advisor. Follow these conversation phases:
      
      1. GREETING: Welcome and ask what they're looking for
      2. GATHERING_INFO: Collect recipient, relationship, occasion
      3. CLARIFYING_NEEDS: Get interests, budget, age details
      4. READY_TO_SEARCH: When you have enough info (recipient/relationship + occasion + interests/brands + budget), SUMMARIZE what you understood and ask for confirmation before searching. Say something like "Let me make sure I have this right: you're looking for [summary]. Does that sound good, or would you like to adjust anything?"
      5. PROVIDING_SUGGESTIONS: Only after user confirms, proceed with search
      
      NEVER automatically search without confirmation. Always ask "Does that sound right?" or "Are you ready to see your gifts?" when you have enough context.
      
      Enhanced features:
      - Detect brands mentioned by user (Nike, Apple, Lululemon, etc.)
      - Identify age groups (teens, young adults, adults, seniors)
      - Parse budget amounts carefully to avoid NaN values
      - Preserve all detected context throughout conversation`
    };
    
    // Call the existing nicole-chat edge function
    const { data, error } = await supabase.functions.invoke('nicole-chat', {
      body: {
        message,
        conversationHistory,
        context: enhancedContext
      }
    });

    if (error) {
      console.error('Nicole: Edge function error:', error);
      throw error;
    }

    console.log('Nicole: GPT response received:', data);

    // Extract enhanced context from the message if GPT didn't process it
    const enhancedContextFromMessage = extractContextFromMessage(message, context);
    
    // Properly merge contexts - GPT context takes precedence, but preserve enhanced fields
    const mergedContext = {
      ...enhancedContextFromMessage,
      ...context,
      // Preserve GPT updates while keeping enhanced fields
      ...(data.context || {}),
      // Ensure enhanced fields are preserved
      detectedBrands: data.context?.detectedBrands || enhancedContextFromMessage.detectedBrands || context.detectedBrands,
      ageGroup: data.context?.ageGroup || enhancedContextFromMessage.ageGroup || context.ageGroup,
      exactAge: data.context?.exactAge || enhancedContextFromMessage.exactAge || context.exactAge,
      // Merge interests arrays properly
      interests: [
        ...new Set([
          ...(context.interests || []),
          ...(enhancedContextFromMessage.interests || []),
          ...(data.context?.interests || [])
        ])
      ]
    };

    // Update conversation phase based on merged context and check for confirmation
    const updatedPhase = determinePhase(mergedContext, message);
    mergedContext.conversationPhase = updatedPhase;

    // Check if user is confirming search (only in ready_to_search phase)
    const isConfirming = updatedPhase === 'ready_to_search' && detectConfirmation(message);
    
    // Determine if we should generate search
    const shouldGenerateSearch = isConfirming || (
      data.shouldGenerateSearch && 
      updatedPhase === 'providing_suggestions'
    );

    console.log('Nicole: Phase:', updatedPhase, 'Should generate search:', shouldGenerateSearch, 'Is confirming:', isConfirming);

    return {
      response: data.response || "I'm here to help you find the perfect gift! What are you looking for?",
      context: mergedContext,
      shouldShowProducts: shouldShowProducts(mergedContext),
      contextualLinks: data.contextualLinks || [],
      shouldGenerateSearch
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

  // Enhanced budget extraction with better number parsing
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
      
      // Ensure we have valid numbers
      if (!isNaN(num1)) {
        if (num2 && !isNaN(num2)) {
          updatedContext.budget = [Math.min(num1, num2), Math.max(num1, num2)];
        } else if (lowerMessage.includes('under')) {
          updatedContext.budget = [Math.max(10, Math.floor(num1 * 0.5)), num1];
        } else {
          updatedContext.budget = [Math.floor(num1 * 0.8), Math.ceil(num1 * 1.2)];
        }
        updatedContext.askedForBudget = true;
        console.log('Detected budget:', updatedContext.budget);
      }
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

function determinePhase(context: NicoleContext, userMessage: string): ConversationPhase {
  // Check if user is confirming in ready_to_search phase
  if (context.conversationPhase === 'ready_to_search' && detectConfirmation(userMessage)) {
    return 'providing_suggestions';
  }
  
  if (!context.recipient && !context.relationship) return 'greeting';
  if ((context.recipient || context.relationship) && !context.occasion) return 'gathering_info';
  if (context.recipient && context.occasion && (!context.interests && !context.detectedBrands)) return 'clarifying_needs';
  if (context.recipient && context.occasion && (context.interests || context.detectedBrands) && !context.budget) return 'clarifying_needs';
  
  // Move to ready_to_search when we have enough context but haven't confirmed yet
  const hasEnoughContext = Boolean(
    (context.recipient || context.relationship) && 
    context.occasion && 
    (context.interests || context.detectedBrands) && 
    context.budget
  );
  
  if (hasEnoughContext && !context.awaitingConfirmation) {
    return 'ready_to_search';
  }
  
  return context.conversationPhase || 'greeting';
}

function detectConfirmation(message: string): boolean {
  const confirmationPatterns = [
    /^(yes|yeah|yep|sure|sounds good|perfect|that's right|correct|looks good)/i,
    /sounds (good|great|perfect|right)/i,
    /that's (right|correct|perfect|good)/i,
    /^(ok|okay)\s*[!.]?$/i,
    /let's go|let's do it|ready/i
  ];
  
  return confirmationPatterns.some(pattern => pattern.test(message.trim()));
}

function shouldShowProducts(context: NicoleContext): boolean {
  return Boolean(
    context.recipient && 
    context.occasion && 
    (context.interests || context.detectedBrands) && 
    context.budget
  );
}

function shouldGenerateSearchBasedOnContext(context: NicoleContext): boolean {
  // Enhanced logic for determining when to trigger search
  const hasBasicInfo = Boolean(context.recipient || context.relationship);
  const hasOccasion = Boolean(context.occasion);
  const hasPreferences = Boolean(
    (context.interests && context.interests.length > 0) || 
    (context.detectedBrands && context.detectedBrands.length > 0)
  );
  const hasBudget = Boolean(context.budget);
  
  // Trigger search when we have enough context (at least 3 of 4 key pieces)
  let contextScore = 0;
  if (hasBasicInfo) contextScore++;
  if (hasOccasion) contextScore++;
  if (hasPreferences) contextScore++;
  if (hasBudget) contextScore++;
  
  console.log('Context completeness score:', contextScore, {
    hasBasicInfo,
    hasOccasion,
    hasPreferences,
    hasBudget
  });
  
  return contextScore >= 3; // Trigger when we have at least 3/4 context pieces
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
  
  if (context.budget && Array.isArray(context.budget) && context.budget.length === 2) {
    const [min, max] = context.budget;
    if (!isNaN(max) && max > 0) {
      parts.push(`under $${max}`);
    }
  }
  
  return parts.join(' ') || 'gifts';
}

function generateContextSummary(context: NicoleContext): string {
  const parts: string[] = [];
  
  if (context.detectedBrands && context.detectedBrands.length > 0) {
    parts.push(context.detectedBrands[0]);
  }
  
  if (context.interests && context.interests.length > 0) {
    parts.push(context.interests.join(' and '));
  }
  
  if (context.recipient) {
    parts.push(`for your ${context.recipient}`);
  } else if (context.relationship) {
    parts.push(`for your ${context.relationship}`);
  }
  
  if (context.occasion) {
    parts.push(`for ${context.occasion}`);
  }
  
  if (context.budget && Array.isArray(context.budget) && context.budget.length === 2) {
    const [min, max] = context.budget;
    if (!isNaN(max) && max > 0) {
      parts.push(`under $${max}`);
    }
  }
  
  return parts.join(' ');
}
