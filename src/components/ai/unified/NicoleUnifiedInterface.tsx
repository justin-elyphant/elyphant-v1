
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Sparkles, Bot } from 'lucide-react';
import { useUnifiedNicoleAI } from '@/hooks/useUnifiedNicoleAI';
import { NicoleConversationDisplay } from './NicoleConversationDisplay';
import { NicoleInputArea } from './NicoleInputArea';
import { NicoleCapability } from '@/services/ai/unified/types';
import SmartAutoGiftCTA from '@/components/ai/ctas/SmartAutoGiftCTA';
import { setupAutoGiftWithUnifiedSystems } from '@/services/ai/unified/autoGiftSetupHelper';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth';

interface NicoleUnifiedInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  initialContext?: {
    capability?: string;
    selectedIntent?: string;
    userFirstName?: string;
    greetingContext?: any;
  };
  className?: string;
  // Additional props for backward compatibility
  entryPoint?: string;
  onIntentComplete?: (intent: "auto-gift" | "shop-solo" | "create-wishlist" | "giftor") => void;
  onNavigateToResults?: (searchQuery: string) => void;
}

interface Message {
  role: string;
  content: string;
}

export const NicoleUnifiedInterface: React.FC<NicoleUnifiedInterfaceProps> = ({
  isOpen,
  onClose,
  initialContext,
  className = "",
  entryPoint,
  onIntentComplete,
  onNavigateToResults
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Convert string capability to proper NicoleCapability type
  const getCapabilityFromString = (capabilityString?: string): NicoleCapability => {
    switch (capabilityString) {
      case 'auto_gifting':
      case 'auto-gifting':
        return 'auto_gifting';
      case 'gift_advisor':
      case 'gift-advisor':
        return 'gift_advisor';
      case 'search':
        return 'search';
      case 'marketplace_assistant':
      case 'marketplace-assistant':
        return 'marketplace_assistant';
      default:
        return 'conversation';
    }
  };

  // Build enhanced initial context from props
  const buildInitialContext = () => {
    const baseContext = {
      capability: getCapabilityFromString(initialContext?.capability),
      selectedIntent: initialContext?.selectedIntent as "auto-gift" | "shop-solo" | "create-wishlist" | "giftor" | undefined,
      userFirstName: initialContext?.userFirstName,
      greetingContext: initialContext?.greetingContext,
      conversationPhase: 'greeting' as const
    };

    // Add entry point context for Hero component compatibility
    if (entryPoint) {
      baseContext.greetingContext = {
        ...baseContext.greetingContext,
        entryPoint
      };
    }

    return baseContext;
  };

  const {
    chatWithNicole,
    loading,
    lastResponse,
    clearConversation,
    isReadyToSearch,
    getConversationContext,
    updateContext
  } = useUnifiedNicoleAI({
    initialContext: buildInitialContext(),
    onResponse: (response) => {
      setMessages(prev => [...prev, { role: 'assistant', content: response.message }]);
      
      // Handle intent completion callback for Hero component
      if (onIntentComplete && response.metadata?.contextUpdates?.selectedIntent) {
        onIntentComplete(response.metadata.contextUpdates.selectedIntent);
      }
    }
  });

  // Send auto-greeting when interface opens (wait for context to be ready)
  useEffect(() => {
    if (isOpen && messages.length === 0 && !loading) {
      console.log('🚀 Starting auto-greeting with Nicole');
      
      // Small delay to ensure user context is loaded
      const timer = setTimeout(async () => {
        try {
          // Use special trigger to get personalized auto-greeting
          const response = await chatWithNicole("__START_DYNAMIC_CHAT__");
          if (response) {
            setMessages([
              { role: 'assistant', content: response.message }
            ]);
          }
        } catch (error) {
          console.error('Failed to send auto-greeting:', error);
          // Fallback with personalized greeting
          const fallbackMessage = initialContext?.selectedIntent === 'auto-gift' 
            ? "Hey there! Ready to set up some auto-gifting magic? I'll help you never miss an important occasion again!"
            : "Hey there! I'm Nicole, your gift guru. What can I help you with today?";
          
          setMessages([
            { role: 'assistant', content: fallbackMessage }
          ]);
        }
      }, 500); // Wait 500ms for context to load
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, messages.length, loading, chatWithNicole, initialContext]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    // Don't add auto-greeting triggers to message display
    if (message !== "__START_DYNAMIC_CHAT__") {
      // Add user message to display
      setMessages(prev => [...prev, { role: 'user', content: message }]);
    }

    // Lightweight context extraction (helps trigger CTA if backend didn't tag it)
    const lower = message.toLowerCase();
    const occ = lower.includes('birthday') ? 'birthday'
      : lower.includes('anniversary') ? 'anniversary'
      : lower.includes('christmas') ? 'christmas'
      : undefined;
    if (occ) { try { updateContext({ occasion: occ } as any); } catch {} }

    // Send to Nicole and get response
    const response = await chatWithNicole(message);
    
    if (response) {
      // Add Nicole's response to display (only if not already added by auto-greeting)
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage?.role === 'assistant' && lastMessage?.content === response.message) {
          return prev; // Don't duplicate
        }
        return [...prev, { role: 'assistant', content: response.message }];
      });
    }
  };

  const handleSearch = () => {
    const searchQuery = lastResponse?.searchQuery || '';
    
    // Use onNavigateToResults callback if provided (for AIEnhancedSearchBar)
    if (onNavigateToResults) {
      onNavigateToResults(searchQuery);
      onClose();
      return;
    }
    
    // Default behavior: dispatch custom event
    console.log('Triggering marketplace search with Nicole context');
    onClose();
    window.dispatchEvent(new CustomEvent('nicole-search', {
      detail: { query: searchQuery }
    }));
  };

  // Smart Auto-Gift CTA state and handler
  const { user } = useAuth();
  const [isSettingUpAutoGift, setIsSettingUpAutoGift] = useState(false);

  const handleOfferAutoGift = async () => {
    const ctx = getConversationContext() as any;
    if (!user?.id) {
      toast.error("Please log in to set up auto-gifting");
      return;
    }
    try {
      setIsSettingUpAutoGift(true);
      const budget = Array.isArray(ctx?.budget) && ctx.budget.length === 2
        ? { min: Number(ctx.budget[0]), max: Number(ctx.budget[1]) }
        : undefined;

      if (budget) {
        await setupAutoGiftWithUnifiedSystems({
          userId: user.id,
          recipientName: String(ctx.recipient),
          occasion: String(ctx.occasion),
          budget,
          relationship: ctx.relationship || 'friend'
        });
        toast.success("Auto-gifting set up successfully");
        await chatWithNicole(`Please confirm we've set up auto-gifting for ${String(ctx.recipient)}'s ${String(ctx.occasion)} with a $${budget.min}-$${budget.max} budget.`);
      } else {
        await chatWithNicole(`Let's set up auto-gifting for ${String(ctx.recipient)}'s ${String(ctx.occasion)}.`);
      }
    } catch (e) {
      console.error('Auto-gift setup error', e);
      toast.error("Couldn't set up auto-gifting right now");
      // Keep the conversation going even on failure
      try {
        await chatWithNicole(`I couldn't set up auto-gifting just now. Let's keep going—what budget should we use for ${String(ctx.recipient)}'s ${String(ctx.occasion)}?`);
      } catch {}
    } finally {
      setIsSettingUpAutoGift(false);
    }
  };

  if (!isOpen) return null;

  // Force inline positioning for all instances to appear below search bar
  const isInline = true; // Always use inline positioning

  return (
    <div className={`relative w-full h-[500px] md:h-[600px] flex flex-col rounded-3xl shadow-lg border border-white/20 bg-white/60 backdrop-blur-md ${className}`}>
      {/* Enhanced Visual Connection Line to Search Bar */}
      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-0.5 h-4 bg-gradient-to-b from-purple-500 via-purple-400 to-transparent opacity-80 shadow-sm shadow-purple-400/50"></div>
      
      {/* Enhanced Header with Gradient */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-t-3xl p-4 border-b border-purple-400/20 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                <Bot className="w-4 h-4 text-white" />
              </div>
              {/* Online Status Indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-white">Chat with Nicole</h3>
              <Sparkles className="h-3 w-3 text-purple-200 animate-pulse" />
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-6 w-6 hover:bg-white/20 text-white/80 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Conversation Display */}
      <NicoleConversationDisplay
        messages={messages}
        isLoading={loading}
        showSearchButton={isReadyToSearch()}
        onSearch={handleSearch}
      />

      {/* Smart Auto-Gift CTA (proactive) */}
      {(() => {
        const ctx = getConversationContext() as any;
        const canOffer = Boolean(ctx?.recipient && ctx?.occasion);
        return canOffer ? (
          <div className="px-4 pt-2">
            <SmartAutoGiftCTA
              recipientName={String(ctx.recipient)}
              occasion={String(ctx.occasion)}
              loading={isSettingUpAutoGift}
              onConfirm={handleOfferAutoGift}
            />
          </div>
        ) : null;
      })()}

      {/* Input Area */}
      <NicoleInputArea
        onSendMessage={handleSendMessage}
        disabled={loading}
        placeholder="Type your message..."
      />
    </div>
  );
};

export default NicoleUnifiedInterface;
