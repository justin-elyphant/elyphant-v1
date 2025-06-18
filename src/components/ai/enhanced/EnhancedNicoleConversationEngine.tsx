
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
      // Enhanced context extraction with brand and age detection
      const enhancedSearchContext = generateEnhancedSearchContext(messageText);
      const relationshipInfo = EnhancedNicoleService.extractRelationshipFromMessage(messageText);
      
      // Enhanced context with brand and age information
      const enhancedContext: NicoleContext = {
        ...context,
        ...relationshipInfo,
        step: conversationStep,
        conversationPhase: context.conversationPhase || 'greeting' as ConversationPhase,
        // Add enhanced context fields
        detectedBrands: enhancedSearchContext.detectedBrands,
        interests: [...new Set([...(context.interests || []), ...enhancedSearchContext.interests])],
        ageGroup: enhancedSearchContext.ageInfo?.ageGroup,
        exactAge: enhancedSearchContext.ageInfo?.exactAge
      };

      console.log('Enhanced Nicole: Calling GPT with context:', enhancedContext);

      // Call the GPT-powered chatWithNicole function
      const response = await chatWithNicole(
        userMessage.content,
        messages,
        enhancedContext
      );

      console.log('Enhanced Nicole: GPT response received:', response);

      const assistantMessage: NicoleMessage = {
        role: "assistant",
        content: response.response
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Update context from GPT response
      setContext(response.context);

      // Update contextual links from response
      if (response.contextualLinks && response.contextualLinks.length > 0) {
        setContextualLinks(response.contextualLinks);
      } else {
        setContextualLinks([]);
      }

      // Handle search generation with enhanced query - only when GPT indicates readiness
      if (response.shouldGenerateSearch) {
        const searchQuery = generateEnhancedSearchQuery({
          recipient: response.context.recipient,
          relationship: response.context.relationship,
          occasion: response.context.occasion,
          interests: response.context.interests,
          detectedBrands: response.context.detectedBrands,
          ageGroup: response.context.ageGroup,
          exactAge: response.context.exactAge,
          budget: response.context.budget
        });
        
        console.log('Enhanced Nicole: Generated search query:', searchQuery);
        
        if (searchQuery && searchQuery !== 'gifts') {
          setTimeout(() => {
            onNavigateToResults(searchQuery);
          }, 2000);
        }
      }

    } catch (error) {
      console.error("Error chatting with Nicole:", error);
      const errorMessage: NicoleMessage = {
        role: "assistant",
        content: "I'm having trouble connecting right now. Let me help you with a basic search instead. What kind of gift are you looking for?"
      };
      setMessages(prev => [...prev, errorMessage]);
      setContextualLinks([]);
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
              <p className="text-xs text-purple-600">AI Gift Advisor</p>
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
              
              {/* Show contextual links only for the last assistant message and when appropriate */}
              {message.role === "assistant" && 
               index === messages.length - 1 && 
               contextualLinks.length > 0 && (
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
          <div className="flex space-x-2">
            <Input
              ref={inputRef}
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask Nicole anything about gifts..."
              className="flex-1"
              disabled={isLoading}
              autoFocus
            />
            <Button
              onClick={() => sendMessage()}
              disabled={!currentMessage.trim() || isLoading}
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
