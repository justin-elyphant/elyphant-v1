
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
  shouldGenerateSearch?: boolean;
}

export async function chatWithNicole(
  message: string,
  conversationHistory: NicoleMessage[],
  context: NicoleContext = {}
): Promise<NicoleResponse> {
  try {
    console.log('Nicole: Calling GPT-powered edge function with enhanced context:', context);
    
    // Enhanced context extraction with smart relationship detection
    const enhancedContext = extractEnhancedContextFromMessage(message, context);
    
    // Enhanced system prompt with improved relationship detection
    const systemInstructions = `You are Nicole, an AI gift advisor with smart relationship detection. Follow these phases:
      
      1. GREETING: Welcome and ask what they're looking for
      2. GATHERING_INFO: Smart relationship detection - if they say "my son", automatically know recipient="son" and relationship="child"
      3. CLARIFYING_NEEDS: Get interests, budget, age details  
      4. READY_TO_SEARCH: Summarize everything and ask for confirmation
      5. PROVIDING_SUGGESTIONS: Only after confirmation, proceed with search
      
      SMART RELATIONSHIP DETECTION:
      - "my son/daughter" → don't ask relationship, it's obvious
      - "my mom/dad" → parent relationship is clear
      - "my friend" → friendship is obvious
      - Skip redundant relationship questions when context is clear
      
      CONFIRMATION REQUIRED:
      - Always summarize context before searching
      - Ask "Does that sound right?" before proceeding
      - Wait for explicit confirmation
      
      Enhanced Zinc API integration maintained with proper budget handling.`;
    
    // Call the enhanced nicole-chat edge function
    const { data, error } = await supabase.functions.invoke('nicole-chat', {
      body: {
        message,
        conversationHistory,
        context: {
          ...enhancedContext,
          systemInstructions
        }
      }
    });

    if (error) {
      console.error('Nicole: Edge function error:', error);
      throw error;
    }

    console.log('Nicole: Enhanced GPT response received:', data);

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

    // Update conversation phase with improved logic
    const updatedPhase = determineEnhancedPhase(mergedContext, message);
    mergedContext.conversationPhase = updatedPhase;

    // Check for confirmation in ready_to_search phase
    const isConfirming = updatedPhase === 'ready_to_search' && detectConfirmation(message);
    
    // Only generate search after explicit confirmation
    const shouldGenerateSearch = isConfirming || data.shouldGenerateSearch;
    
    // Set navigation flag when search is ready
    if (shouldGenerateSearch) {
      mergedContext.shouldNavigateToMarketplace = true;
    }

    console.log('Nicole: Enhanced phase:', updatedPhase, 'Should generate search:', shouldGenerateSearch);

    return {
      response: data.response || "I'm here to help you find the perfect gift! What are you looking for?",
      context: mergedContext,
      shouldShowProducts: shouldShowProducts(mergedContext),
      contextualLinks: data.contextualLinks || [],
      shouldGenerateSearch
    };
    
  } catch (error) {
    console.error('Error in Nicole enhanced chat:', error);
    
    // Fallback with context extraction
    const enhancedContext = extractEnhancedContextFromMessage(message, context);
    
    return {
      response: "I'm having trouble connecting right now, but I'm here to help you find the perfect gift! What are you looking for?",
      context: enhancedContext,
      shouldShowProducts: false,
      contextualLinks: [],
      shouldGenerateSearch: false
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
      console.log(`Smart relationship detected: ${recipient} (${relationship}) from: "${userMessage}"`);
      break;
    }
  }

  // Enhanced occasion detection
  const occasionPatterns = [
    { pattern: /birthday/i, occasion: 'birthday' },
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
      break;
    }
  }

  // Enhanced budget extraction with proper validation
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
      
      if (!isNaN(num1) && num1 > 0) {
        if (num2 && !isNaN(num2) && num2 > 0) {
          updatedContext.budget = [Math.min(num1, num2), Math.max(num1, num2)];
        } else if (lowerMessage.includes('under')) {
          updatedContext.budget = [Math.max(10, Math.floor(num1 * 0.5)), num1];
        } else {
          updatedContext.budget = [Math.floor(num1 * 0.8), Math.ceil(num1 * 1.2)];
        }
        updatedContext.askedForBudget = true;
        console.log('Enhanced budget detected:', updatedContext.budget);
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
    /(yoga|fitness|gaming|reading|cooking|music|art|sports|travel|photography)/gi
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

function determineEnhancedPhase(context: NicoleContext, userMessage: string): ConversationPhase {
  // Check for confirmation in ready_to_search phase
  if (context.conversationPhase === 'ready_to_search' && detectConfirmation(userMessage)) {
    return 'providing_suggestions';
  }
  
  // Smart phase detection based on context completeness
  const hasRecipient = Boolean(context.recipient || context.relationship);
  const hasOccasion = Boolean(context.occasion);
  const hasPreferences = Boolean(
    (context.interests && context.interests.length > 0) || 
    (context.detectedBrands && context.detectedBrands.length > 0)
  );
  const hasBudget = Boolean(context.budget);
  
  if (!hasRecipient) return 'greeting';
  if (hasRecipient && !hasOccasion) return 'gathering_info';
  if (hasRecipient && hasOccasion && !hasPreferences) return 'clarifying_needs';
  if (hasRecipient && hasOccasion && hasPreferences && !hasBudget) return 'clarifying_needs';
  
  // Move to ready_to_search when we have enough context
  if (hasRecipient && hasOccasion && hasPreferences && hasBudget) {
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
    /let's go|let's do it|ready/i,
    /show me|see the gifts|find them/i
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
