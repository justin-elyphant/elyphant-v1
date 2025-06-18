import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Send, X } from "lucide-react";
import { chatWithNicole, NicoleMessage, NicoleContext, ConversationPhase, UserIntent } from "@/services/ai/nicoleAiService";
import { EnhancedNicoleService } from "@/services/ai/enhancedNicoleService";
import { useAuth } from "@/contexts/auth";
import { cn } from "@/lib/utils";
import ContextualLinks from "../conversation/ContextualLinks";
import { generateEnhancedSearchContext } from "@/components/marketplace/zinc/utils/search/enhancedProductFiltering";
import { generateEnhancedSearchQuery } from "@/components/marketplace/zinc/utils/search/enhancedQueryGeneration";
import SearchButton from "./SearchButton";

interface EnhancedNicoleConversationEngineProps {
  initialQuery?: string;
  onClose: () => void;
  onNavigateToResults: (searchQuery: string) => void;
}

const EnhancedNicoleConversationEngine: React.FC<EnhancedNicoleConversationEngineProps> = ({
  initialQuery = "",
  onClose,
  onNavigateToResults
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<NicoleMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState<NicoleContext>({});
  const [conversationStep, setConversationStep] = useState<string>("greeting");
  const [hasProcessedInitialQuery, setHasProcessedInitialQuery] = useState(false);
  const [contextualLinks, setContextualLinks] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showSearchButton, setShowSearchButton] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (inputRef.current && !isLoading) {
      inputRef.current.focus();
    }
  }, [isLoading, messages]);

  useEffect(() => {
    if (initialQuery && initialQuery.trim() && !hasProcessedInitialQuery) {
      if (initialQuery.startsWith("Hi ")) {
        const greetingMessage: NicoleMessage = {
          role: "assistant",
          content: initialQuery
        };
        setMessages([greetingMessage]);
        setConversationStep("discovery");
      } else {
        setCurrentMessage(initialQuery);
        setTimeout(() => {
          sendMessage(initialQuery);
        }, 500);
      }
      setHasProcessedInitialQuery(true);
    } else if (!initialQuery && !hasProcessedInitialQuery) {
      const userName = user?.user_metadata?.name?.split(' ')[0] || "there";
      const welcomeMessage: NicoleMessage = {
        role: "assistant",
        content: `Hi ${userName}! I'm Nicole, your AI gift advisor. I'm here to help you find the perfect gifts. What are you looking for today?`
      };
      setMessages([welcomeMessage]);
      setConversationStep("discovery");
      setHasProcessedInitialQuery(true);
    }
  }, [initialQuery, user, hasProcessedInitialQuery]);

  const sendMessage = async (messageContent?: string) => {
    const messageText = messageContent || currentMessage;
    if (!messageText.trim() || isLoading) return;

    const userMessage: NicoleMessage = {
      role: "user",
      content: messageText.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    if (!messageContent) setCurrentMessage("");
    setIsLoading(true);

    try {
      // Enhanced context extraction with improved relationship detection (preserve Enhanced Zinc API)
      const enhancedSearchContext = generateEnhancedSearchContext(messageText);
      const relationshipInfo = EnhancedNicoleService.extractRelationshipFromMessage(messageText);
      
      // Build comprehensive context for GPT with Enhanced Zinc API integration
      const enhancedContext: NicoleContext = {
        ...context,
        ...relationshipInfo,
        step: conversationStep,
        conversationPhase: context.conversationPhase || 'greeting' as ConversationPhase,
        // Enhanced Zinc API System fields
        detectedBrands: enhancedSearchContext.detectedBrands,
        interests: [...new Set([...(context.interests || []), ...enhancedSearchContext.interests])],
        ageGroup: enhancedSearchContext.ageInfo?.ageGroup,
        exactAge: enhancedSearchContext.ageInfo?.exactAge
      };

      console.log('Enhanced Nicole: Sending comprehensive context to GPT with CTA button system:', enhancedContext);

      // Call the enhanced GPT-powered chatWithNicole function with CTA button support
      const response = await chatWithNicole(
        userMessage.content,
        messages,
        enhancedContext
      ) as any; // Cast to include showSearchButton

      console.log('Enhanced Nicole: GPT response with CTA button system and Enhanced Zinc integration:', response);

      const assistantMessage: NicoleMessage = {
        role: "assistant",
        content: response.response
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Update context from merged response
      setContext(response.context);

      // Update contextual links
      if (response.contextualLinks && response.contextualLinks.length > 0) {
        setContextualLinks(response.contextualLinks);
      } else {
        setContextualLinks([]);
      }

      // Handle CTA button display
      if (response.showSearchButton) {
        console.log('Enhanced Nicole: Showing CTA search button');
        setShowSearchButton(true);
      }

    } catch (error) {
      console.error("Enhanced Nicole: Error in GPT chat with Enhanced Zinc integration and CTA button:", error);
      const errorMessage: NicoleMessage = {
        role: "assistant",
        content: "I'm having trouble connecting right now. Let me help you with a basic search instead. What kind of gift are you looking for?"
      };
      setMessages(prev => [...prev, errorMessage]);
      setContextualLinks([]);
      setShowSearchButton(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSearchButtonClick = () => {
    console.log('Enhanced Nicole: CTA search button clicked, generating Enhanced Zinc API search');
    setShowSearchButton(false);
    setIsLoading(true);

    try {
      // Generate Enhanced Zinc API search query from context
      const searchQuery = generateEnhancedSearchQuery({
        recipient: context.recipient,
        relationship: context.relationship,
        occasion: context.occasion,
        interests: context.interests,
        detectedBrands: context.detectedBrands,
        ageGroup: context.ageGroup,
        exactAge: context.exactAge,
        budget: context.budget
      });
      
      console.log('Enhanced Nicole: Generated Enhanced Zinc search query via CTA button:', searchQuery);
      
      if (searchQuery && searchQuery !== 'gifts') {
        // Add Nicole context to session storage for marketplace continuation
        const nicoleContext = {
          searchQuery,
          context: context,
          conversationSummary: `I helped you find ${searchQuery}`,
          shouldContinueConversation: true,
          fromCTAButton: true
        };
        
        sessionStorage.setItem('nicoleContext', JSON.stringify(nicoleContext));
        
        // Navigate to marketplace with Enhanced Zinc API search immediately
        console.log('Enhanced Nicole: Navigating to Enhanced Zinc API results via CTA button:', searchQuery);
        
        // Show loading message
        const loadingMessage: NicoleMessage = {
          role: "assistant",
          content: "Perfect! I'm finding the best gift options for you right now..."
        };
        setMessages(prev => [...prev, loadingMessage]);
        
        // Navigate quickly with CTA button
        setTimeout(() => {
          console.log('Enhanced Nicole: Executing CTA navigation callback');
          onNavigateToResults(searchQuery);
        }, 300); // Very fast navigation for button clicks
      } else {
        console.log('Enhanced Nicole: Search query was empty or generic, not navigating');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Enhanced Nicole: Error in CTA button search generation:', error);
      setIsLoading(false);
      setShowSearchButton(true);
    }
  };

  // Enhanced confirmation indicator with better detection
  const showConfirmationHint = context.conversationPhase === 'ready_to_search' && !context.shouldNavigateToMarketplace;

  return (
    <Card className="h-full max-h-96 flex flex-col">
      <CardContent className="p-0 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/ai-avatar.png" />
              <AvatarFallback className="bg-purple-100 text-purple-700">N</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-gray-900">Nicole</h3>
              <p className="text-xs text-purple-600">
                {showConfirmationHint ? "Ready to search - confirm details" : 
                 context.shouldNavigateToMarketplace ? "Preparing your results..." : 
                 "AI Gift Advisor"}
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
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {messages.map((message, index) => (
            <div key={index}>
              <div
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-xs px-3 py-2 rounded-lg text-sm",
                    message.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-900"
                  )}
                >
                  {message.content}
                </div>
              </div>
              
              {/* Show CTA button after last assistant message when ready */}
              {message.role === "assistant" && 
               index === messages.length - 1 && 
               showSearchButton && !isLoading && (
                <div className="flex justify-start mt-3">
                  <div className="max-w-xs w-full">
                    <SearchButton 
                      onSearch={handleSearchButtonClick}
                      isLoading={false}
                    />
                  </div>
                </div>
              )}
              
              {/* Show contextual links for last assistant message */}
              {message.role === "assistant" && 
               index === messages.length - 1 && 
               contextualLinks.length > 0 && 
               !showSearchButton && (
                <div className="flex justify-start">
                  <div className="max-w-xs">
                    <ContextualLinks links={contextualLinks} />
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 px-3 py-2 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t">
          {showSearchButton && (
            <div className="mb-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
              🎁 Ready to find your perfect gifts! Click the button above.
            </div>
          )}
          {showConfirmationHint && (
            <div className="mb-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
              💡 Say "sounds good" or "yes" to see your gift recommendations
            </div>
          )}
          {context.shouldNavigateToMarketplace && (
            <div className="mb-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
              🎁 Preparing your personalized gift recommendations...
            </div>
          )}
          <div className="flex space-x-2">
            <Input
              ref={inputRef}
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                showSearchButton ? "Click 'Ready to See Gifts' above!" :
                showConfirmationHint ? "Say 'sounds good' to confirm..." : 
                context.shouldNavigateToMarketplace ? "Navigating to your results..." :
                "Ask Nicole anything about gifts..."
              }
              className="flex-1"
              disabled={isLoading || showSearchButton}
              autoFocus
            />
            <Button
              onClick={() => sendMessage()}
              disabled={!currentMessage.trim() || isLoading || showSearchButton}
              size="sm"
              className="bg-purple-500 hover:bg-purple-600"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedNicoleConversationEngine;
