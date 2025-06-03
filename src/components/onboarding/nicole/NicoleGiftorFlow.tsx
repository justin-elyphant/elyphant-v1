
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Gift, Search } from "lucide-react";
import { triggerHapticFeedback } from "@/utils/haptics";
import NicoleChatBubble from "./NicoleChatBubble";
import TouchOptimizedSuggestions from "./TouchOptimizedSuggestions";

interface NicoleGiftorFlowProps {
  conversationHistory: any[];
  initialData: any;
  onComplete: (data: any) => void;
  onAddMessage: (message: any) => void;
  onBack: () => void;
}

const NicoleGiftorFlow: React.FC<NicoleGiftorFlowProps> = ({
  conversationHistory,
  initialData,
  onComplete,
  onAddMessage,
  onBack
}) => {
  const [currentStep, setCurrentStep] = useState("recipient");
  const [giftData, setGiftData] = useState({
    recipient: null,
    occasion: null,
    budget: null,
    preferences: []
  });

  const handleRecipientSelect = (recipient: any) => {
    triggerHapticFeedback('selection');
    setGiftData(prev => ({ ...prev, recipient }));
    
    onAddMessage({
      role: 'user',
      content: recipient.text
    });
    
    setTimeout(() => {
      onAddMessage({
        role: 'assistant',
        content: "Great choice! What's the occasion for this gift?"
      });
      setCurrentStep("occasion");
    }, 1000);
  };

  const recipientOptions = [
    { text: "A family member", icon: Gift, data: { type: "family" } },
    { text: "A close friend", icon: Gift, data: { type: "friend" } },
    { text: "A romantic partner", icon: Gift, data: { type: "partner" } },
    { text: "A coworker", icon: Gift, data: { type: "coworker" } },
    { text: "Someone else", icon: Search, data: { type: "other" } }
  ];

  const occasionOptions = [
    { text: "Birthday", icon: Gift },
    { text: "Holiday/Christmas", icon: Gift },
    { text: "Anniversary", icon: Gift },
    { text: "Just because", icon: Gift },
    { text: "Other occasion", icon: Search }
  ];

  const handleComplete = () => {
    triggerHapticFeedback('heavy');
    onComplete({
      flow: "giftor",
      giftData,
      completedSteps: ["recipient", "occasion"]
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-100">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="h-8 w-8 p-0 touch-manipulation"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="font-semibold text-gray-900">Gift Discovery</h2>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 ios-scroll">
        {conversationHistory.map((message) => (
          <NicoleChatBubble key={message.id} message={message} />
        ))}
        
        {currentStep === "recipient" && (
          <NicoleChatBubble
            message={{
              role: 'assistant',
              content: "Perfect! Let's find the ideal gift. Who are you shopping for?"
            }}
          />
        )}
      </div>

      {/* Current Step Content */}
      {currentStep === "recipient" && (
        <TouchOptimizedSuggestions
          suggestions={recipientOptions}
          onSelect={handleRecipientSelect}
          title="I'm shopping for:"
        />
      )}

      {currentStep === "occasion" && (
        <div className="p-4">
          <TouchOptimizedSuggestions
            suggestions={occasionOptions}
            onSelect={(occasion) => {
              setGiftData(prev => ({ ...prev, occasion }));
              handleComplete();
            }}
            title="The occasion is:"
          />
        </div>
      )}
    </div>
  );
};

export default NicoleGiftorFlow;
