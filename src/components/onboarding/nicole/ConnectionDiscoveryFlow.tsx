
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Share, Check } from "lucide-react";
import { triggerHapticFeedback } from "@/utils/haptics";
import NicoleChatBubble from "./NicoleChatBubble";
import TouchOptimizedSuggestions from "./TouchOptimizedSuggestions";

interface ConnectionDiscoveryFlowProps {
  conversationHistory: any[];
  userIntent: string | null;
  onComplete: (data: any) => void;
  onAddMessage: (message: any) => void;
  onSkip: () => void;
}

const ConnectionDiscoveryFlow: React.FC<ConnectionDiscoveryFlowProps> = ({
  conversationHistory,
  userIntent,
  onComplete,
  onAddMessage,
  onSkip
}) => {
  const [currentStep, setCurrentStep] = useState("introduction");
  const [connectionData, setConnectionData] = useState({
    invitesSent: 0,
    connectionsFound: 0
  });

  const connectionOptions = [
    { text: "Find friends already on Elyphant", icon: Users, action: "search" },
    { text: "Invite friends to join", icon: UserPlus, action: "invite" },
    { text: "Share my profile", icon: Share, action: "share" },
    { text: "I'll do this later", icon: Check, action: "skip" }
  ];

  const handleConnectionAction = (option: any) => {
    triggerHapticFeedback('selection');
    
    onAddMessage({
      role: 'user',
      content: option.text
    });

    setTimeout(() => {
      let nicoleResponse = "";
      
      switch (option.action) {
        case "search":
          nicoleResponse = "Great! I'll help you find friends who are already using Elyphant. This makes gifting so much easier!";
          break;
        case "invite":
          nicoleResponse = "Perfect! Inviting friends means you'll always know what they want, and they'll know what you want too. It's a win-win!";
          setConnectionData(prev => ({ ...prev, invitesSent: 3 }));
          break;
        case "share":
          nicoleResponse = "Sharing your profile is a great way to let people know you're on Elyphant. They can easily add you to their gift lists!";
          break;
        case "skip":
          nicoleResponse = "No problem! You can always connect with friends later. The important thing is that you're all set up now!";
          break;
      }
      
      onAddMessage({
        role: 'assistant',
        content: nicoleResponse
      });
      
      setTimeout(() => {
        handleComplete();
      }, 1500);
    }, 1000);
  };

  const handleComplete = () => {
    triggerHapticFeedback('heavy');
    onComplete({
      connectionData,
      completedAt: new Date()
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 ios-scroll">
        {conversationHistory.map((message) => (
          <NicoleChatBubble key={message.id} message={message} />
        ))}
        
        <NicoleChatBubble
          message={{
            role: 'assistant',
            content: `Almost done! The best part about Elyphant is connecting with people you care about. ${
              userIntent === "giftor" 
                ? "This way, you'll always know what they want for gifts!" 
                : "Your friends and family can see your wishlist and know exactly what you'd love!"
            }`
          }}
        />
      </div>

      {/* Connection Options */}
      <TouchOptimizedSuggestions
        suggestions={connectionOptions}
        onSelect={handleConnectionAction}
        title="Let's connect you with others:"
      />
    </div>
  );
};

export default ConnectionDiscoveryFlow;
