
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, X, Minimize2 } from 'lucide-react';
import { useUnifiedNicoleAI } from '@/hooks/useUnifiedNicoleAI';
import { useAuthSession } from '@/contexts/auth/useAuthSession';
import { NicoleConversationDisplay } from './NicoleConversationDisplay';
import { NicoleInputArea } from './NicoleInputArea';
import { useNicoleState } from '@/contexts/nicole/NicoleStateContext';

interface NicoleUnifiedInterfaceProps {
  onNavigateToResults?: (query: string) => void;
  className?: string;
}

export const NicoleUnifiedInterface: React.FC<NicoleUnifiedInterfaceProps> = ({
  onNavigateToResults,
  className = ""
}) => {
  const { user } = useAuthSession();
  const { state, actions } = useNicoleState();
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const hasInitialized = useRef(false);

  const { 
    chatWithNicole, 
    loading, 
    isReadyToSearch,
    generateSearchQuery,
    lastResponse,
    context
  } = useUnifiedNicoleAI({
    sessionId: `nicole-unified-${Date.now()}`,
    initialContext: {
      conversationPhase: 'greeting',
      capability: 'conversation',
      currentUserId: user?.id,
      interests: [],
      detectedBrands: []
    }
  });

  // Initialize dynamic greeting on mount (once per session)
  useEffect(() => {
    if (user && !hasInitialized.current && state.activeMode === 'floating') {
      hasInitialized.current = true;
      
      const initializeDynamicGreeting = async () => {
        console.log('🎯 Initializing dynamic greeting for user:', user.id);
        
        try {
          const response = await chatWithNicole('__START_DYNAMIC_CHAT__');
          if (response?.message) {
            setMessages([{ role: 'assistant', content: response.message }]);
          }
        } catch (error) {
          console.error('❌ Error initializing dynamic greeting:', error);
          // Fallback to a basic greeting if the AI fails
          setMessages([{ role: 'assistant', content: 'Hi! I\'m Nicole, your gift advisor. How can I help you find the perfect gift today?' }]);
        }
      };

      initializeDynamicGreeting();
    }
  }, [user, state.activeMode, chatWithNicole]);

  const handleSendMessage = useCallback(async (message: string) => {
    if (!message.trim() || loading) return;

    // Add user message immediately
    setMessages(prev => [...prev, { role: 'user', content: message }]);

    try {
      const response = await chatWithNicole(message);
      if (response?.message) {
        setMessages(prev => [...prev, { role: 'assistant', content: response.message }]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again!' 
      }]);
    }
  }, [chatWithNicole, loading]);

  const handleSearch = useCallback(() => {
    if (isReadyToSearch() && onNavigateToResults) {
      const query = generateSearchQuery();
      onNavigateToResults(query);
    }
  }, [isReadyToSearch, generateSearchQuery, onNavigateToResults]);

  const handleClose = useCallback(() => {
    actions.activateMode('closed');
    setMessages([]);
    hasInitialized.current = false;
  }, [actions]);

  const handleMinimize = useCallback(() => {
    setIsMinimized(!isMinimized);
  }, [isMinimized]);

  if (state.activeMode !== 'floating') {
    return null;
  }

  return (
    <Card className={`fixed bottom-6 right-6 w-96 bg-white shadow-2xl border-0 z-50 transition-all duration-200 ${
      isMinimized ? 'h-16' : 'h-[500px]'
    } ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <span className="font-semibold text-gray-800">Nicole - Gift Advisor</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMinimize}
            className="h-8 w-8 p-0"
          >
            <Minimize2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <div className="flex flex-col h-[calc(100%-65px)]">
          {/* Conversation Display */}
          <div className="flex-1 overflow-hidden">
            <NicoleConversationDisplay 
              messages={messages}
              isLoading={loading}
              showSearchButton={isReadyToSearch()}
              onSearch={handleSearch}
              context={context}
            />
          </div>

          {/* Input Area */}
          <NicoleInputArea 
            onSendMessage={handleSendMessage}
            disabled={loading}
            placeholder="Ask Nicole about gifts..."
          />
        </div>
      )}
    </Card>
  );
};
