// ⚠️ DEPRECATED: This service is being phased out in favor of UnifiedNicoleAIService
// Use useUnifiedNicoleAI hook instead of direct imports from this file
// This will be removed in a future version

import { supabase } from "@/integrations/supabase/client";
import { parseEnhancedContext, ParsedContext } from "./enhancedContextParser";
import { performMultiCategorySearch, GroupedSearchResults } from "./multiCategorySearchService";
import { ConversationEnhancementService, CategoryFollowUpRequest } from "./conversationEnhancementService";

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
  showSearchButton?: boolean;
  groupedResults?: GroupedSearchResults;
  followUpRequest?: CategoryFollowUpRequest;
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
 * Detect readiness phrases in AI response for fallback button logic
 */
function detectReadinessInResponse(message: string): boolean {
  const readinessPatterns = [
    /ready to see (your )?gifts/i,
    /let's find (some )?gifts/i,
    /search for gifts/i,
    /show you (some )?options/i,
    /browse (the )?marketplace/i,
    /time to shop/i,
    /perfect.*let's go/i
  ];
  
  return readinessPatterns.some(pattern => pattern.test(message));
}

/**
 * Enhanced chat with Nicole that supports multi-category search and conversation enhancement
 */
/**
 * @deprecated Use useUnifiedNicoleAI hook instead
 * This function will be removed in a future version
 */
export async function chatWithNicole(
  message: string,
  context: NicoleContext,
  conversationHistory: NicoleMessage[] = []
): Promise<NicoleResponse & { showSearchButton?: boolean; groupedResults?: GroupedSearchResults; followUpRequest?: CategoryFollowUpRequest }> {
  console.log('🤖 Enhanced Nicole AI Service - Processing message:', message);
  console.log('📊 Current context:', context);

  try {
    // Enhanced: Use unified data service for comprehensive integration
    const { unifiedDataService } = await import("../unified/UnifiedDataService");
    const { nicoleConnectionBridge } = await import("../unified/NicoleConnectionBridge");
    
    console.log('🔍 Loading unified user data...');
    const nicoleData = await unifiedDataService.getNicoleIntegrationData();
    
    // Enhance context with connection and wishlist integration
    const enhancedContext = await nicoleConnectionBridge.enhanceNicoleContext(
      message,
      context
    );
    
    console.log('✅ Enhanced context with unified data:', {
      connections: nicoleData?.connections.length || 0,
      wishlists: nicoleData?.availableWishlists.length || 0,
      selectedRecipient: enhancedContext.selectedRecipient?.profile?.name,
      availableRecipients: enhancedContext.availableRecipients?.length || 0
    });

    // Check for category-specific follow-up requests first
    const followUpRequest = ConversationEnhancementService.parseFollowUpRequest(
      message, 
      ConversationEnhancementService['conversationState']?.previousSearchResults
    );

    if (followUpRequest) {
      console.log('🎯 Detected category follow-up request:', followUpRequest);
      
      // Generate follow-up message
      const followUpMessage = ConversationEnhancementService.generateFollowUpMessage(followUpRequest);
      
      // Track the interaction
      ConversationEnhancementService.trackCategoryInteraction({
        categoryName: followUpRequest.categoryName,
        action: 'requested_more',
        timestamp: new Date()
      });

      // Perform refined search based on the request
      const parsedContext = parseEnhancedContext(message, context);
      const refinedResults = await performMultiCategorySearch(parsedContext, 6); // More items for follow-ups
      
      return {
        message: followUpMessage,
        context: {
          ...context,
          conversationPhase: 'presenting_results' as ConversationPhase
        },
        generateSearch: true,
        showSearchButton: false,
        groupedResults: refinedResults,
        followUpRequest
      };
    }

    // Enhanced context parsing
    const parsedContext = parseEnhancedContext(message, context);
    console.log('🔍 Enhanced context analysis:', parsedContext);

    const { data, error } = await supabase.functions.invoke('nicole-chat', {
      body: {
        message,
        context: {
          ...parsedContext,
          conversationPhase: determineConversationPhase(parsedContext),
          preferredCategories: ConversationEnhancementService.getPreferredCategories(),
          // Enhanced: Include unified connection and wishlist data
          userConnections: nicoleData?.connections || [],
          userWishlists: nicoleData?.availableWishlists || [],
          selectedRecipient: enhancedContext.selectedRecipient,
          availableRecipients: enhancedContext.availableRecipients,
          contextualRecommendations: enhancedContext.contextualRecommendations
        },
        conversationHistory,
        enhancedFeatures: {
          multiCategorySearch: true,
          brandCategoryMapping: true,
          groupedResults: true,
          conversationEnhancement: true,
          connectionIntegration: true,
          wishlistIntegration: true
        }
      }
    });

    if (error) {
      console.error('🚨 Enhanced Nicole AI Service Error:', error);
      throw error;
    }

    console.log('✅ Enhanced Nicole AI Response received:', data);
    console.log('🔍 AI Response showSearchButton:', data.showSearchButton);
    console.log('🔍 AI Response conversationPhase:', data.conversationPhase);

    // Enhanced search button logic with fallback detection
    let shouldShowSearchButton = Boolean(data.showSearchButton);
    
    // Fallback: detect readiness in AI response message
    if (!shouldShowSearchButton && data.response) {
      const hasReadinessPhrase = detectReadinessInResponse(data.response);
      console.log('🔍 Fallback readiness detection:', hasReadinessPhrase);
      if (hasReadinessPhrase) {
        shouldShowSearchButton = true;
        console.log('✅ Fallback logic activated search button');
      }
    }

    // Additional fallback: check if we have sufficient context
    const hasMinimumContext = Boolean(
      (parsedContext.recipient || parsedContext.relationship) &&
      (parsedContext.interests?.length > 0 || parsedContext.detectedBrands?.length > 0) &&
      parsedContext.occasion
    );
    
    if (!shouldShowSearchButton && hasMinimumContext) {
      console.log('🔍 Context-based fallback triggered:', { hasMinimumContext });
      shouldShowSearchButton = true;
      console.log('✅ Context fallback activated search button');
    }

    console.log('🎯 Final showSearchButton decision:', shouldShowSearchButton);

    // Check if we should perform multi-category search
    const shouldPerformGroupedSearch = shouldShowSearchButton && 
      (parsedContext.categoryMappings.length > 1 || parsedContext.detectedBrands.length > 0);

    let groupedResults: GroupedSearchResults | undefined;
    
    if (shouldPerformGroupedSearch) {
      console.log('🔍 Performing multi-category search...');
      try {
        groupedResults = await performMultiCategorySearch(parsedContext, 4);
        console.log('✅ Multi-category search complete:', groupedResults);
        
        // Update conversation state with results
        ConversationEnhancementService.updateConversationState(groupedResults);
      } catch (searchError) {
        console.error('❌ Multi-category search error:', searchError);
        // Continue without grouped results
      }
    }

    // Map the response from the edge function to our expected format
    const mappedResponse = {
      message: data.response || data.message || "I'm here to help you find the perfect gift! What are you looking for?",
      context: {
        ...data.context || parsedContext,
        conversationPhase: data.conversationPhase || determineConversationPhase(parsedContext)
      },
      generateSearch: shouldShowSearchButton,
      showSearchButton: shouldShowSearchButton,
      groupedResults
    };

    console.log('🎯 Final Mapped Response:', mappedResponse);

    return mappedResponse;

  } catch (error) {
    console.error('💥 Enhanced Nicole chat error:', error);
    
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

// Enhanced context analysis for better conversation flow
function determineConversationPhase(parsedContext: ParsedContext): ConversationPhase {
  const hasRecipient = Boolean(parsedContext.recipient || parsedContext.relationship);
  const hasOccasion = Boolean(parsedContext.occasion);
  const hasInterests = Boolean(parsedContext.interests && parsedContext.interests.length > 0);
  const hasBudget = Boolean(parsedContext.budget && Array.isArray(parsedContext.budget) && parsedContext.budget.length === 2);
  const hasBrands = Boolean(parsedContext.detectedBrands && parsedContext.detectedBrands.length > 0);
  
  // Ready for search if we have multiple categories or sufficient context
  if ((hasRecipient && hasOccasion && (hasInterests || hasBrands)) || 
      parsedContext.categoryMappings.length > 1) {
    return 'ready_to_search';
  }
  
  // Gathering info if we have some context but not enough
  if (hasRecipient || hasOccasion || hasInterests || hasBrands) {
    return 'gathering_info';
  }
  
  return 'greeting';
}
