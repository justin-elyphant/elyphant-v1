import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { useUnifiedNicoleAI } from '@/hooks/useUnifiedNicoleAI';
import { NicoleCapability, UnifiedNicoleContext } from '@/services/ai/unified/types';
import { LocalStorageService } from '@/services/localStorage/LocalStorageService';

// Import existing conversation components
import GiftAdvisorBot from '@/components/ai-gift-advisor/GiftAdvisorBot';
import EnhancedNicoleConversationEngine from '@/components/ai/enhanced/EnhancedNicoleConversationEngine';
import NicoleMarketplaceWidget from '@/components/ai/marketplace/NicoleMarketplaceWidget';

// Core conversation interface
import NicoleConversationInterface from './NicoleConversationInterface';

interface UnifiedNicoleInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  initialContext?: Partial<UnifiedNicoleContext>;
  initialCapability?: NicoleCapability;
  entryPoint?: 'homepage' | 'dashboard' | 'marketplace' | 'search' | 'general';
  marketplaceContext?: any;
  onIntentComplete?: (intent: string) => void;
}

export const UnifiedNicoleInterface: React.FC<UnifiedNicoleInterfaceProps> = ({
  isOpen,
  onClose,
  initialContext = {},
  initialCapability = 'conversation',
  entryPoint = 'general',
  marketplaceContext,
  onIntentComplete
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Smart capability detection based on entry point and context
  const [activeCapability, setActiveCapability] = useState<NicoleCapability>(() => {
    // Auto-detect capability based on entry point
    switch (entryPoint) {
      case 'homepage':
        return LocalStorageService.getNicoleContext()?.selectedIntent === 'auto-gift' 
          ? 'auto_gifting' 
          : 'conversation';
      case 'dashboard':
        return 'auto_gifting';
      case 'marketplace':
        return 'marketplace_assistant';
      case 'search':
        return 'search';
      default:
        return initialCapability;
    }
  });

  // Enhanced context with entry point awareness
  const enhancedInitialContext: Partial<UnifiedNicoleContext> = {
    ...initialContext,
    capability: activeCapability,
    currentUserId: user?.id,
    userFirstName: user?.user_metadata?.first_name,
    // Auto-detect if this is a gift advisor flow
    selectedIntent: entryPoint === 'homepage' 
      ? LocalStorageService.getNicoleContext()?.selectedIntent as any
      : undefined,
    // Include marketplace context if relevant
    ...(marketplaceContext && {
      marketplaceState: marketplaceContext,
      searchQuery: marketplaceContext?.query
    })
  };

  const {
    chatWithNicole,
    context,
    lastResponse,
    loading,
    updateContext,
    clearConversation,
    hasCapability
  } = useUnifiedNicoleAI({
    initialContext: enhancedInitialContext,
    onResponse: (response) => {
      // Handle capability changes
      if (response.capability !== activeCapability) {
        setActiveCapability(response.capability);
      }
      
      // Handle specific actions
      if (response.actions.includes('show_gift_advisor')) {
        setActiveCapability('gift_advisor');
      }
      if (response.actions.includes('start_auto_gifting')) {
        setActiveCapability('auto_gifting');
      }
    }
  });

  // Auto-set greeting based on entry point and user context
  useEffect(() => {
    if (isOpen && !lastResponse) {
      const greeting = generateContextualGreeting();
      if (greeting) {
        chatWithNicole(greeting);
      }
    }
  }, [isOpen, user?.user_metadata?.first_name]);

  const generateContextualGreeting = (): string => {
    const firstName = user?.user_metadata?.first_name;
    const welcomePrefix = firstName ? `Hey ${firstName}! 👋` : 'Hey there! 👋';
    
    switch (entryPoint) {
      case 'homepage':
        const intent = LocalStorageService.getNicoleContext()?.selectedIntent;
        if (intent === 'auto-gift') {
          return `${welcomePrefix} I'll help you set up automatic gift-giving so you never miss important celebrations. Who would you like to set up auto-gifting for?`;
        }
        return `${welcomePrefix} Welcome back! Let's find the perfect gift. Who are you shopping for?`;
      
      case 'dashboard':
        return `${welcomePrefix} Ready to set up some auto-gifting? I'll help you create rules so you never miss important celebrations.`;
      
      case 'marketplace':
        return `${welcomePrefix} I can help you find exactly what you're looking for. What gift are you searching for today?`;
      
      case 'search':
        return `${welcomePrefix} I'm here to help with your search. Tell me what you're looking for!`;
      
      default:
        return `${welcomePrefix} I'm Nicole, your AI gift advisor. How can I help you today?`;
    }
  };

  const handleClose = () => {
    clearConversation();
    onClose();
  };

  const handleBack = () => {
    // Smart back navigation based on capability
    if (activeCapability === 'gift_advisor' || activeCapability === 'auto_gifting') {
      setActiveCapability('conversation');
      updateContext({ capability: 'conversation' });
    } else {
      handleClose();
    }
  };

  const shouldShowBackButton = () => {
    return activeCapability !== 'conversation' && entryPoint !== 'general';
  };

  const getDialogTitle = () => {
    switch (activeCapability) {
      case 'auto_gifting':
        return 'Auto-Gifting Setup';
      case 'gift_advisor':
        return 'Gift Advisor';
      case 'marketplace_assistant':
        return 'Shopping Assistant';
      case 'search':
        return 'Search Assistant';
      case 'budget_analysis':
        return 'Budget Analysis';
      case 'wishlist_analysis':
        return 'Wishlist Analysis';
      default:
        return 'Nicole AI Assistant';
    }
  };

  // Route to specialized interfaces for complex flows
  const renderSpecializedInterface = () => {
    switch (activeCapability) {
      case 'auto_gifting':
        // For auto-gifting, we can use the existing GiftAdvisorBot with specific context
        if (context.giftCollectionPhase || context.conversationPhase === 'quick-gift') {
          return (
            <GiftAdvisorBot 
              isOpen={true}
              onClose={handleClose}
            />
          );
        }
        break;
      
      case 'marketplace_assistant':
        // Use existing marketplace widget for marketplace assistance
        if (marketplaceContext) {
          return (
            <NicoleMarketplaceWidget
              isOpen={true}
              onClose={handleClose}
              searchQuery={marketplaceContext.query}
              selectedProduct={marketplaceContext.products}
            />
          );
        }
        break;
    }
    
    return null;
  };

  const specializedInterface = renderSpecializedInterface();
  
  if (specializedInterface) {
    return specializedInterface;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="flex flex-row items-center justify-between p-4 border-b shrink-0">
          <div className="flex items-center gap-2">
            {shouldShowBackButton() && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <DialogTitle className="text-lg font-semibold">
              {getDialogTitle()}
            </DialogTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <NicoleConversationInterface
            context={context}
            lastResponse={lastResponse}
            loading={loading}
            onSendMessage={chatWithNicole}
            onUpdateContext={updateContext}
            capability={activeCapability}
            onCapabilityChange={setActiveCapability}
            onIntentComplete={onIntentComplete}
            entryPoint={entryPoint}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UnifiedNicoleInterface;