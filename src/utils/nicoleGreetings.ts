import { UnifiedNicoleContext } from "@/services/ai/unified/types";

export interface GreetingContext {
  greeting?: string;
  firstName?: string;
  userProfile?: {
    first_name?: string;
    display_name?: string;
  } | any; // Allow any user object for compatibility
  friendName?: string;
  activeMode?: string;
}

/**
 * Generates contextual greeting messages for Nicole AI based on URL parameters and user data
 */
export const getNicoleGreeting = (context: GreetingContext): string => {
  const { greeting, firstName, userProfile, friendName, activeMode } = context;
  
  // Get the user's first name from various sources
  const userName = firstName || userProfile?.first_name || userProfile?.display_name;
  const namePrefix = userName ? `Hey ${userName}! ` : "Hey! ";
  
  // Handle specific greeting contexts from URL parameters
  switch (greeting) {
    case 'giftor-intent':
      return `${namePrefix}Ready to find something amazing? I'll help you discover the perfect gift!`;
    
    case 'dashboard':
      return `${namePrefix}I see you're in your dashboard. What can I help you find today?`;
    
    case 'friend-gift':
      const friendText = friendName ? ` for ${friendName}` : "";
      return `${namePrefix}I'm here to help you find the perfect gift${friendText}. What's the occasion?`;
    
    case 'core_experience':
      return `${namePrefix}I love helping find perfect gifts. What are we shopping for today?`;
    
    case 'gift-finder':
      return `${namePrefix}Let's find you the perfect gift! Who are we shopping for?`;
    
    case 'surprise':
      return `${namePrefix}Looking for something special? I love finding surprise gifts!`;
    
    case 'post-auth-welcome':
      return `${namePrefix}Welcome to Elyphant! 🎉 I love helping find the perfect gifts. I can help you find something amazing in like 60 seconds. What's up?`;
    
    default:
      // Mode-specific default greetings
      if (activeMode === 'search') {
        return `${namePrefix}I love helping find the perfect stuff! What are you hunting for?`;
      } else if (activeMode === 'floating') {
        return `${namePrefix}I love helping find perfect gifts! Who are we shopping for today?`;
      } else {
        return `${namePrefix}I love helping find perfect gifts! What can I help you find today?`;
      }
  }
};

/**
 * Extracts greeting context from URL search parameters
 */
export const getGreetingFromUrl = (searchParams: URLSearchParams): GreetingContext => {
  return {
    greeting: searchParams.get('greeting') || undefined,
    firstName: searchParams.get('first_name') === 'true' ? undefined : (searchParams.get('first_name') || undefined),
    friendName: searchParams.get('name') || undefined
  };
};