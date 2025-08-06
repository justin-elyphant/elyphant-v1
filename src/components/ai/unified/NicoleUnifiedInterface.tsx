
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
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
}

interface Message {
  role: string;
  content: string;
}

export const NicoleUnifiedInterface: React.FC<NicoleUnifiedInterfaceProps> = ({
  isOpen,
  onClose,
  initialContext,
  className = ""
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

  const {
    chatWithNicole,
    loading,
    lastResponse,
    clearConversation,
    isReadyToSearch
  } = useUnifiedNicoleAI({
    initialContext: {
      capability: getCapabilityFromString(initialContext?.capability),
      selectedIntent: initialContext?.selectedIntent as "auto-gift" | "shop-solo" | "create-wishlist" | undefined,
      userFirstName: initialContext?.userFirstName,
      greetingContext: initialContext?.greetingContext,
      conversationPhase: 'greeting'
    },
    onResponse: (response) => {
      setMessages(prev => [...prev, { role: 'assistant', content: response.message }]);
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
    // This would trigger marketplace search with Nicole's context
    console.log('Triggering marketplace search with Nicole context');
    onClose();
    // Navigate to marketplace with search query
    window.dispatchEvent(new CustomEvent('nicole-search', {
      detail: { query: lastResponse?.searchQuery || '' }
    }));
  };

  if (!isOpen) return null;

  return (
    <Card className={`fixed top-16 right-4 w-80 h-96 z-50 flex flex-col shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-sm">Chat with Nicole</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-6 w-6"
        >
          <X className="h-4 w-4" />
        </Button>
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
    </Card>
  );
};

export default NicoleUnifiedInterface;
