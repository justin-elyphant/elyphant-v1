
import React from "react";
import { Button } from "@/components/ui/button";
import NicoleChatBubble from "./NicoleChatBubble";

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
  const handleComplete = () => {
    onAddMessage({
      role: 'assistant',
      content: "Perfect! I've got everything I need to help you find amazing gifts. Let's get you connected with others!"
    });
    
    setTimeout(() => {
      onComplete({ giftorSetup: true });
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
            content: "Great choice! As a gift giver, you'll love how easy Elyphant makes finding the perfect presents. I'll help you set up your gifting preferences."
          }}
        />
      </div>

      <div className="p-4 border-t border-gray-100">
        <div className="space-y-3">
          <Button
            onClick={handleComplete}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            Set up my gifting profile
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

export default NicoleGiftorFlow;
