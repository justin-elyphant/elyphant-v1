import React, { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, MessageCircle, Search, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth";
import { useUnifiedNicoleAI } from "@/hooks/useUnifiedNicoleAI";
import { generateEnhancedSearchQuery } from "@/services/ai/enhancedSearchQueryGenerator";
import { useSearchParams } from "react-router-dom";
import { getNicoleGreeting, getGreetingFromUrl } from "@/utils/nicoleGreetings";

interface ConversationMessage {
  type: "nicole" | "user";
  content: string;
  timestamp: Date;
}

interface UnifiedNicoleConversationProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToResults: (searchQuery: string) => void;
  initialQuery?: string;
  mobile?: boolean;
}

const UnifiedNicoleConversation: React.FC<UnifiedNicoleConversationProps> = ({
  isOpen,
  onClose,
  onNavigateToResults,
  initialQuery,
  mobile = false
}) => {
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use the unified Nicole AI hook - respecting protection measures
  const {
    chatWithNicole,
    loading,
    context,
    isReadyToSearch,
    generateSearchQuery,
    clearConversation
  } = useUnifiedNicoleAI({
    sessionId: `search-${Date.now()}`,
    initialContext: {
      conversationPhase: 'greeting',
      capability: 'conversation',
      interests: [],
      detectedBrands: [],
      currentUserId: user?.id
    }
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  // Handle initial query if provided
  useEffect(() => {
    if (initialQuery && conversation.length === 0) {
      handleSendMessage(initialQuery);
    }
  }, [initialQuery]);

  // Start conversation with greeting when opened
  useEffect(() => {
    if (isOpen && conversation.length === 0 && !initialQuery) {
      // Get greeting context from URL and user data
      const greetingContext = {
        ...getGreetingFromUrl(searchParams),
        userProfile: user,
        activeMode: 'floating'
      };
      
      const greetingMessage: ConversationMessage = {
        type: "nicole",
        content: getNicoleGreeting(greetingContext),
        timestamp: new Date()
      };
      setConversation([greetingMessage]);
    }
  }, [isOpen, conversation.length, initialQuery, searchParams, user]);

  const addMessage = useCallback((message: ConversationMessage) => {
    setConversation(prev => [...prev, message]);
  }, []);

  const handleSendMessage = useCallback(async (messageText?: string) => {
    const message = messageText || currentMessage.trim();
    if (!message) return;

    // Add user message to conversation
    const userMessage: ConversationMessage = {
      type: "user",
      content: message,
      timestamp: new Date()
    };
    addMessage(userMessage);
    setCurrentMessage("");

    try {
      // Use unified Nicole AI - respecting protection measures
      const response = await chatWithNicole(message);
      
      if (response) {
        // Add Nicole's response to conversation
        const nicoleMessage: ConversationMessage = {
          type: "nicole",
          content: response.message,
          timestamp: new Date()
        };
        addMessage(nicoleMessage);
      }
    } catch (error) {
      console.error('Error in Nicole conversation:', error);
      
      // Fallback message
      const fallbackMessage: ConversationMessage = {
        type: "nicole",
        content: "I'm having trouble connecting right now, but I'd love to help you find the perfect gift! Could you tell me a bit more about what you're looking for?",
        timestamp: new Date()
      };
      addMessage(fallbackMessage);
    }
  }, [currentMessage, addMessage, chatWithNicole]);

  const handleSearchClick = useCallback(async () => {
    try {
      // Generate optimized search query using unified Nicole context
      const searchQuery = generateEnhancedSearchQuery({
        recipient: context.recipient,
        relationship: context.relationship,
        occasion: context.occasion,
        exactAge: context.exactAge,
        interests: context.interests,
        budget: context.budget,
        detectedBrands: context.detectedBrands
      });
      
      console.log('🎯 Unified Nicole: Generated search query:', searchQuery);
      
      // Navigate to marketplace results
      onNavigateToResults(searchQuery);
      
    } catch (error) {
      console.error('Error generating search from unified Nicole:', error);
      // Fallback to context-based query
      const fallbackQuery = generateSearchQuery();
      onNavigateToResults(fallbackQuery);
    }
  }, [context, onNavigateToResults, generateSearchQuery]);

  if (!isOpen) return null;

  return (
    <Card className={`bg-white shadow-xl border-purple-200 transition-all duration-300 ${
      mobile ? "h-[400px] w-full rounded-t-lg" : "h-[500px] w-96 rounded-lg"
    }`}>
      <CardHeader className="pb-2 border-b border-purple-100">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <MessageCircle className="h-5 w-5 text-purple-600" />
            <Sparkles className="h-4 w-4 text-purple-500 animate-pulse" />
          </div>
          <h3 className="font-semibold text-gray-900">Nicole - Your Gift Guru</h3>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 flex flex-col">
        <ScrollArea className={`flex-1 p-4 ${mobile ? "max-h-[250px]" : "max-h-[350px]"}`}>
          <div className="space-y-4">
            {conversation.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg transition-all duration-200 ${
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
            
            {/* Search button when Nicole is ready */}
            {isReadyToSearch() && (
              <div className="flex justify-center py-4">
                <Button
                  onClick={handleSearchClick}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium px-6 py-2 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Find Perfect Gifts
                  <Sparkles className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
            
            {/* Loading indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-purple-50 text-purple-700 p-3 rounded-lg border border-purple-200">
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

        {/* Input area */}
        <div className="p-4 border-t border-purple-100">
          <div className="flex items-center space-x-2">
            <Input
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder="Tell me about your gift recipient..."
              className="flex-1 border-purple-200 focus:border-purple-500 focus:ring-purple-500"
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={loading}
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={loading || !currentMessage.trim()}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UnifiedNicoleConversation;