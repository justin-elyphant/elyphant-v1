
import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Send, Sparkles, X, ShoppingCart } from "lucide-react";
import { chatWithNicole, NicoleMessage, NicoleContext } from "@/services/ai/nicoleAiService";
import { useAuth } from "@/contexts/auth";
import { cn } from "@/lib/utils";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-execute initial query
  useEffect(() => {
    if (initialQuery && initialQuery.trim() && !hasProcessedInitialQuery) {
      if (initialQuery.startsWith("Hi ")) {
        // This is a personalized greeting - show it as Nicole's message
        const greetingMessage: NicoleMessage = {
          role: "assistant",
          content: initialQuery
        };
        setMessages([greetingMessage]);
        setConversationStep("discovery");
      } else {
        // Regular initial query - auto-send it
        setCurrentMessage(initialQuery);
        setTimeout(() => {
          handleSendMessage(initialQuery);
        }, 500);
      }
      setHasProcessedInitialQuery(true);
    } else if (!initialQuery && !hasProcessedInitialQuery) {
      // Default greeting
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

  const handleSendMessage = async (messageContent?: string) => {
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
      // Enhanced context with conversation step
      const enhancedContext = {
        ...context,
        step: conversationStep,
        conversationPhase: conversationStep
      };

      const response = await chatWithNicole(
        userMessage.content,
        messages,
        enhancedContext
      );

      const assistantMessage: NicoleMessage = {
        role: "assistant",
        content: response.response
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Update context based on response
      updateContextFromMessage(userMessage.content, response);

      // Handle search generation if Nicole suggests it
      if (response.shouldGenerateSearch) {
        const searchQuery = extractSearchQuery(response.response, context);
        if (searchQuery) {
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
    } finally {
      setIsLoading(false);
    }
  };

  const updateContextFromMessage = (userMessage: string, response: any) => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Extract recipient information
    if (lowerMessage.includes('mom') || lowerMessage.includes('mother')) {
      setContext(prev => ({ ...prev, recipient: 'mom', relationship: 'family' }));
    } else if (lowerMessage.includes('dad') || lowerMessage.includes('father')) {
      setContext(prev => ({ ...prev, recipient: 'dad', relationship: 'family' }));
    } else if (lowerMessage.includes('friend')) {
      setContext(prev => ({ ...prev, relationship: 'friend' }));
    } else if (lowerMessage.includes('wife') || lowerMessage.includes('husband')) {
      setContext(prev => ({ ...prev, relationship: 'spouse' }));
    }

    // Extract occasion information
    if (lowerMessage.includes('birthday')) {
      setContext(prev => ({ ...prev, occasion: 'birthday' }));
    } else if (lowerMessage.includes('christmas') || lowerMessage.includes('holiday')) {
      setContext(prev => ({ ...prev, occasion: 'christmas' }));
    } else if (lowerMessage.includes('anniversary')) {
      setContext(prev => ({ ...prev, occasion: 'anniversary' }));
    }

    // Extract budget information
    const budgetMatch = lowerMessage.match(/\$(\d+)/);
    if (budgetMatch) {
      const budget = parseInt(budgetMatch[1]);
      setContext(prev => ({ ...prev, budget: [budget * 0.8, budget * 1.2] }));
    }

    // Extract interests
    const interests: string[] = [];
    if (lowerMessage.includes('cooking') || lowerMessage.includes('kitchen')) {
      interests.push('cooking');
    }
    if (lowerMessage.includes('reading') || lowerMessage.includes('books')) {
      interests.push('reading');
    }
    if (lowerMessage.includes('fitness') || lowerMessage.includes('exercise')) {
      interests.push('fitness');
    }
    if (lowerMessage.includes('tech') || lowerMessage.includes('gadget')) {
      interests.push('technology');
    }
    
    if (interests.length > 0) {
      setContext(prev => ({ ...prev, interests }));
    }

    // Update conversation step based on context completeness
    if (context.recipient && context.occasion) {
      setConversationStep("preferences");
    } else if (context.recipient || context.relationship) {
      setConversationStep("occasion");
    }
  };

  const extractSearchQuery = (response: string, context: NicoleContext): string => {
    // Generate search query from context
    let query = "";
    
    if (context.recipient) {
      query += `gifts for ${context.recipient}`;
    } else if (context.relationship) {
      query += `gifts for ${context.relationship}`;
    } else {
      query = "gifts";
    }
    
    if (context.occasion) {
      query += ` ${context.occasion}`;
    }
    
    if (context.interests && context.interests.length > 0) {
      query += ` ${context.interests.join(" ")}`;
    }
    
    if (context.budget) {
      const [min, max] = context.budget;
      query += ` under $${max}`;
    }
    
    return query.trim() || "gifts";
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickResponses = [
    "I need a gift for my mom",
    "Birthday gift ideas",
    "Gifts under $50",
    "Anniversary presents"
  ];

  const handleQuickResponse = (response: string) => {
    setCurrentMessage(response);
    setTimeout(() => handleSendMessage(response), 100);
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
            <div
              key={index}
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

        {/* Quick Responses */}
        {messages.length <= 1 && !isLoading && (
          <div className="px-4 pb-2">
            <div className="flex flex-wrap gap-2">
              {quickResponses.map((response, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => handleQuickResponse(response)}
                >
                  {response}
                </Button>
              ))}
            </div>
          </div>
        )}

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
            />
            <Button
              onClick={() => handleSendMessage()}
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
