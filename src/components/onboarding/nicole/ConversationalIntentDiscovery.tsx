
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gift, List, Sparkles, Send } from "lucide-react";
import { triggerHapticFeedback } from "@/utils/haptics";
import NicoleChatBubble from "./NicoleChatBubble";
import TouchOptimizedSuggestions from "./TouchOptimizedSuggestions";

interface ConversationalIntentDiscoveryProps {
  conversationHistory: any[];
  onIntentDiscovered: (intent: "giftor" | "giftee" | "explorer", data: any) => void;
  onAddMessage: (message: any) => void;
  onSkip: () => void;
}

const ConversationalIntentDiscovery: React.FC<ConversationalIntentDiscoveryProps> = ({
  conversationHistory,
  onIntentDiscovered,
  onAddMessage,
  onSkip
}) => {
  const [userInput, setUserInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const quickResponses = [
    { text: "I want to buy a gift for someone", intent: "giftor", icon: Gift },
    { text: "I want to create a wishlist", intent: "giftee", icon: List },
    { text: "I'm just exploring the app", intent: "explorer", icon: Sparkles }
  ];

  useEffect(() => {
    // Auto-focus input on mobile after a brief delay
    setTimeout(() => {
      inputRef.current?.focus();
    }, 500);
  }, []);

  const analyzeUserIntent = (message: string): "giftor" | "giftee" | "explorer" | null => {
    const lowerMessage = message.toLowerCase();
    
    // Giftor keywords
    if (lowerMessage.includes("buy") || lowerMessage.includes("gift") || 
        lowerMessage.includes("present") || lowerMessage.includes("shopping") ||
        lowerMessage.includes("someone else") || lowerMessage.includes("friend") ||
        lowerMessage.includes("birthday") || lowerMessage.includes("anniversary")) {
      return "giftor";
    }
    
    // Giftee keywords
    if (lowerMessage.includes("wishlist") || lowerMessage.includes("want") ||
        lowerMessage.includes("receive") || lowerMessage.includes("list") ||
        lowerMessage.includes("myself") || lowerMessage.includes("my birthday")) {
      return "giftee";
    }
    
    // Explorer keywords
    if (lowerMessage.includes("explore") || lowerMessage.includes("looking around") ||
        lowerMessage.includes("browsing") || lowerMessage.includes("checking out") ||
        lowerMessage.includes("new here")) {
      return "explorer";
    }
    
    return null;
  };

  const handleUserMessage = async (message: string) => {
    if (!message.trim()) return;
    
    triggerHapticFeedback('light');
    
    // Add user message
    onAddMessage({
      role: 'user',
      content: message
    });
    
    setUserInput("");
    setShowSuggestions(false);
    setIsAnalyzing(true);
    
    // Analyze intent
    const detectedIntent = analyzeUserIntent(message);
    
    // Simulate Nicole thinking
    setTimeout(() => {
      if (detectedIntent) {
        let nicoleResponse = "";
        let intentData = {};
        
        switch (detectedIntent) {
          case "giftor":
            nicoleResponse = "Perfect! I love helping people find amazing gifts. Let me ask you a few questions to find something truly special.";
            intentData = { initialMessage: message };
            break;
          case "giftee":
            nicoleResponse = "Wonderful! Creating a wishlist is a great way to make sure you get gifts you'll love. I'll help you set up your profile and wishlist.";
            intentData = { initialMessage: message };
            break;
          case "explorer":
            nicoleResponse = "That's great! Elyphant has lots to discover. Let me show you around and help you find what interests you most.";
            intentData = { initialMessage: message };
            break;
        }
        
        onAddMessage({
          role: 'assistant',
          content: nicoleResponse
        });
        
        setIsAnalyzing(false);
        
        // Trigger intent discovery after brief delay
        setTimeout(() => {
          onIntentDiscovered(detectedIntent, intentData);
        }, 1000);
        
      } else {
        // Ask for clarification
        onAddMessage({
          role: 'assistant',
          content: "I'd love to help! Could you tell me a bit more? Are you looking to buy a gift for someone, create a wishlist for yourself, or just exploring what Elyphant offers?"
        });
        setIsAnalyzing(false);
        setShowSuggestions(true);
      }
    }, 1500);
  };

  const handleQuickResponse = (response: any) => {
    triggerHapticFeedback('selection');
    handleUserMessage(response.text);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleUserMessage(userInput);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 ios-scroll">
        {conversationHistory.map((message) => (
          <NicoleChatBubble
            key={message.id}
            message={message}
            isLoading={isAnalyzing && message === conversationHistory[conversationHistory.length - 1]}
          />
        ))}
        
        {isAnalyzing && (
          <NicoleChatBubble
            message={{
              role: 'assistant',
              content: 'Let me think about that...'
            }}
            isLoading={true}
          />
        )}
      </div>

      {/* Quick Response Suggestions */}
      {showSuggestions && (
        <TouchOptimizedSuggestions
          suggestions={quickResponses}
          onSelect={handleQuickResponse}
          title="Quick responses:"
        />
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-gray-100 safe-area-bottom">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <Input
            ref={inputRef}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 h-12 text-base rounded-full border-gray-300 focus:border-purple-500"
            disabled={isAnalyzing}
          />
          <Button
            type="submit"
            disabled={!userInput.trim() || isAnalyzing}
            className="h-12 w-12 rounded-full bg-purple-600 hover:bg-purple-700 touch-manipulation"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
        
        <Button
          variant="ghost"
          onClick={onSkip}
          className="w-full mt-3 text-gray-500 touch-manipulation"
        >
          Skip onboarding
        </Button>
      </div>
    </div>
  );
};

export default ConversationalIntentDiscovery;
