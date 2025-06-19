
import { useCallback } from 'react';
import { NicoleMessage, NicoleContext, ConversationPhase } from '@/services/ai/nicoleAiService';
import { parseEnhancedContext } from '@/services/ai/enhancedContextParser';

interface EnhancedNicoleContext extends NicoleContext {
  conversationPhase?: ConversationPhase;
  detectedBrands?: string[];
}

export const useSmartCTALogic = () => {
  // Enhanced CTA logic that considers multi-category context
  const shouldShowCTAButton = useCallback((
    context: EnhancedNicoleContext, 
    lastMessage?: string,
    aiShowFlag?: boolean
  ): boolean => {
    console.log('🧠 Enhanced Smart CTA Logic Check:', {
      context: {
        recipient: context.recipient,
        occasion: context.occasion,
        interests: context.interests,
        budget: context.budget,
        detectedBrands: context.detectedBrands,
        conversationPhase: context.conversationPhase
      },
      aiFlag: aiShowFlag
    });

    // Primary decision: Use AI's flag
    if (aiShowFlag === true) {
      return true;
    }

    // Secondary check: Multi-category context
    const hasMultipleInterests = context.interests && context.interests.length > 1;
    const hasBrands = context.detectedBrands && context.detectedBrands.length > 0;
    const hasBasicInfo = Boolean(context.recipient && (context.occasion || context.interests?.length));

    // Show CTA if we have sufficient context for grouped search
    if (hasBasicInfo && (hasMultipleInterests || hasBrands)) {
      console.log('🎯 Multi-category context detected, showing CTA');
      return true;
    }

    return false;
  }, []);

  const extractContextFromMessage = useCallback((message: string, currentContext: EnhancedNicoleContext): EnhancedNicoleContext => {
    console.log('🔍 Enhanced context extraction from message:', message);
    
    // Use the enhanced context parser
    const parsedContext = parseEnhancedContext(message, currentContext);
    
    // Convert to EnhancedNicoleContext format
    const enhancedContext: EnhancedNicoleContext = {
      recipient: parsedContext.recipient,
      relationship: parsedContext.relationship,
      occasion: parsedContext.occasion,
      interests: parsedContext.interests,
      budget: parsedContext.budget,
      exactAge: parsedContext.exactAge,
      detectedBrands: parsedContext.detectedBrands,
      conversationPhase: currentContext.conversationPhase
    };
    
    console.log('✅ Enhanced context extracted:', enhancedContext);
    
    return enhancedContext;
  }, []);

  return {
    shouldShowCTAButton,
    extractContextFromMessage
  };
};
