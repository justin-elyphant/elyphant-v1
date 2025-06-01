
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Sparkles, ArrowRight, RotateCcw } from "lucide-react";
import ChatBubble from "./conversation/ChatBubble";
import QuickResponseButtons from "./conversation/QuickResponseButtons";
import ConversationProgress from "./conversation/ConversationProgress";
import UserResponse from "./conversation/UserResponse";
import { useNicoleConversation } from "@/hooks/useNicoleConversation";

interface NicoleConversationEngineProps {
  initialQuery?: string;
  onClose: () => void;
  onNavigateToResults: (searchQuery: string) => void;
}

const NicoleConversationEngine: React.FC<NicoleConversationEngineProps> = ({
  initialQuery,
  onClose,
  onNavigateToResults
}) => {
  const {
    conversation,
    currentStep,
    context,
    isGenerating,
    askQuestion,
    respondToQuestion,
    generateSearchQuery,
    resetConversation
  } = useNicoleConversation();

  const [userInput, setUserInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize conversation with initial query if provided
  useEffect(() => {
    if (initialQuery && conversation.length === 0) {
      askQuestion(initialQuery);
    }
  }, [initialQuery, conversation.length, askQuestion]);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  const handleQuickResponse = (response: string) => {
    respondToQuestion(response);
    setUserInput("");
  };

  const handleCustomResponse = () => {
    if (userInput.trim()) {
      respondToQuestion(userInput.trim());
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

  return (
    <div className="flex flex-col h-full max-h-96 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-50 to-indigo-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Nicole</h3>
            <p className="text-xs text-gray-600">Your AI Gift Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ConversationProgress step={currentStep} />
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>
      </div>

      {/* Conversation Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-64">
        {conversation.length === 0 && (
          <ChatBubble
            message="Hi! I'm Nicole, your personal gift assistant. I'll help you find the perfect gift by asking a few questions. What kind of gift are you looking for?"
            isFromNicole={true}
          />
        )}
        
        {conversation.map((message, index) => (
          <div key={index}>
            {message.type === "nicole" && (
              <ChatBubble message={message.content} isFromNicole={true} />
            )}
            {message.type === "user" && (
              <UserResponse message={message.content} />
            )}
            {message.type === "options" && message.options && (
              <QuickResponseButtons
                options={message.options}
                onSelect={handleQuickResponse}
              />
            )}
          </div>
        ))}

        {isGenerating && (
          <ChatBubble
            message="Let me think about this..."
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
                Find Gifts
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
              Perfect! I have enough information to find great gifts.
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

export default NicoleConversationEngine;
