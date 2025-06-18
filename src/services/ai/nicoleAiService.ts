
import { supabase } from "@/integrations/supabase/client";

export interface NicoleMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type ConversationPhase =
  | 'greeting'
  | 'gathering_info'
  | 'ready_to_search'
  | 'presenting_results'
  | 'closing'
  | 'error_recovery'
  | 'providing_suggestions'
  | 'clarifying_needs';

export interface NicoleContext {
  recipient?: string;
  relationship?: string;
  occasion?: string;
  interests?: string[];
  budget?: [number, number];
  exactAge?: number;
  conversationPhase?: ConversationPhase;
  detectedBrands?: string[];
  ageGroup?: string;
}

export interface NicoleResponse {
  message: string;
  context: NicoleContext;
  generateSearch: boolean;
}

export interface ContextualLink {
  label: string;
  text: string;
  url: string;
  type: string;
}

/**
 * Generate a search query based on the conversation context
 */
export function generateSearchQuery(context: NicoleContext): string {
  const {
    recipient,
    relationship,
    occasion,
    interests = [],
    detectedBrands = [],
    budget,
    exactAge,
    ageGroup
  } = context;
  
  // Brand-first approach for better results
  if (detectedBrands.length > 0) {
    let query = detectedBrands[0]; // Primary brand
    
    // Add age-appropriate terms
    if (ageGroup) {
      query += ` for ${ageGroup}`;
    } else if (exactAge) {
      const ageTerms = getAgeAppropriateTerms(exactAge);
      query += ` for ${ageTerms}`;
    }
    
    // Add primary interest
    if (interests.length > 0) {
      query += ` ${interests[0]}`;
    }
    
    // Add occasion context
    if (occasion) {
      query += ` ${occasion}`;
    }
    
    return query.trim();
  }
  
  // Interest-first approach
  if (interests.length > 0) {
    let query = interests[0]; // Primary interest
    
    // Add secondary interest if available
    if (interests.length > 1) {
      query += ` ${interests[1]}`;
    }
    
    // Add demographic context
    if (ageGroup) {
      query += ` for ${ageGroup}`;
    } else if (exactAge) {
      const ageTerms = getAgeAppropriateTerms(exactAge);
      query += ` for ${ageTerms}`;
    } else if (recipient) {
      query += ` for ${recipient}`;
    } else if (relationship) {
      query += ` for ${relationship}`;
    }
    
    // Add occasion
    if (occasion) {
      query += ` ${occasion}`;
    }
    
    // Add budget constraint
    if (budget) {
      const [, max] = budget;
      query += ` under $${max}`;
    }
    
    return query.trim();
  }
  
  // Demographic-first approach
  let query = "gifts";
  
  // Add recipient context
  if (ageGroup) {
    query += ` for ${ageGroup}`;
  } else if (exactAge) {
    const ageTerms = getAgeAppropriateTerms(exactAge);
    query += ` for ${ageTerms}`;
  } else if (recipient) {
    query += ` for ${recipient}`;
  } else if (relationship) {
    query += ` for ${relationship}`;
  }
  
  // Add occasion
  if (occasion) {
    query += ` ${occasion}`;
  }
  
  // Add budget constraint
  if (budget) {
    const [, max] = budget;
    query += ` under $${max}`;
  }
  
  return query.trim();
}

/**
 * Get age-appropriate search terms
 */
function getAgeAppropriateTerms(age: number): string {
  if (age <= 5) return "toddlers";
  if (age <= 12) return "kids";
  if (age <= 17) return "teens";
  if (age <= 25) return "young adults";
  if (age <= 40) return "adults";
  if (age <= 60) return "middle aged";
  return "seniors";
}

/**
 * Simulates a chat with Nicole, the AI gift advisor.
 * @param message The user's message.
 * @param context The current context of the conversation.
 * @param conversationHistory The history of the conversation.
 * @returns A promise that resolves with Nicole's response.
 */
export async function chatWithNicole(
  message: string,
  context: NicoleContext,
  conversationHistory: NicoleMessage[] = []
): Promise<NicoleResponse & { showSearchButton?: boolean }> {
  console.log('🤖 Nicole AI Service - Processing message:', message);
  console.log('📊 Current context:', context);

  try {
    // Enhanced context analysis for better CTA decisions
    const contextAnalysis = analyzeContext(context, message);
    console.log('🔍 Context Analysis:', contextAnalysis);

    const { data, error } = await supabase.functions.invoke('nicole-chat', {
      body: {
        message,
        context: {
          ...context,
          conversationPhase: contextAnalysis.phase
        },
        conversationHistory,
        enhancedFeatures: {
          smartCTALogic: true,
          contextAnalysis: contextAnalysis,
          showSearchButton: contextAnalysis.shouldShowCTA
        }
      }
    });

    if (error) {
      console.error('🚨 Nicole AI Service Error:', error);
      throw error;
    }

    console.log('✅ Nicole AI Response received:', data);

    // Enhanced response with smart CTA logic
    const enhancedResponse = {
      ...data,
      showSearchButton: data.showSearchButton || contextAnalysis.shouldShowCTA,
      context: {
        ...data.context,
        conversationPhase: contextAnalysis.phase
      }
    };

    console.log('🎯 Enhanced Response with CTA Logic:', enhancedResponse);

    return enhancedResponse;

  } catch (error) {
    console.error('💥 Nicole chat error:', error);
    
    // Enhanced fallback response
    return {
      message: "I'm having trouble connecting right now, but I'd love to help you find the perfect gift! Could you tell me a bit more about what you're looking for?",
      context: {
        ...context,
        conversationPhase: 'error_recovery' as ConversationPhase
      },
      generateSearch: false,
      showSearchButton: false
    };
  }
}

// Enhanced context analysis for better CTA decisions
function analyzeContext(context: NicoleContext, userMessage: string) {
  const hasRecipient = Boolean(context.recipient || context.relationship);
  const hasOccasion = Boolean(context.occasion);
  const hasInterests = Boolean(context.interests && context.interests.length > 0);
  const hasBudget = Boolean(context.budget && Array.isArray(context.budget) && context.budget.length === 2);
  
  // Check for summary indicators in user message
  const summaryIndicators = [
    'perfect! so', 'great! so', 'excellent! so', 'to summarize', 'so, to recap',
    'i\'m ready to find', 'let me find', 'ready to search', 'let\'s find some'
  ];
  
  const hasSummaryIndicator = summaryIndicators.some(indicator => 
    userMessage.toLowerCase().includes(indicator)
  );

  // Determine conversation phase
  let phase: ConversationPhase = 'greeting';
  
  if (hasRecipient && hasOccasion && (hasInterests || hasBudget)) {
    phase = 'ready_to_search';
  } else if (hasRecipient || hasOccasion) {
    phase = 'gathering_info';
  }

  // Determine if CTA should show
  const shouldShowCTA = phase === 'ready_to_search' || 
                       hasSummaryIndicator || 
                       (hasRecipient && hasOccasion && hasInterests);

  return {
    phase,
    shouldShowCTA,
    hasEssentialInfo: hasRecipient && hasOccasion && (hasInterests || hasBudget),
    completionScore: [hasRecipient, hasOccasion, hasInterests, hasBudget].filter(Boolean).length / 4
  };
}
