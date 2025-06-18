
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, X, Sparkles } from "lucide-react";
import { NicoleMessage, NicoleContext } from "@/services/ai/nicoleAiService";
import { cn } from "@/lib/utils";

interface NicoleMarketplaceWidgetProps {
  searchQuery: string;
  totalResults: number;
  isFromNicole?: boolean;
}

const NicoleMarketplaceWidget: React.FC<NicoleMarketplaceWidgetProps> = ({
  searchQuery,
  totalResults,
  isFromNicole = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<NicoleMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [nicoleContext, setNicoleContext] = useState<any>(null);

  useEffect(() => {
    // Check if Nicole brought the user here
    const storedContext = sessionStorage.getItem('nicoleContext');
    if (storedContext || isFromNicole) {
      const context = storedContext ? JSON.parse(storedContext) : null;
      setNicoleContext(context || { fromNicole: true });
      
      // Auto-expand and show initial message
      setIsExpanded(true);
      
      const initialMessage: NicoleMessage = {
        role: "assistant",
        content: `Great! I found ${totalResults} ${searchQuery} for you. What do you think of these options? Are you seeing anything that catches your eye?`
      };
      
      setMessages([initialMessage]);
      
      // Clear the context so it doesn't auto-show again
      if (storedContext) {
        sessionStorage.removeItem('nicoleContext');
      }
    }
  }, [searchQuery, totalResults, isFromNicole]);

  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;

    const userMessage: NicoleMessage = {
      role: "user",
      content: currentMessage.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage("");

    // Simulate Nicole's response
    setTimeout(() => {
      const responses = [
        "I can help you narrow down these options! What's most important to you - price, brand, or specific features?",
        "Would you like me to filter these results by a specific price range or brand?",
        "I notice there are several great options here. Are you looking for something more specific?",
        "These look like great choices! Do any of these match what you had in mind?"
      ];
      
      const response: NicoleMessage = {
        role: "assistant",
        content: responses[Math.floor(Math.random() * responses.length)]
      };
      
      setMessages(prev => [...prev, response]);
    }, 1000);
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
                  Here to help with your search
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
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-900"
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
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
              />
              <Button
                onClick={handleSendMessage}
                disabled={!currentMessage.trim()}
                size="sm"
                className="bg-purple-500 hover:bg-purple-600"
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NicoleMarketplaceWidget;
