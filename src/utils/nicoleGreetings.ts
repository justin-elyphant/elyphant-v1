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
  
  // Get the user's first name from multiple possible sources
  const userName = firstName || 
                   userProfile?.first_name || 
                   userProfile?.user_metadata?.first_name ||
                   userProfile?.user_metadata?.full_name?.split(' ')[0] ||
                   (userProfile as any)?.raw_user_meta_data?.first_name ||
                   (userProfile as any)?.raw_user_meta_data?.full_name?.split(' ')[0] ||
                   userProfile?.display_name?.split(' ')[0] ||
                   userProfile?.email?.split('@')[0];
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
      // Strategic default greeting with mini-CTAs
      if (activeMode === 'search') {
        return `${namePrefix}What brings you to Elyphant today? I can help you reach out to your loved ones and set up auto gifts, browse our marketplace for perfect finds, or help you create and manage your wishlist.`;
      } else if (activeMode === 'floating') {
        return `${namePrefix}What brings you to Elyphant today? I can help you reach out to your loved ones and set up auto gifts, browse our marketplace for perfect finds, or help you create and manage your wishlist.`;
      } else {
        return `${namePrefix}What brings you to Elyphant today? I can help you reach out to your loved ones and set up auto gifts, browse our marketplace for perfect finds, or help you create and manage your wishlist.`;
      }
  }
};

/**
 * Extracts greeting context from URL search parameters
 */
export const getGreetingFromUrl = (searchParams: URLSearchParams): GreetingContext => {
  // Handle first_name=true parameter by returning flag to fetch from user profile
  const firstNameParam = searchParams.get('first_name');
  const firstName = firstNameParam === 'true' ? undefined : firstNameParam;
  
  return {
    greeting: searchParams.get('greeting') || undefined,
    firstName: firstName || undefined,
    friendName: searchParams.get('name') || undefined
  };
};