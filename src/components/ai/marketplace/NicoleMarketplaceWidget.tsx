import React, { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, MessageCircle, X, Minimize2, Maximize2, Gift } from "lucide-react";
import { useUnifiedNicoleAI } from "@/hooks/useUnifiedNicoleAI";
import { NicoleMessage, NicoleContext } from "@/services/ai/nicoleAiService";
import { useAuth } from "@/contexts/auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface ConversationMessage {
  type: "nicole" | "user";
  content: string;
  timestamp: Date;
}

interface NicoleMarketplaceWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  onSearchSuggestion?: (query: string) => void;
  onMinimize?: () => void;
  isMinimized?: boolean;
  onMaximize?: () => void;
  searchQuery?: string;
  totalResults?: number;
  isFromNicole?: boolean;
  selectedProduct?: any;
}

const NicoleMarketplaceWidget: React.FC<NicoleMarketplaceWidgetProps> = ({
  isOpen,
  onClose,
  onSearchSuggestion,
  onMinimize,
  isMinimized = false,
  onMaximize,
  searchQuery,
  totalResults,
  isFromNicole,
  selectedProduct
}) => {
  const { user } = useAuth();
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [conversationHistory, setConversationHistory] = useState<NicoleMessage[]>([]);

  // Use unified Nicole AI service
  const {
    loading: isGenerating,
    context,
    chatWithNicole,
    updateContext
  } = useUnifiedNicoleAI({
    sessionId: `marketplace-nicole-${user?.id || 'anonymous'}`,
    initialContext: {
      currentUserId: user?.id,
      capability: 'marketplace_assistant',
      searchQuery: searchQuery,
      productContext: selectedProduct
    }
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  const addMessage = useCallback((message: ConversationMessage) => {
    setConversation(prev => [...prev, message]);
  }, []);

  const startConversation = useCallback(() => {
    let greetingContent = "Hi! I'm Nicole, your marketplace shopping assistant. I can help you find specific products or refine your search. What are you looking for today?";
    
    // Customize greeting based on context
    if (searchQuery && totalResults) {
      greetingContent = `Hi! I see you're searching for "${searchQuery}" and found ${totalResults} results. I can help you refine your search or find something more specific. What would you like to explore?`;
    } else if (isFromNicole) {
      greetingContent = "Hi again! I'm here to help you explore the marketplace. Based on our previous conversation, I can help you find the perfect products. What would you like to look for?";
    }
    
    const greetingMessage: ConversationMessage = {
      type: "nicole",
      content: greetingContent,
      timestamp: new Date()
    };
    addMessage(greetingMessage);
  }, [addMessage, searchQuery, totalResults, isFromNicole]);

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
      console.log('🛍️ Nicole Marketplace: Processing message', { message, context });

      // Get AI response using unified service
      const aiResponse = await chatWithNicole(message);
      
      console.log('✅ Nicole Marketplace: Received AI response', aiResponse);

      if (aiResponse) {
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

        // Handle metadata updates
        if (aiResponse.metadata?.contextUpdates) {
          updateContext(aiResponse.metadata.contextUpdates);
        }

        // Handle search generation
        if (aiResponse.searchQuery && onSearchSuggestion) {
          setTimeout(() => {
            onSearchSuggestion(aiResponse.searchQuery!);
          }, 1000);
        } else if (onSearchSuggestion) {
          // Generate a search query based on the conversation
          const searchQuery = extractSearchQuery(message, aiResponse.message);
          if (searchQuery) {
            setTimeout(() => {
              onSearchSuggestion(searchQuery);
            }, 1000);
          }
        }
      }

    } catch (error) {
      console.error('💥 Nicole Marketplace: Error in conversation', error);
      
      // Add fallback message
      const fallbackMessage: ConversationMessage = {
        type: "nicole",
        content: "I'm having trouble right now, but I can still help you search! Try describing what you're looking for and I'll suggest some search terms.",
        timestamp: new Date()
      };
      addMessage(fallbackMessage);
    } finally {
      // Loading state is managed by the hook
    }
  }, [currentMessage, addMessage, conversationHistory, context, onSearchSuggestion]);

  const extractSearchQuery = useCallback((userMessage: string, aiResponse: string): string | null => {
    // Simple search query extraction logic
    const lowerMessage = userMessage.toLowerCase();
    
    // Look for product-related keywords
    const productKeywords = ['looking for', 'need', 'want', 'searching for', 'find'];
    const hasProductIntent = productKeywords.some(keyword => lowerMessage.includes(keyword));
    
    if (hasProductIntent) {
      // Extract potential search terms
      const words = userMessage.split(' ').filter(word => word.length > 2);
      return words.slice(-3).join(' '); // Take last few words as search query
    }
    
    return null;
  }, []);

  useEffect(() => {
    if (isOpen && conversation.length === 0) {
      startConversation();
    }
  }, [isOpen, conversation.length, startConversation]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className={`w-96 bg-white shadow-2xl transition-all duration-300 ${
        isMinimized ? "h-16" : "h-[500px]"
      }`}>
        <CardHeader className="pb-2 border-b flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <Gift className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Marketplace Assistant</h3>
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
                  placeholder="What can I help you find?"
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

export default NicoleMarketplaceWidget;
