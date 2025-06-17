import { supabase } from "@/integrations/supabase/client";

export interface NicoleMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type ConversationPhase = 'greeting' | 'gathering_info' | 'clarifying_needs' | 'providing_suggestions' | 'post_suggestions' | 'ready_for_action';

export type UserIntent = 'save_items' | 'schedule_gifts' | 'find_connections' | 'view_profile' | 'none';

export interface NicoleContext {
  recipient?: string;
  relationship?: string;
  occasion?: string;
  budget?: [number, number];
  interests?: string[];
  step?: string;
  conversationPhase?: ConversationPhase;
  userIntent?: UserIntent;
  hasReceivedSuggestions?: boolean;
  userSatisfactionSignals?: string[];
  connections?: any[];
  recipientWishlists?: any[];
  recommendations?: any[];
}

export interface ContextualLink {
  text: string;
  url: string;
  type: 'wishlist' | 'schedule' | 'profile' | 'connections';
}

export interface NicoleResponse {
  response: string;
  shouldGenerateSearch: boolean;
  conversationContinues: boolean;
  contextualLinks?: ContextualLink[];
  fallback?: boolean;
  error?: string;
  step?: string;
  conversationPhase?: ConversationPhase;
  userIntent?: UserIntent;
}

/**
 * Detect user intent from their message
 */
const detectUserIntent = (message: string): UserIntent => {
  const lowerMessage = message.toLowerCase();
  
  // Intent to save items
  if (lowerMessage.includes('save') || lowerMessage.includes('add to wishlist') || 
      lowerMessage.includes('keep these') || lowerMessage.includes('remember these')) {
    return 'save_items';
  }
  
  // Intent to schedule gifts
  if (lowerMessage.includes('schedule') || lowerMessage.includes('recurring') || 
      lowerMessage.includes('remind me') || lowerMessage.includes('set up')) {
    return 'schedule_gifts';
  }
  
  // Intent to find connections
  if (lowerMessage.includes('find friends') || lowerMessage.includes('connect with') || 
      lowerMessage.includes('see what they like')) {
    return 'find_connections';
  }
  
  // Intent to view profile
  if (lowerMessage.includes('profile') || lowerMessage.includes('about them')) {
    return 'view_profile';
  }
  
  return 'none';
};

/**
 * Detect satisfaction signals from user message
 */
const detectSatisfactionSignals = (message: string): string[] => {
  const lowerMessage = message.toLowerCase();
  const signals: string[] = [];
  
  if (lowerMessage.includes('perfect') || lowerMessage.includes('great') || 
      lowerMessage.includes('love these') || lowerMessage.includes('exactly what')) {
    signals.push('high_satisfaction');
  }
  
  if (lowerMessage.includes('these look good') || lowerMessage.includes('nice options') || 
      lowerMessage.includes('i like')) {
    signals.push('positive_feedback');
  }
  
  if (lowerMessage.includes('what now') || lowerMessage.includes('next step') || 
      lowerMessage.includes('how do i')) {
    signals.push('ready_for_action');
  }
  
  return signals;
};

/**
 * Determine conversation phase based on context and message
 */
const determineConversationPhase = (context: NicoleContext, message: string): ConversationPhase => {
  const lowerMessage = message.toLowerCase();
  
  // Check if user is ready for action
  if (context.userSatisfactionSignals?.includes('ready_for_action') || 
      context.userIntent !== 'none') {
    return 'ready_for_action';
  }
  
  // Check if user has received suggestions and is responding
  if (context.hasReceivedSuggestions && 
      (context.userSatisfactionSignals?.length || 0) > 0) {
    return 'post_suggestions';
  }
  
  // Check if we're providing suggestions
  if (context.step === 'search_ready' || context.hasReceivedSuggestions) {
    return 'providing_suggestions';
  }
  
  // Check if we're clarifying needs (have some info but need more)
  if ((context.recipient || context.relationship) && context.occasion && 
      (!context.interests && !context.budget)) {
    return 'clarifying_needs';
  }
  
  // Check if we're gathering basic info
  if (context.recipient || context.relationship || context.occasion) {
    return 'gathering_info';
  }
  
  return 'greeting';
};

/**
 * Generate contextual links based on conversation state and user intent
 */
const generateConservativeContextualLinks = (context: NicoleContext, aiResponse: string): ContextualLink[] => {
  const links: ContextualLink[] = [];
  const phase = context.conversationPhase || 'greeting';
  const intent = context.userIntent || 'none';
  
  // Only show links in appropriate phases
  if (phase === 'greeting' || phase === 'gathering_info') {
    return []; // No links during early conversation
  }
  
  // Show links based on explicit user intent
  if (intent === 'save_items' && context.hasReceivedSuggestions) {
    if (context.recipient) {
      links.push({
        text: `Save these gifts for ${context.recipient}`,
        url: `/wishlists/create?recipient=${encodeURIComponent(context.recipient)}&occasion=${encodeURIComponent(context.occasion || '')}`,
        type: 'wishlist'
      });
    } else {
      links.push({
        text: "Create a wishlist for these items",
        url: `/wishlists/create`,
        type: 'wishlist'
      });
    }
  }
  
  if (intent === 'schedule_gifts' && context.recipient && context.occasion) {
    links.push({
      text: `Schedule recurring ${context.occasion} gifts for ${context.recipient}`,
      url: `/gift-scheduling/create?recipient=${encodeURIComponent(context.recipient)}&occasion=${encodeURIComponent(context.occasion)}`,
      type: 'schedule'
    });
  }
  
  if (intent === 'find_connections') {
    links.push({
      text: "Browse your friends' wishlists",
      url: `/connections?intent=gift-giving`,
      type: 'connections'
    });
  }
  
  // Show contextual links only after user shows satisfaction with suggestions
  if (phase === 'post_suggestions' && context.userSatisfactionSignals?.includes('high_satisfaction')) {
    if (context.recipient && !links.some(l => l.type === 'wishlist')) {
      links.push({
        text: `Save these to a wishlist for ${context.recipient}`,
        url: `/wishlists/create?recipient=${encodeURIComponent(context.recipient)}`,
        type: 'wishlist'
      });
    }
  }
  
  // Show action-ready links only when user signals readiness
  if (phase === 'ready_for_action') {
    if (!links.some(l => l.type === 'wishlist') && context.hasReceivedSuggestions) {
      links.push({
        text: "Save these items to a wishlist",
        url: `/wishlists/create`,
        type: 'wishlist'
      });
    }
    
    if (!links.some(l => l.type === 'schedule') && context.recipient && context.occasion) {
      links.push({
        text: "Set up recurring gift reminders",
        url: `/gift-scheduling/create`,
        type: 'schedule'
      });
    }
  }
  
  return links;
};

/**
 * Send a message to Nicole AI and get a response with enhanced conversation flow and contextual links
 */
export const chatWithNicole = async (
  message: string,
  conversationHistory: NicoleMessage[] = [],
  context: NicoleContext = {}
): Promise<NicoleResponse> => {
  try {
    console.log('Sending message to Nicole AI with conservative contextual linking:', message);
    console.log('Current context:', context);
    
    // Enhance context by extracting information from the message
    const enhancedContext = enhanceContextFromMessage(message, context);
    
    // Detect user intent and satisfaction signals
    const userIntent = detectUserIntent(message);
    const satisfactionSignals = detectSatisfactionSignals(message);
    
    // Update context with new information
    enhancedContext.userIntent = userIntent;
    enhancedContext.userSatisfactionSignals = [
      ...(enhancedContext.userSatisfactionSignals || []),
      ...satisfactionSignals
    ];
    
    // Determine conversation phase
    enhancedContext.conversationPhase = determineConversationPhase(enhancedContext, message);
    
    const { data, error } = await supabase.functions.invoke('nicole-chat', {
      body: {
        message: message.trim(),
        conversationHistory,
        context: enhancedContext
      }
    });

    if (error) {
      console.error('Nicole chat error:', error);
      throw new Error(`Nicole AI error: ${error.message}`);
    }

    console.log('Nicole AI response with conservative contextual links received:', data);
    
    // Generate conservative contextual links
    const contextualLinks = generateConservativeContextualLinks(enhancedContext, data.response);
    
    return {
      ...data,
      contextualLinks
    } as NicoleResponse;

  } catch (error) {
    console.error('Error calling Nicole AI:', error);
    
    // Return enhanced fallback response with minimal links
    return {
      response: "I'm having trouble connecting to my AI service right now. But I can still help! Try searching for specific items like 'gifts for mom birthday' or 'Dad Christmas tech gadgets'. What type of gift are you looking for?",
      shouldGenerateSearch: false,
      conversationContinues: true,
      contextualLinks: [], // No links during fallback
      fallback: true,
      error: error instanceof Error ? error.message : 'Unknown error',
      conversationPhase: 'greeting'
    };
  }
};

/**
 * Enhance context by extracting information from user message
 */
const enhanceContextFromMessage = (message: string, currentContext: NicoleContext): NicoleContext => {
  const lowerMessage = message.toLowerCase();
  const enhanced = { ...currentContext };
  
  // Extract recipient information
  if (!enhanced.recipient) {
    if (lowerMessage.includes('mom') || lowerMessage.includes('mother')) {
      enhanced.recipient = 'mom';
      enhanced.relationship = 'family';
    } else if (lowerMessage.includes('dad') || lowerMessage.includes('father')) {
      enhanced.recipient = 'dad';
      enhanced.relationship = 'family';
    } else if (lowerMessage.includes('wife')) {
      enhanced.recipient = 'wife';
      enhanced.relationship = 'spouse';
    } else if (lowerMessage.includes('husband')) {
      enhanced.recipient = 'husband';
      enhanced.relationship = 'spouse';
    } else if (lowerMessage.includes('friend')) {
      enhanced.relationship = 'friend';
    } else if (lowerMessage.includes('sister')) {
      enhanced.recipient = 'sister';
      enhanced.relationship = 'family';
    } else if (lowerMessage.includes('brother')) {
      enhanced.recipient = 'brother';
      enhanced.relationship = 'family';
    }
  }

  // Extract occasion information
  if (!enhanced.occasion) {
    if (lowerMessage.includes('birthday')) {
      enhanced.occasion = 'birthday';
    } else if (lowerMessage.includes('christmas') || lowerMessage.includes('holiday')) {
      enhanced.occasion = 'christmas';
    } else if (lowerMessage.includes('anniversary')) {
      enhanced.occasion = 'anniversary';
    } else if (lowerMessage.includes('valentine')) {
      enhanced.occasion = 'valentines day';
    } else if (lowerMessage.includes('graduation')) {
      enhanced.occasion = 'graduation';
    }
  }

  // Extract budget information
  if (!enhanced.budget) {
    const budgetMatches = lowerMessage.match(/\$(\d+)/g);
    if (budgetMatches) {
      const amounts = budgetMatches.map(match => parseInt(match.replace('$', '')));
      if (amounts.length === 1) {
        enhanced.budget = [amounts[0] * 0.5, amounts[0]];
      } else if (amounts.length >= 2) {
        enhanced.budget = [Math.min(...amounts), Math.max(...amounts)];
      }
    } else if (lowerMessage.includes('under')) {
      const underMatch = lowerMessage.match(/under\s*\$?(\d+)/);
      if (underMatch) {
        const amount = parseInt(underMatch[1]);
        enhanced.budget = [amount * 0.3, amount];
      }
    }
  }

  // Extract interests
  const currentInterests = enhanced.interests || [];
  const newInterests: string[] = [];
  
  if (lowerMessage.includes('cooking') || lowerMessage.includes('kitchen') || lowerMessage.includes('chef')) {
    newInterests.push('cooking');
  }
  if (lowerMessage.includes('reading') || lowerMessage.includes('books')) {
    newInterests.push('reading');
  }
  if (lowerMessage.includes('fitness') || lowerMessage.includes('exercise') || lowerMessage.includes('gym')) {
    newInterests.push('fitness');
  }
  if (lowerMessage.includes('tech') || lowerMessage.includes('gadget') || lowerMessage.includes('electronics')) {
    newInterests.push('technology');
  }
  if (lowerMessage.includes('music') || lowerMessage.includes('guitar') || lowerMessage.includes('piano')) {
    newInterests.push('music');
  }
  if (lowerMessage.includes('art') || lowerMessage.includes('painting') || lowerMessage.includes('drawing')) {
    newInterests.push('art');
  }
  if (lowerMessage.includes('garden') || lowerMessage.includes('plant')) {
    newInterests.push('gardening');
  }
  if (lowerMessage.includes('fashion') || lowerMessage.includes('clothes') || lowerMessage.includes('jewelry')) {
    newInterests.push('fashion');
  }
  
  if (newInterests.length > 0) {
    enhanced.interests = [...new Set([...currentInterests, ...newInterests])];
  }

  // Determine conversation step
  if (enhanced.recipient && enhanced.occasion && (enhanced.interests || enhanced.budget)) {
    enhanced.step = 'search_ready';
  } else if (enhanced.recipient && enhanced.occasion) {
    enhanced.step = 'preferences';
  } else if (enhanced.recipient || enhanced.relationship) {
    enhanced.step = 'occasion';
  } else {
    enhanced.step = 'discovery';
  }

  return enhanced;
};

/**
 * Generate a search query based on conversation context optimized for Enhanced Zinc API
 */
export const generateSearchQuery = (context: NicoleContext): string => {
  let query = "gifts";
  
  // Add recipient context
  if (context.recipient) {
    query += ` for ${context.recipient}`;
  } else if (context.relationship) {
    query += ` for ${context.relationship}`;
  }
  
  // Add occasion
  if (context.occasion) {
    query += ` ${context.occasion}`;
  }
  
  // Add interests (these work well with Enhanced Zinc API)
  if (context.interests && context.interests.length > 0) {
    query += ` ${context.interests.join(" ")}`;
  }
  
  // Add budget constraint
  if (context.budget) {
    const [min, max] = context.budget;
    if (max < 100) {
      query += ` under $${max}`;
    } else if (min > 50) {
      query += ` premium`;
    }
  }
  
  // Enhance with specific product categories that work well with Enhanced Zinc API
  if (context.interests?.includes('cooking')) {
    query += ' kitchen appliances cookware';
  }
  if (context.interests?.includes('technology')) {
    query += ' electronics gadgets';
  }
  if (context.interests?.includes('fitness')) {
    query += ' workout gear fitness equipment';
  }
  if (context.interests?.includes('fashion')) {
    query += ' clothing accessories jewelry';
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
