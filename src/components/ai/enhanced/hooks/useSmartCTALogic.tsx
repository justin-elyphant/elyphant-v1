
import { useCallback } from 'react';
import { NicoleMessage, NicoleContext, ConversationPhase } from '@/services/ai/nicoleAiService';

interface EnhancedNicoleContext extends NicoleContext {
  conversationPhase?: ConversationPhase;
  detectedBrands?: string[];
}

export const useSmartCTALogic = () => {
  // Simplified - let the AI determine when to show CTA
  const shouldShowCTAButton = useCallback((
    context: EnhancedNicoleContext, 
    lastMessage?: string,
    aiShowFlag?: boolean
  ): boolean => {
    console.log('🧠 Smart CTA Logic Check (Simplified):', {
      context: {
        recipient: context.recipient,
        occasion: context.occasion,
        interests: context.interests,
        budget: context.budget,
        conversationPhase: context.conversationPhase
      },
      aiFlag: aiShowFlag
    });

    // Use ONLY the AI's decision
    return aiShowFlag === true;
  }, []);

  const extractContextFromMessage = useCallback((message: string, currentContext: EnhancedNicoleContext): EnhancedNicoleContext => {
    const lowerMessage = message.toLowerCase();
    let updatedContext = { ...currentContext };

    // Simple relationship detection
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

    // Simple occasion detection
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

    // Simple budget extraction
    const budgetMatch = message.match(/\$(\d+)/);
    if (budgetMatch) {
      const amount = parseInt(budgetMatch[1]);
      if (!isNaN(amount) && amount > 0) {
        const min = Math.max(10, Math.floor(amount * 0.7));
        const max = Math.ceil(amount * 1.3);
        updatedContext.budget = [min, max];
        console.log('💰 Budget extracted:', updatedContext.budget);
      }
    }

    // Simple interest detection
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
