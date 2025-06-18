import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Send, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { chatWithNicole, generateSearchQuery, NicoleMessage, NicoleContext } from "@/services/ai/nicoleAiService";
import { cn } from "@/lib/utils";
import SearchButton from "./SearchButton";

interface EnhancedNicoleConversationEngineProps {
  initialQuery?: string;
  onClose: () => void;
  onNavigateToResults: (searchQuery: string) => void;
}

interface EnhancedNicoleContext extends NicoleContext {
  fromNicole?: boolean;
  searchQuery?: string;
  conversationSummary?: string;
  conversationHistory?: NicoleMessage[];
  enhancedZincApiPreserved?: boolean;
  marketplaceTransition?: boolean;
  lastNicoleMessage?: string;
  timestamp?: string;
  debugInfo?: any;
  searchCriteria?: {
    recipient?: string;
    relationship?: string;
    occasion?: string;
    exactAge?: number;
    interests?: string[];
    budget?: [number, number];
    detectedBrands?: string[];
  };
}

const EnhancedNicoleConversationEngine: React.FC<EnhancedNicoleConversationEngineProps> = ({
  initialQuery,
  onClose,
  onNavigateToResults
}) => {
  const [messages, setMessages] = useState<NicoleMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [aiContext, setAiContext] = useState<EnhancedNicoleContext>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showSearchButton, setShowSearchButton] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      setMessages([{ role: "user", content: initialQuery }]);
      setAiContext(prev => ({ ...prev, searchQuery: initialQuery }));
    } else {
      setMessages([{ role: "assistant", content: "Hi, I'm Nicole! How can I help you find the perfect gift today?" }]);
    }
  }, [initialQuery]);

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage: NicoleMessage = {
      role: "user",
      content: currentMessage.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage("");
    setIsGenerating(true);

    try {
      const response = await chatWithNicole(
        currentMessage.trim(),
        messages.concat(userMessage),
        aiContext
      );

      const nicoleResponse: NicoleMessage = {
        role: "assistant",
        content: response.response
      };
      setMessages(prev => [...prev, nicoleResponse]);
      setAiContext(response.context);
      
      // Show the search button if the AI indicates it's ready
      if (response.showSearchButton) {
        console.log('🎯 Nicole: AI indicates ready for search, showing CTA button');
        setShowSearchButton(true);
      }
    } catch (error) {
      console.error("Error in Nicole chat:", error);
      toast.error("Sorry, I had trouble connecting. Please try again.");
      setMessages(prev => [...prev, { role: "assistant", content: "I'm having a bit of trouble. Could you please rephrase your request?" }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSearchButtonClick = async () => {
    setIsGenerating(true);
    
    try {
      const searchQuery = generateSearchQuery(aiContext);
      console.log('🔍 Enhanced Nicole: Generating search with context:', aiContext);
      console.log('🔍 Generated search query:', searchQuery);
      
      // Create comprehensive context with full conversation history
      const contextToStore = {
        fromNicole: true,
        searchQuery,
        conversationSummary: `Based on our conversation, I'm searching for: ${searchQuery}`,
        conversationHistory: messages,
        enhancedZincApiPreserved: true,
        marketplaceTransition: true,
        lastNicoleMessage: messages[messages.length - 1]?.content || '',
        timestamp: new Date().toISOString(),
        originalUserQuery: searchQuery, // Store the exact search query
        debugInfo: {
          originalContext: aiContext,
          searchGenerated: searchQuery,
          messageCount: messages.length,
          hasRecipient: Boolean(aiContext.recipient),
          hasOccasion: Boolean(aiContext.occasion),
          hasInterests: Boolean(aiContext.interests?.length),
          hasBudget: Boolean(aiContext.budget),
          conversationFlow: 'homepage-to-marketplace'
        },
        searchCriteria: {
          recipient: aiContext.recipient,
          relationship: aiContext.relationship,
          occasion: aiContext.occasion,
          exactAge: aiContext.exactAge,
          interests: aiContext.interests || [],
          budget: aiContext.budget,
          detectedBrands: aiContext.detectedBrands || []
        }
      };
      
      console.log('💾 Enhanced Nicole: Storing context for marketplace:', contextToStore);
      
      // Store in multiple locations to ensure persistence
      sessionStorage.setItem('nicoleContext', JSON.stringify(contextToStore));
      localStorage.setItem('nicoleMarketplaceContext', JSON.stringify(contextToStore));
      
      // Also store a flag to indicate fresh context
      sessionStorage.setItem('nicoleFreshContext', 'true');
      
      // Navigate to marketplace with search query
      onNavigateToResults(searchQuery);
      
      // Close the conversation engine
      onClose();
      
    } catch (error) {
      console.error('❌ Enhanced Nicole: Error generating search:', error);
      toast.error("Sorry, I had trouble generating your search. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 h-96 flex flex-col shadow-xl">
        <CardContent className="p-0 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-purple-50 to-indigo-50">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/ai-avatar.png" />
                <AvatarFallback className="bg-purple-100 text-purple-700">N</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-sm text-gray-900">Nicole</h3>
                <p className="text-xs text-purple-600 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI Gift Advisor
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] px-3 py-2 rounded-lg text-sm",
                    message.role === "user"
                      ? "bg-purple-500 text-white"
                      : "bg-gray-100 text-gray-900"
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isGenerating && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-3 py-2 max-w-[80%]">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-gray-600">Nicole is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* CTA Search Button - Show when AI indicates readiness */}
            {showSearchButton && !isGenerating && (
              <div className="flex justify-center pt-2">
                <SearchButton 
                  onSearch={handleSearchButtonClick}
                  isLoading={isGenerating}
                />
              </div>
            )}
          </div>

          {/* Input - Only show if search button is not active */}
          {!showSearchButton && (
            <div className="p-3 border-t">
              <div className="flex space-x-2">
                <Input
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  className="flex-1 text-sm"
                  disabled={isGenerating}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim() || isGenerating}
                  size="sm"
                  className="bg-purple-500 hover:bg-purple-600"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedNicoleConversationEngine;
