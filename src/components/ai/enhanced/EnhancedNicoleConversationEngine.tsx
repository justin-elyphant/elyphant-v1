
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Send, X, MessageCircle } from "lucide-react";
import { useEnhancedNicoleConversation } from "@/hooks/useEnhancedNicoleConversation";
import WishlistRecommendations from "./WishlistRecommendations";
import ProductSuggestions from "./ProductSuggestions";

interface EnhancedNicoleConversationEngineProps {
  initialQuery?: string;
  onClose: () => void;
  onNavigateToResults: (searchQuery: string) => void;
}

const EnhancedNicoleConversationEngine: React.FC<EnhancedNicoleConversationEngineProps> = ({
  initialQuery,
  onClose,
  onNavigateToResults
}) => {
  const [userInput, setUserInput] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    conversation,
    currentStep,
    context,
    isGenerating,
    sendMessage,
    generateSearchQuery,
    resetConversation,
    startConversation,
    selectWishlistItem,
    searchByQuery
  } = useEnhancedNicoleConversation();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  // Handle initial query and start conversation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
      startConversation(initialQuery);
    }, 100);
    return () => clearTimeout(timer);
  }, [initialQuery, startConversation]);

  // Auto-focus input after sending message and when not generating
  useEffect(() => {
    if (!isGenerating && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isGenerating, conversation.length]);

  const handleSendMessage = async () => {
    if (!userInput.trim() || isGenerating) return;
    
    const message = userInput.trim();
    setUserInput(""); // Clear input immediately
    
    try {
      await sendMessage(message);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSearchByQuery = async (query: string) => {
    try {
      searchByQuery(query);
      const searchQuery = await generateSearchQuery();
      onNavigateToResults(searchQuery || query);
    } catch (error) {
      console.error("Error searching by query:", error);
      onNavigateToResults(query);
    }
  };

  const getStepProgress = () => {
    const steps = ["greeting", "discovery", "wishlist_review", "alternatives", "generating", "complete"];
    const currentIndex = steps.indexOf(currentStep);
    return ((currentIndex + 1) / steps.length) * 100;
  };

  return (
    <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 transition-opacity duration-300 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      <Card className="w-full max-w-2xl h-[80vh] flex flex-col mx-4 transform transition-transform duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold">Nicole AI Gift Assistant</h2>
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

        {/* Progress Bar */}
        <div className="px-4 py-2 border-b">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getStepProgress()}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-1 capitalize">
            {currentStep.replace('_', ' ')} phase
          </p>
        </div>

        {/* Conversation Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {conversation.map((message, index) => (
            <div key={index}>
              {/* Regular Messages */}
              {(message.type === "nicole" || message.type === "user") && (
                <div className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.type === "user"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )}

              {/* Wishlist Recommendations */}
              {message.type === "wishlist_display" && message.data?.recommendations && (
                <div className="space-y-2">
                  <div className="flex justify-start">
                    <div className="max-w-[80%] p-3 rounded-lg bg-gray-100 text-gray-900">
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                  <WishlistRecommendations
                    recommendations={message.data.recommendations}
                    onSelectItem={selectWishlistItem}
                    userBudget={context.budget}
                  />
                </div>
              )}

              {/* Product Suggestions */}
              {message.type === "product_suggestions" && message.data?.searchSuggestions && (
                <div className="space-y-2">
                  <div className="flex justify-start">
                    <div className="max-w-[80%] p-3 rounded-lg bg-gray-100 text-gray-900">
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                  <ProductSuggestions
                    searchSuggestions={message.data.searchSuggestions}
                    onSearchQuery={handleSearchByQuery}
                    recipientName={context.recipient}
                  />
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {isGenerating && (
            <div className="flex justify-start">
              <div className="bg-gray-100 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-600">Nicole is thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask Nicole anything about gifts..."
              disabled={isGenerating}
              className="flex-1"
              autoFocus
            />
            <Button
              onClick={handleSendMessage}
              disabled={!userInput.trim() || isGenerating}
              size="sm"
              className="px-3"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {/* Quick Actions */}
          {conversation.length > 0 && (
            <div className="flex gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetConversation}
                disabled={isGenerating}
              >
                Start Over
              </Button>
              {currentStep === "complete" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSearchByQuery("gifts")}
                  disabled={isGenerating}
                >
                  Browse All Gifts
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default EnhancedNicoleConversationEngine;
