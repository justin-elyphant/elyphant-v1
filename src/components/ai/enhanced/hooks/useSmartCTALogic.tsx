
import { useCallback } from 'react';
import { NicoleMessage, NicoleContext, ConversationPhase } from '@/services/ai/nicoleAiService';

interface EnhancedNicoleContext extends NicoleContext {
  conversationPhase?: ConversationPhase;
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

    // Much more conservative approach - require explicit AI confirmation
    if (aiShowFlag === true) {
      console.log('✅ AI Flag: Showing CTA button');
      return true;
    }

    // Very conservative fallback - only show if Nicole explicitly indicates readiness
    if (lastMessage) {
      const explicitReadinessIndicators = [
        'i have everything i need to help you find',
        'let me search for some perfect options',
        'i\'m ready to find some great gifts',
        'perfect! let me find some options',
        'i can definitely help you find',
        'let me search for the perfect gift',
        'ready to see what i can find',
        'i think i have enough information to help'
      ];
      
      const lowerMessage = lastMessage.toLowerCase();
      const hasExplicitReadiness = explicitReadinessIndicators.some(indicator => 
        lowerMessage.includes(indicator)
      );
      
      if (hasExplicitReadiness) {
        console.log('✅ Explicit Readiness Found: Showing CTA button');
        return true;
      }
    }

    // Very strict context validation - need comprehensive information
    const hasRecipient = Boolean(context.recipient || context.relationship);
    const hasOccasion = Boolean(context.occasion);
    const hasMultipleInterests = Boolean(context.interests && context.interests.length >= 2);
    const hasBudget = Boolean(context.budget && Array.isArray(context.budget) && context.budget.length === 2);
    
    // Only show if we have ALL essential information AND Nicole indicated readiness
    const hasComprehensiveInfo = hasRecipient && hasOccasion && hasMultipleInterests && hasBudget;
    
    console.log('🔍 Comprehensive Context Check:', {
      hasRecipient,
      hasOccasion,
      hasMultipleInterests,
      hasBudget,
      hasComprehensiveInfo
    });

    // Even with comprehensive info, be conservative
    if (hasComprehensiveInfo && context.conversationPhase === 'ready_to_search') {
      console.log('✅ Comprehensive Info + Ready Phase: Showing CTA button');
      return true;
    }

    console.log('❌ Conservative check failed: Hiding CTA button');
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
