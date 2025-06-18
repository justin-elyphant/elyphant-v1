
import { useCallback } from 'react';
import { NicoleMessage, NicoleContext } from '@/services/ai/nicoleAiService';

interface EnhancedNicoleContext extends NicoleContext {
  conversationPhase?: string;
  detectedBrands?: string[];
}

export const useSmartCTALogic = () => {
  const shouldShowCTAButton = useCallback((
    context: EnhancedNicoleContext, 
    lastMessage?: string,
    aiShowFlag?: boolean
  ): boolean => {
    console.log('🧠 Smart CTA Logic Check:', {
      context: {
        recipient: context.recipient,
        occasion: context.occasion,
        interests: context.interests,
        budget: context.budget,
        conversationPhase: context.conversationPhase
      },
      lastMessage: lastMessage?.substring(0, 100) + '...',
      aiFlag: aiShowFlag
    });

    // Primary: Trust AI's decision if it says to show button
    if (aiShowFlag) {
      console.log('✅ AI Flag: Showing CTA button');
      return true;
    }

    // Fallback 1: Check if Nicole gave a summary/confirmation message
    if (lastMessage) {
      const summaryIndicators = [
        'perfect! so',
        'great! so',
        'excellent! so',
        'to summarize',
        'so, to recap',
        'i\'m ready to find',
        'let me find',
        'ready to search',
        'let\'s find some',
        'here\'s what i have',
        'i have everything i need',
        'sounds like a great plan',
        'i can definitely help',
        'perfect! let me search'
      ];
      
      const lowerMessage = lastMessage.toLowerCase();
      const hasSummaryIndicator = summaryIndicators.some(indicator => 
        lowerMessage.includes(indicator)
      );
      
      if (hasSummaryIndicator) {
        console.log('✅ Summary Indicator Found: Showing CTA button');
        return true;
      }
    }

    // Fallback 2: Smart context validation - has essential information
    const hasRecipient = Boolean(context.recipient || context.relationship);
    const hasOccasionOrAge = Boolean(context.occasion || context.exactAge);
    const hasInterestsOrBrands = Boolean(
      (context.interests && context.interests.length > 0) || 
      (context.detectedBrands && context.detectedBrands.length > 0)
    );
    const hasBudget = Boolean(context.budget && Array.isArray(context.budget) && context.budget.length === 2);

    // Essential info threshold: Need recipient + occasion + (interests OR budget)
    const hasEssentialInfo = hasRecipient && hasOccasionOrAge && (hasInterestsOrBrands || hasBudget);
    
    console.log('🔍 Context Validation:', {
      hasRecipient,
      hasOccasionOrAge,
      hasInterestsOrBrands,
      hasBudget,
      hasEssentialInfo
    });

    if (hasEssentialInfo) {
      console.log('✅ Essential Info Complete: Showing CTA button');
      return true;
    }

    // Fallback 3: Check conversation phase
    if (context.conversationPhase === 'ready_to_search') {
      console.log('✅ Conversation Phase Ready: Showing CTA button');
      return true;
    }

    // Fallback 4: Check if we have enough partial info and context suggests readiness
    const hasPartialInfo = hasRecipient && (hasOccasionOrAge || hasInterestsOrBrands);
    const contextSuggestsReady = context.conversationPhase === 'gathering_info' && 
                                 lastMessage && lastMessage.length > 50; // Nicole gave a substantial response

    if (hasPartialInfo && contextSuggestsReady) {
      console.log('✅ Partial Info + Context Ready: Showing CTA button');
      return true;
    }

    console.log('❌ No conditions met: Hiding CTA button');
    return false;
  }, []);

  const extractContextFromMessage = useCallback((message: string, currentContext: EnhancedNicoleContext): EnhancedNicoleContext => {
    const lowerMessage = message.toLowerCase();
    let updatedContext = { ...currentContext };

    // Enhanced relationship detection
    const relationshipPatterns = [
      { pattern: /\bmy (?:wife|husband|spouse|partner)\b/i, recipient: 'spouse', relationship: 'spouse' },
      { pattern: /\bmy (?:mom|mother|dad|father)\b/i, recipient: 'parent', relationship: 'parent' },
      { pattern: /\bmy (?:son|daughter|child|kid)\b/i, recipient: 'child', relationship: 'child' },
      { pattern: /\bmy (?:friend|buddy|pal)\b/i, recipient: 'friend', relationship: 'friend' },
      { pattern: /\bmy (?:brother|sister|sibling)\b/i, recipient: 'sibling', relationship: 'sibling' }
    ];

    for (const { pattern, recipient, relationship } of relationshipPatterns) {
      if (pattern.test(message)) {
        updatedContext.recipient = recipient;
        updatedContext.relationship = relationship;
        console.log(`👥 Relationship detected: ${recipient} (${relationship})`);
        break;
      }
    }

    // Enhanced occasion detection
    const occasionPatterns = [
      { pattern: /birthday|turning \d+|\d+th birthday/i, occasion: 'birthday' },
      { pattern: /christmas|holiday/i, occasion: 'christmas' },
      { pattern: /anniversary/i, occasion: 'anniversary' },
      { pattern: /valentine/i, occasion: 'valentine\'s day' }
    ];

    for (const { pattern, occasion } of occasionPatterns) {
      if (pattern.test(message)) {
        updatedContext.occasion = occasion;
        console.log(`🎉 Occasion detected: ${occasion}`);
        break;
      }
    }

    // Enhanced budget extraction
    const budgetPatterns = [
      /around \$(\d+)/i,
      /about \$(\d+)/i,
      /\$(\d+)(?:\s*-\s*\$?(\d+))?/g,
      /under \$(\d+)/i,
      /up to \$(\d+)/i
    ];

    for (const pattern of budgetPatterns) {
      const match = message.match(pattern);
      if (match) {
        const amount = parseInt(match[1]);
        if (!isNaN(amount) && amount > 0) {
          const min = Math.max(10, Math.floor(amount * 0.7));
          const max = Math.ceil(amount * 1.3);
          updatedContext.budget = [min, max];
          console.log('💰 Budget extracted:', updatedContext.budget);
          break;
        }
      }
    }

    // Enhanced interest detection
    const interestKeywords = ['yoga', 'cooking', 'fitness', 'reading', 'music', 'art', 'sports', 'gaming', 'travel', 'photography'];
    const foundInterests = interestKeywords.filter(interest => 
      lowerMessage.includes(interest)
    );

    if (foundInterests.length > 0) {
      updatedContext.interests = [
        ...new Set([...(updatedContext.interests || []), ...foundInterests])
      ];
      console.log('🎯 Interests detected:', foundInterests);
    }

    return updatedContext;
  }, []);

  return {
    shouldShowCTAButton,
    extractContextFromMessage
  };
};
