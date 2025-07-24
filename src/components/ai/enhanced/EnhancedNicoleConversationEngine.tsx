
import React, { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, MessageCircle, X, Minimize2, Maximize2 } from "lucide-react";
import { useUnifiedNicoleAI } from "@/hooks/useUnifiedNicoleAI";
import { NicoleMessage, NicoleContext, ConversationPhase } from "@/services/ai/nicoleAiService";
import { useAuth } from "@/contexts/auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import SearchButton from "./SearchButton";
import { useNavigate } from "react-router-dom";
import { generateEnhancedSearchQuery } from "@/services/ai/enhancedSearchQueryGenerator";

interface ConversationMessage {
  type: "nicole" | "user";
  content: string;
  timestamp: Date;
}

interface EnhancedNicoleContext extends NicoleContext {
  conversationPhase?: ConversationPhase;
  detectedBrands?: string[];
  ageGroup?: string;
}

interface EnhancedNicoleConversationProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  onMinimize?: () => void;
  isMinimized?: boolean;
  onMaximize?: () => void;
}

const EnhancedNicoleConversationEngine: React.FC<EnhancedNicoleConversationProps> = ({
  isOpen,
  onClose,
  initialQuery,
  onMinimize,
  isMinimized = false,
  onMaximize
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [conversationHistory, setConversationHistory] = useState<NicoleMessage[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Use unified Nicole AI service
  const {
    loading: isGenerating,
    context,
    chatWithNicole,
    generateSearchQuery,
    isReadyToSearch,
    updateContext
  } = useUnifiedNicoleAI({
    sessionId: `enhanced-nicole-${user?.id || 'anonymous'}`,
    initialContext: {
      currentUserId: user?.id
    }
  });

  const [showCTAButton, setShowCTAButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  useEffect(() => {
    if (initialQuery && conversation.length === 0) {
      handleSendMessage(initialQuery);
    }
  }, [initialQuery]);

  const addMessage = useCallback((message: ConversationMessage) => {
    setConversation(prev => [...prev, message]);
  }, []);

  // Simplified context extraction from user messages
  const extractContextFromMessage = useCallback((message: string, currentContext: EnhancedNicoleContext): EnhancedNicoleContext => {
    const lowerMessage = message.toLowerCase();
    let updatedContext = { ...currentContext };

    // Basic relationship detection
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
        break;
      }
    }

    // Basic occasion detection
    if (lowerMessage.includes('birthday')) updatedContext.occasion = 'birthday';
    if (lowerMessage.includes('christmas')) updatedContext.occasion = 'christmas';
    if (lowerMessage.includes('anniversary')) updatedContext.occasion = 'anniversary';

    // Basic interest detection
    const interests = ['yoga', 'cooking', 'fitness', 'reading', 'music', 'art', 'sports', 'gaming', 'travel'];
    const foundInterests = interests.filter(interest => lowerMessage.includes(interest));
    if (foundInterests.length > 0) {
      updatedContext.interests = [...new Set([...(updatedContext.interests || []), ...foundInterests])];
    }

    return updatedContext;
  }, []);

  const startConversation = useCallback(() => {
    const greetingMessage: ConversationMessage = {
      type: "nicole",
      content: "Hi! I'm Nicole, your AI gift advisor. I'm here to help you find the perfect gift. What can I help you find today?",
      timestamp: new Date()
    };
    addMessage(greetingMessage);
  }, [addMessage]);

  const handleSendMessage = useCallback(async (messageText?: string) => {
    const message = messageText || currentMessage.trim();
    if (!message) return;

    // Add user message
    const userMessage: ConversationMessage = {
      type: "user",
      content: message,
      timestamp: new Date()
    };
    addMessage(userMessage);

    // Update conversation history for AI
    const userAiMessage: NicoleMessage = {
      role: "user",
      content: message
    };
    setConversationHistory(prev => [...prev, userAiMessage]);

    setCurrentMessage("");

    try {
      // Extract context from user message (as backup)
      const extractedContext = extractContextFromMessage(message, context as any);
      if (extractedContext) {
        updateContext(extractedContext);
      }

      console.log('🔄 Enhanced Nicole: Sending message with context', {
        message,
        context: extractedContext,
        conversationHistory: conversationHistory.length
      });

      // Get AI response
      const aiResponse = await chatWithNicole(message);
      
      console.log('✅ Enhanced Nicole: Received AI response', aiResponse);
      console.log('🎯 CTA Button Debug - showSearchButton from API:', aiResponse.showSearchButton);

      // Add Nicole's response
      const nicoleMessage: ConversationMessage = {
        type: "nicole",
        content: aiResponse.message,
        timestamp: new Date()
      };
      addMessage(nicoleMessage);

      // Update conversation history
      const nicoleAiMessage: NicoleMessage = {
        role: "assistant",
        content: aiResponse.message
      };
      setConversationHistory(prev => [...prev, nicoleAiMessage]);

      // Update context if needed
      if (aiResponse.metadata?.contextUpdates) {
        updateContext(aiResponse.metadata.contextUpdates);
      }

      // Use ONLY the AI's decision for showing the CTA button
      const shouldShowButton = aiResponse.showSearchButton === true;
      console.log('🎯 CTA Button Debug - Setting showCTAButton to:', shouldShowButton);
      setShowCTAButton(shouldShowButton);

    } catch (error) {
      console.error('💥 Enhanced Nicole: Error in conversation', error);
      
      // Add fallback message
      const fallbackMessage: ConversationMessage = {
        type: "nicole",
        content: "I'm having trouble connecting right now, but I'd love to help you find the perfect gift! Could you tell me a bit more about what you're looking for?",
        timestamp: new Date()
      };
      addMessage(fallbackMessage);
    } finally {
      // Loading state is managed by the hook
    }
  }, [currentMessage, addMessage, conversationHistory, context, extractContextFromMessage]);

  const handleSearchClick = useCallback(async () => {
    setIsSearching(true);
    
    try {
      console.log('🔍 Enhanced Nicole: Generating search query from context', context);
      
      // Generate search query using unified service
      const searchQuery = generateSearchQuery();
      
      console.log('🎯 Enhanced Nicole: Generated search query:', searchQuery);
      
      // Navigate to marketplace with search query
      navigate(`/marketplace?search=${encodeURIComponent(searchQuery)}`);
      
      // Close the conversation
      onClose();
      
    } catch (error) {
      console.error('💥 Enhanced Nicole: Error generating search', error);
    } finally {
      setIsSearching(false);
    }
  }, [context, navigate, onClose]);

  useEffect(() => {
    if (isOpen && conversation.length === 0 && !initialQuery) {
      startConversation();
    }
  }, [isOpen, conversation.length, initialQuery, startConversation]);

  // Debug effect to monitor CTA button state
  useEffect(() => {
    console.log('🎯 CTA Button State Changed:', showCTAButton);
  }, [showCTAButton]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className={`w-96 bg-white shadow-2xl transition-all duration-300 ${
        isMinimized ? "h-16" : "h-[500px]"
      }`}>
        <CardHeader className="pb-2 border-b flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Nicole - AI Gift Advisor</h3>
          </div>
          <div className="flex items-center space-x-2">
            {onMinimize && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMinimize}
                className="h-8 w-8 p-0"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
            )}
            {isMinimized && onMaximize && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMaximize}
                className="h-8 w-8 p-0"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        {!isMinimized && (
          <>
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-[360px] p-4">
                <div className="space-y-4">
                  {conversation.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          msg.type === "user"
                            ? "bg-purple-600 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {showCTAButton && (
                    <div className="flex justify-center py-4">
                      <SearchButton 
                        onSearch={handleSearchClick}
                        isLoading={isSearching}
                      />
                    </div>
                  )}
                  
                  {isGenerating && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 text-gray-900 p-3 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Nicole is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div ref={messagesEndRef} />
              </ScrollArea>
            </CardContent>

            <div className="p-4 border-t">
              <div className="flex items-center space-x-2">
                <Input
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder="Tell me about your gift recipient..."
                  className="flex-1"
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={isGenerating}
                />
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={isGenerating || !currentMessage.trim()}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default EnhancedNicoleConversationEngine;
