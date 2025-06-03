
import React from "react";
import { Button } from "@/components/ui/button";
import NicoleChatBubble from "./NicoleChatBubble";

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
  const handleComplete = () => {
    onAddMessage({
      role: 'assistant',
      content: "Wonderful! Your wishlist setup is ready. Now let's connect you with friends and family so they know what you'd love!"
    });
    
    setTimeout(() => {
      onComplete({ gifteeSetup: true });
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversationHistory.map((message) => (
          <NicoleChatBubble key={message.id} message={message} />
        ))}
        
        <NicoleChatBubble
          message={{
            role: 'assistant',
            content: "Perfect! Creating wishlists is such a thoughtful way to help others know what you'd truly appreciate. Let's set up your profile and preferences."
          }}
        />
      </div>

      <div className="p-4 border-t border-gray-100">
        <div className="space-y-3">
          <Button
            onClick={handleComplete}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            Create my wishlist profile
          </Button>
          <Button
            variant="outline"
            onClick={onBack}
            className="w-full"
          >
            Go back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NicoleGifteeFlow;
