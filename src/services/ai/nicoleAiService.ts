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
  | 'error_recovery';

export interface NicoleContext {
  recipient?: string;
  relationship?: string;
  occasion?: string;
  interests?: string[];
  budget?: [number, number];
  exactAge?: number;
  conversationPhase?: ConversationPhase;
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
