
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Sparkles, ArrowRight, RotateCcw, Users } from "lucide-react";
import ChatBubble from "../conversation/ChatBubble";
import UserResponse from "../conversation/UserResponse";
import WishlistRecommendations from "./WishlistRecommendations";
import ProductSuggestions from "./ProductSuggestions";
import { useEnhancedNicoleConversation } from "@/hooks/useEnhancedNicoleConversation";

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

  const [userInput, setUserInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize conversation with initial query if provided
  useEffect(() => {
    if (initialQuery && conversation.length === 0) {
      startConversation(initialQuery);
    } else if (conversation.length === 0) {
      startConversation();
    }
  }, [initialQuery, conversation.length, startConversation]);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  const handleCustomResponse = () => {
    if (userInput.trim()) {
      sendMessage(userInput.trim());
      setUserInput("");
    }
  };

  const handleGenerateResults = async () => {
    const searchQuery = await generateSearchQuery();
    if (searchQuery) {
      onNavigateToResults(searchQuery);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleCustomResponse();
    }
  };

  const handleWishlistItemSelect = (recommendation: any) => {
    selectWishlistItem(recommendation);
    // Navigate to search for this specific item
    const searchQuery = recommendation.item.title || recommendation.item.name;
    onNavigateToResults(searchQuery);
  };

  const handleSearchSuggestion = (query: string) => {
    searchByQuery(query);
    onNavigateToResults(query);
  };

  const getStepBadge = () => {
    switch (currentStep) {
      case "greeting":
        return <Badge variant="secondary">Getting Started</Badge>;
      case "discovery":
        return <Badge variant="secondary">Learning About Your Needs</Badge>;
      case "wishlist_review":
        return <Badge className="bg-purple-100 text-purple-700">Reviewing Wishlists</Badge>;
      case "alternatives":
        return <Badge className="bg-blue-100 text-blue-700">Finding Alternatives</Badge>;
      case "generating":
        return <Badge className="bg-green-100 text-green-700">Preparing Results</Badge>;
      case "complete":
        return <Badge className="bg-green-100 text-green-700">Ready!</Badge>;
      default:
        return <Badge variant="secondary">Chat Active</Badge>;
    }
  };

  return (
    <div className="flex flex-col h-full max-h-96 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-50 to-indigo-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Enhanced Nicole</h3>
            <p className="text-xs text-gray-600">AI Gift Assistant with Wishlist Intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStepBadge()}
          {context.connections && context.connections.length > 0 && (
            <Badge variant="outline" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              {context.connections.length} connections
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>
      </div>

      {/* Context Info */}
      {(context.recipient || context.occasion || context.budget) && (
        <div className="px-4 py-2 bg-purple-50 border-b">
          <div className="flex flex-wrap gap-2 text-xs">
            {context.recipient && (
              <Badge variant="outline">👤 {context.recipient}</Badge>
            )}
            {context.relationship && (
              <Badge variant="outline">💙 {context.relationship}</Badge>
            )}
            {context.occasion && (
              <Badge variant="outline">🎉 {context.occasion}</Badge>
            )}
            {context.budget && (
              <Badge variant="outline">💰 ${context.budget[0]} - ${context.budget[1]}</Badge>
            )}
          </div>
        </div>
      )}

      {/* Conversation Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-64">
        {conversation.map((message, index) => (
          <div key={index}>
            {message.type === "nicole" && (
              <ChatBubble message={message.content} isFromNicole={true} />
            )}
            {message.type === "user" && (
              <UserResponse message={message.content} />
            )}
            {message.type === "wishlist_display" && message.data?.recommendations && (
              <div className="my-3">
                <WishlistRecommendations
                  recommendations={message.data.recommendations}
                  onSelectItem={handleWishlistItemSelect}
                  userBudget={context.budget}
                />
              </div>
            )}
            {message.type === "product_suggestions" && message.data?.searchSuggestions && (
              <div className="my-3">
                <ProductSuggestions
                  searchSuggestions={message.data.searchSuggestions}
                  onSearchQuery={handleSearchSuggestion}
                  recipientName={context.recipient}
                />
              </div>
            )}
          </div>
        ))}

        {isGenerating && (
          <ChatBubble
            message="Let me analyze their wishlist and think about this..."
            isFromNicole={true}
            isTyping={true}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {currentStep !== "complete" && (
        <div className="border-t p-4 space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your response..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <Button
              onClick={handleCustomResponse}
              disabled={!userInput.trim() || isGenerating}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
            >
              Send
            </Button>
          </div>
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={resetConversation}
              className="text-gray-500 hover:text-gray-700"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Start Over
            </Button>
            {context.recipient && context.occasion && (
              <Button
                onClick={handleGenerateResults}
                disabled={isGenerating}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <ArrowRight className="h-4 w-4 mr-1" />
                Search Marketplace
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Results Ready */}
      {currentStep === "complete" && (
        <div className="border-t p-4 bg-green-50">
          <div className="text-center space-y-3">
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              Ready to search!
            </Badge>
            <p className="text-sm text-gray-600">
              Perfect! I have great recommendations ready for you.
            </p>
            <Button
              onClick={handleGenerateResults}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Show Me Gift Recommendations
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedNicoleConversationEngine;
