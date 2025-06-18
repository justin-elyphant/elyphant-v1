
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, X, Sparkles, Send } from "lucide-react";
import { NicoleMessage, NicoleContext, chatWithNicole } from "@/services/ai/nicoleAiService";
import { cn } from "@/lib/utils";

interface NicoleMarketplaceWidgetProps {
  searchQuery: string;
  totalResults: number;
  isFromNicole?: boolean;
}

interface EnhancedNicoleContext {
  fromNicole: boolean;
  searchQuery: string;
  conversationSummary: string;
  conversationHistory: NicoleMessage[];
  enhancedZincApiPreserved: boolean;
  marketplaceTransition: boolean;
  lastNicoleMessage?: string;
  searchCriteria: {
    recipient?: string;
    relationship?: string;
    occasion?: string;
    exactAge?: number;
    interests?: string[];
    budget?: [number, number];
    detectedBrands?: string[];
  };
}

const NicoleMarketplaceWidget: React.FC<NicoleMarketplaceWidgetProps> = ({
  searchQuery,
  totalResults,
  isFromNicole = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<NicoleMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [nicoleContext, setNicoleContext] = useState<EnhancedNicoleContext | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [aiContext, setAiContext] = useState<NicoleContext>({});

  useEffect(() => {
    // Check if Nicole brought the user here with Enhanced Zinc API context
    const storedContext = sessionStorage.getItem('nicoleContext');
    if (storedContext || isFromNicole) {
      try {
        const context: EnhancedNicoleContext = storedContext ? JSON.parse(storedContext) : {
          fromNicole: true,
          searchQuery,
          conversationSummary: `I found ${totalResults} options for your search`,
          conversationHistory: [],
          enhancedZincApiPreserved: true,
          marketplaceTransition: true,
          searchCriteria: {}
        };
        
        setNicoleContext(context);
        
        // Reconstruct AI context from stored search criteria for Enhanced Zinc API continuity
        setAiContext({
          recipient: context.searchCriteria.recipient,
          relationship: context.searchCriteria.relationship,
          occasion: context.searchCriteria.occasion,
          exactAge: context.searchCriteria.exactAge,
          interests: context.searchCriteria.interests,
          budget: context.searchCriteria.budget,
          detectedBrands: context.searchCriteria.detectedBrands,
          conversationPhase: 'providing_suggestions',
          hasReceivedSuggestions: true,
          shouldNavigateToMarketplace: false
        });
        
        // Auto-expand and show contextual initial message
        setIsExpanded(true);
        
        // Generate a smart contextual message based on the Enhanced Zinc API context
        const contextualMessage = generateContextualMessage(context, totalResults, searchQuery);
        
        const initialMessage: NicoleMessage = {
          role: "assistant",
          content: contextualMessage
        };
        
        setMessages([initialMessage]);
        
        // Clear the context after using it so it doesn't auto-show again
        if (storedContext) {
          sessionStorage.removeItem('nicoleContext');
        }
      } catch (error) {
        console.error('Error parsing Nicole context:', error);
        // Fallback for Enhanced Zinc API preservation
        setIsExpanded(true);
        const fallbackMessage: NicoleMessage = {
          role: "assistant",
          content: `Great! I found ${totalResults} ${searchQuery} for you. What do you think of these options?`
        };
        setMessages([fallbackMessage]);
      }
    }
  }, [searchQuery, totalResults, isFromNicole]);

  const generateContextualMessage = (context: EnhancedNicoleContext, results: number, query: string): string => {
    const { searchCriteria, conversationSummary } = context;
    const parts = [];
    
    // Reference the specific conversation details
    if (searchCriteria.recipient && searchCriteria.relationship) {
      if (searchCriteria.occasion) {
        parts.push(`Perfect! I found ${results} great options for your ${searchCriteria.recipient}'s ${searchCriteria.occasion}`);
      } else {
        parts.push(`Perfect! I found ${results} great options for your ${searchCriteria.recipient}`);
      }
    } else {
      parts.push(`Great! I found ${results} options based on our conversation`);
    }
    
    // Add age context if available
    if (searchCriteria.exactAge) {
      parts.push(`(turning ${searchCriteria.exactAge})`);
    }
    
    // Reference interests if discussed
    if (searchCriteria.interests && searchCriteria.interests.length > 0) {
      const mainInterests = searchCriteria.interests.slice(0, 2);
      parts.push(`Since they love ${mainInterests.join(' and ')}, I think you'll find some perfect matches here.`);
    }
    
    // Reference budget if discussed
    if (searchCriteria.budget) {
      parts.push(`All within your $${searchCriteria.budget[0]}-$${searchCriteria.budget[1]} budget.`);
    }
    
    parts.push("What do you think of these options? Are you seeing anything that catches your eye?");
    
    return parts.join(' ');
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage: NicoleMessage = {
      role: "user",
      content: currentMessage.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage("");
    setIsLoading(true);

    try {
      // Use the Enhanced Zinc API service to maintain context continuity
      const response = await chatWithNicole(
        currentMessage.trim(),
        messages.concat(userMessage),
        {
          ...aiContext,
          conversationPhase: 'providing_suggestions',
          hasReceivedSuggestions: true,
          shouldNavigateToMarketplace: false
        }
      );

      const nicoleResponse: NicoleMessage = {
        role: "assistant",
        content: response.response
      };
      
      setMessages(prev => [...prev, nicoleResponse]);
      
      // Update AI context to preserve Enhanced Zinc API state
      setAiContext(response.context);
      
    } catch (error) {
      console.error('Error in marketplace Nicole chat:', error);
      
      // Fallback responses that reference the Enhanced Zinc API context
      const fallbackResponses = [
        `I can help you narrow down these ${totalResults} options! What's most important to you - price, brand, or specific features?`,
        "Would you like me to filter these results by a specific price range or brand?",
        "I notice there are several great options here. Are you looking for something more specific?",
        "These look like great choices! Do any of these match what you had in mind from our conversation?"
      ];
      
      const response: NicoleMessage = {
        role: "assistant",
        content: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]
      };
      
      setMessages(prev => [...prev, response]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!nicoleContext && !isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsExpanded(true)}
          className="bg-purple-500 hover:bg-purple-600 rounded-full w-12 h-12 shadow-lg"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    );
  }

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
                  {nicoleContext?.enhancedZincApiPreserved ? 'Enhanced gift advisor' : 'Here to help with your search'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
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
            
            {/* Loading indicator */}
            {isLoading && (
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
          </div>

          {/* Input */}
          <div className="p-3 border-t">
            <div className="flex space-x-2">
              <Input
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask Nicole about these results..."
                className="flex-1 text-sm"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
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
    </div>
  );
};

export default NicoleMarketplaceWidget;
