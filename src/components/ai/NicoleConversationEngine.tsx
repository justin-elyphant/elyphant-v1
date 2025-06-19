
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { chatWithNicole, generateSearchQuery, NicoleMessage, NicoleContext } from "@/services/ai/nicoleAiService";
import { useSmartCTALogic } from "@/components/ai/enhanced/hooks/useSmartCTALogic";
import GroupedSearchResultsComponent from "./GroupedSearchResults";
import type { GroupedSearchResults } from "@/services/ai/multiCategorySearchService";
import { ConversationEnhancementService } from "@/services/ai/conversationEnhancementService";

interface NicoleConversationEngineProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToMarketplace?: (searchQuery: string) => void;
  initialMessage?: string;
}

const NicoleConversationEngine: React.FC<NicoleConversationEngineProps> = ({
  isOpen,
  onClose,
  onNavigateToMarketplace,
  initialMessage
}) => {
  const { user } = useAuth();
  const { shouldShowCTAButton, extractContextFromMessage } = useSmartCTALogic();
  const [messages, setMessages] = useState<NicoleMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState<NicoleContext>({});
  const [showSearchButton, setShowSearchButton] = useState(false);
  const [groupedResults, setGroupedResults] = useState<GroupedSearchResults | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialMessage && messages.length === 0) {
      handleSendMessage(initialMessage);
    }
  }, [initialMessage]);

  // Enhanced auto-scroll logic
  useEffect(() => {
    const scrollToBottom = () => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        container.scrollTop = container.scrollHeight;
      }
    };

    // Multiple scroll attempts for better reliability
    const timeoutIds = [
      setTimeout(scrollToBottom, 50),
      setTimeout(scrollToBottom, 150),
      setTimeout(scrollToBottom, 300)
    ];

    return () => timeoutIds.forEach(id => clearTimeout(id));
  }, [messages, isLoading, groupedResults]);

  // Maintain input focus
  useEffect(() => {
    if (isOpen && inputRef.current && !isLoading) {
      const focusTimeout = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(focusTimeout);
    }
  }, [isOpen, isLoading, messages]);

  // Debug logging for search button state
  useEffect(() => {
    console.log('🔍 Search button state changed:', showSearchButton);
    console.log('🔍 Current context:', context);
  }, [showSearchButton, context]);

  const handleSearchInMarketplace = () => {
    console.log('🎯 Search button clicked, navigating to marketplace');
    if (onNavigateToMarketplace) {
      const searchQuery = generateSearchQuery(context);
      console.log('🔍 Generated search query:', searchQuery);
      onNavigateToMarketplace(searchQuery);
      onClose();
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    const messageToSend = messageText || currentMessage.trim();
    
    if (!messageToSend || isLoading) return;

    console.log('📤 Sending message:', messageToSend);

    const userMessage: NicoleMessage = {
      role: 'user',
      content: messageToSend
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage("");
    setIsLoading(true);

    // Scroll after sending message
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
    }, 100);

    try {
      console.log('🤖 Calling chatWithNicole with context:', context);
      const response = await chatWithNicole(messageToSend, context, messages);
      console.log('✅ Received response from Nicole:', response);
      console.log('🔍 Response showSearchButton:', response.showSearchButton);
      
      const assistantMessage: NicoleMessage = {
        role: 'assistant',
        content: response.message
      };

      setMessages(prev => [...prev, assistantMessage]);
      setContext(response.context);
      
      // Enhanced search button logic with debugging
      const shouldShow = Boolean(response.showSearchButton);
      console.log('🎯 Setting showSearchButton to:', shouldShow);
      setShowSearchButton(shouldShow);
      
      // Handle grouped results
      if (response.groupedResults) {
        console.log('📊 Setting grouped results:', response.groupedResults);
        setGroupedResults(response.groupedResults);
      }

      // Handle follow-up requests
      if (response.followUpRequest) {
        console.log('🎯 Processing follow-up request:', response.followUpRequest);
      }

    } catch (error) {
      console.error('💥 Error in Nicole conversation:', error);
      const errorMessage: NicoleMessage = {
        role: 'assistant',
        content: "I'm having trouble right now. Could you try rephrasing your question?"
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowUpRequest = async (followUpMessage: string) => {
    console.log('🔄 Handling follow-up request:', followUpMessage);
    await handleSendMessage(followUpMessage);
  };

  const handleProductSelect = (product: any) => {
    console.log('Product selected:', product);
    // Handle product selection logic
  };

  const handleCategoryExpand = (categoryName: string) => {
    if (onNavigateToMarketplace) {
      const searchQuery = generateSearchQuery({
        ...context,
        interests: [categoryName]
      });
      onNavigateToMarketplace(searchQuery);
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-50 to-pink-50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Nicole</h3>
            <p className="text-xs text-gray-600">Your AI Gift Assistant</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          ×
        </Button>
      </div>

      {/* Messages - Constrained height with proper scrolling */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto"
        style={{
          height: showSearchButton 
            ? 'calc(100% - 200px)' // Header + search button + input
            : 'calc(100% - 140px)', // Header + input
          maxHeight: showSearchButton 
            ? 'calc(100% - 200px)'
            : 'calc(100% - 140px)'
        }}
      >
        <div className="p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}

          {/* Grouped Results Display */}
          {groupedResults && (
            <div className="mt-4">
              <GroupedSearchResultsComponent
                groupedResults={groupedResults}
                onProductSelect={handleProductSelect}
                onCategoryExpand={handleCategoryExpand}
                onFollowUpRequest={handleFollowUpRequest}
              />
            </div>
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                  <span className="text-sm text-gray-600">Nicole is thinking...</span>
                </div>
              </div>
            </div>
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Enhanced Search Button with Debug Info */}
      {showSearchButton && (
        <div className="p-4 border-t bg-gradient-to-r from-purple-50 to-pink-50 flex-shrink-0">
          <Button
            onClick={handleSearchInMarketplace}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Ready to See Your Gifts!
          </Button>
        </div>
      )}

      {/* Input - Fixed at bottom */}
      <div className="p-4 border-t flex-shrink-0 bg-white">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Tell me about the gift you're looking for..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={() => handleSendMessage()}
            disabled={!currentMessage.trim() || isLoading}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NicoleConversationEngine;
