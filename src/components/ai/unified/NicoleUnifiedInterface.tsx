
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Sparkles, Bot } from 'lucide-react';
import { useUnifiedNicoleAI } from '@/hooks/useUnifiedNicoleAI';
import { NicoleConversationDisplay } from './NicoleConversationDisplay';
import { NicoleInputArea } from './NicoleInputArea';
import { NicoleCapability } from '@/services/ai/unified/types';

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
  onIntentComplete?: (intent: "auto-gift" | "shop-solo" | "create-wishlist") => void;
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
      selectedIntent: initialContext?.selectedIntent as "auto-gift" | "shop-solo" | "create-wishlist" | undefined,
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
    isReadyToSearch
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

  // Send initial greeting when component opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greetingMessage = initialContext?.selectedIntent === 'auto-gift' 
        ? "I'd like to set up auto-gifting"
        : "Hello Nicole";
      
      handleSendMessage(greetingMessage);
    }
  }, [isOpen, initialContext]);

  const handleSendMessage = async (message: string) => {
    // Add user message to display
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    
    // Send to Nicole AI
    await chatWithNicole(message);
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
