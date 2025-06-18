
import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Send, Sparkles, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { chatWithNicole, generateSearchQuery, NicoleMessage, NicoleContext } from "@/services/ai/nicoleAiService";
import SearchButton from "./SearchButton";

interface EnhancedNicoleConversationEngineProps {
  initialQuery?: string;
  onClose: () => void;
  onNavigateToResults: (searchQuery: string) => void;
}

interface ConversationMessage {
  type: "nicole" | "user";
  content: string;
  timestamp: Date;
  showSearchButton?: boolean;
}

const EnhancedNicoleConversationEngine: React.FC<EnhancedNicoleConversationEngineProps> = ({
  initialQuery,
  onClose,
  onNavigateToResults
}) => {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState<NicoleContext>({});
  const [conversationHistory, setConversationHistory] = useState<NicoleMessage[]>([]);
  const [showSearchButton, setShowSearchButton] = useState(false);
  const isMobile = useIsMobile();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages, showSearchButton]);

  // Initialize conversation
  useEffect(() => {
    const initializeConversation = async () => {
      if (initialQuery) {
        await sendMessage(initialQuery);
      } else {
        // Start with a greeting
        const greetingMessage: ConversationMessage = {
          type: "nicole",
          content: "Hi! I'm Nicole, your AI gift advisor. I'll help you find the perfect gift. Who are you shopping for today?",
          timestamp: new Date()
        };
        setMessages([greetingMessage]);
      }
    };

    initializeConversation();
  }, [initialQuery]);

  const sendMessage = async (messageContent?: string) => {
    const content = messageContent || currentMessage.trim();
    if (!content) return;

    // Add user message
    const userMessage: ConversationMessage = {
      type: "user",
      content: content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage("");
    setIsLoading(true);
    setShowSearchButton(false); // Hide button while processing

    try {
      // Call Nicole's AI service
      const response = await chatWithNicole(content, conversationHistory, context);
      
      // Update conversation history
      const newUserMessage: NicoleMessage = { role: "user", content };
      const newNicoleMessage: NicoleMessage = { role: "assistant", content: response.response };
      setConversationHistory(prev => [...prev, newUserMessage, newNicoleMessage]);
      
      // Update context
      setContext(response.context);

      // Add Nicole's response
      const nicoleMessage: ConversationMessage = {
        type: "nicole",
        content: response.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, nicoleMessage]);

      // Check if we should show the search button
      if (response.showSearchButton) {
        console.log('Nicole: Showing search button after response');
        setShowSearchButton(true);
      }

    } catch (error) {
      console.error('Error sending message to Nicole:', error);
      
      const errorMessage: ConversationMessage = {
        type: "nicole",
        content: "I'm having trouble right now, but I'm here to help! Could you tell me again what you're looking for?",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      toast.error("Connection issue - please try again");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchButtonClick = async () => {
    console.log('Search button clicked, generating search query...');
    setIsLoading(true);
    setShowSearchButton(false);

    try {
      // Generate search query from current context
      const searchQuery = generateSearchQuery(context);
      console.log('Generated search query:', searchQuery);

      // Store context for marketplace continuity
      sessionStorage.setItem('nicoleContext', JSON.stringify({
        ...context,
        fromNicole: true,
        searchQuery,
        conversationSummary: "I've found some great gift options based on our conversation!"
      }));

      // Add a final message from Nicole
      const finalMessage: ConversationMessage = {
        type: "nicole",
        content: "Perfect! Let me take you to the marketplace to see the best gift options I've found for you.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, finalMessage]);

      // Navigate after a short delay to show the message
      setTimeout(() => {
        onNavigateToResults(searchQuery);
      }, 300);

    } catch (error) {
      console.error('Error generating search:', error);
      toast.error("Sorry, I had trouble generating your search. Please try again.");
      setShowSearchButton(true); // Show button again
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
    <Card className={`${isMobile ? 'h-full rounded-none' : 'w-full h-full'} flex flex-col shadow-xl border-0`}>
      <CardContent className="p-0 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src="/ai-avatar.png" />
              <AvatarFallback className="bg-purple-100 text-purple-700 font-medium">N</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-gray-900">Nicole</h3>
              <p className="text-sm text-purple-600 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                AI Gift Advisor
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-purple-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                    message.type === "user"
                      ? "bg-purple-500 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.type === "nicole" && (
                    <p className="text-xs mt-2 opacity-70">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Search Button - Show after Nicole's last message when ready */}
            {showSearchButton && (
              <div className="flex justify-center py-2">
                <SearchButton 
                  onSearch={handleSearchButtonClick}
                  isLoading={isLoading}
                />
              </div>
            )}

            {/* Loading indicator */}
            {isLoading && !showSearchButton && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-3 max-w-[80%]">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-gray-600">Nicole is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t bg-white">
          <div className="flex space-x-2">
            <Input
              ref={inputRef}
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask Nicole anything about gifts..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={() => sendMessage()}
              disabled={!currentMessage.trim() || isLoading}
              size="icon"
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
