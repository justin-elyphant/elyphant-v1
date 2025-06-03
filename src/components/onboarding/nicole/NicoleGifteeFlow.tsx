
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, List, Heart, Gift } from "lucide-react";
import { triggerHapticFeedback } from "@/utils/haptics";
import NicoleChatBubble from "./NicoleChatBubble";
import TouchOptimizedSuggestions from "./TouchOptimizedSuggestions";

interface NicoleGifteeFlowProps {
  conversationHistory: any[];
  initialData: any;
  onComplete: (data: any) => void;
  onAddMessage: (message: any) => void;
  onBack: () => void;
}

const NicoleGifteeFlow: React.FC<NicoleGifteeFlowProps> = ({
  conversationHistory,
  initialData,
  onComplete,
  onAddMessage,
  onBack
}) => {
  const [currentStep, setCurrentStep] = useState("interests");
  const [profileData, setProfileData] = useState({
    interests: [],
    occasions: [],
    style: null
  });

  const interestOptions = [
    { text: "Fashion & Style", icon: Heart, data: "fashion" },
    { text: "Tech & Gadgets", icon: Gift, data: "tech" },
    { text: "Home & Decor", icon: Gift, data: "home" },
    { text: "Books & Learning", icon: Gift, data: "books" },
    { text: "Fitness & Health", icon: Gift, data: "fitness" },
    { text: "Art & Creativity", icon: Gift, data: "art" }
  ];

  const handleInterestSelect = (interest: any) => {
    triggerHapticFeedback('selection');
    
    const newInterests = [...profileData.interests, interest.data];
    setProfileData(prev => ({ ...prev, interests: newInterests }));
    
    onAddMessage({
      role: 'user',
      content: interest.text
    });
    
    if (newInterests.length >= 3) {
      setTimeout(() => {
        onAddMessage({
          role: 'assistant',
          content: "Perfect! I've got a great sense of your style. Your wishlist is going to be amazing!"
        });
        handleComplete();
      }, 1000);
    }
  };

  const handleComplete = () => {
    triggerHapticFeedback('heavy');
    onComplete({
      flow: "giftee",
      profileData,
      completedSteps: ["interests"]
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
        <h2 className="font-semibold text-gray-900">Profile Setup</h2>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 ios-scroll">
        {conversationHistory.map((message) => (
          <NicoleChatBubble key={message.id} message={message} />
        ))}
        
        {currentStep === "interests" && (
          <NicoleChatBubble
            message={{
              role: 'assistant',
              content: "Wonderful! Let's set up your profile so I can recommend the perfect items for your wishlist. What are you most interested in? (Pick 3 or more)"
            }}
          />
        )}
      </div>

      {/* Current Step Content */}
      {currentStep === "interests" && (
        <TouchOptimizedSuggestions
          suggestions={interestOptions}
          onSelect={handleInterestSelect}
          title={`Selected: ${profileData.interests.length}/3+ interests`}
        />
      )}
    </div>
  );
};

export default NicoleGifteeFlow;
