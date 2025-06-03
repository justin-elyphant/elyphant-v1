
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import NicoleChatBubble from "../NicoleChatBubble";

interface NameInputStepProps {
  name: string;
  onNameChange: (name: string) => void;
  onContinue: () => void;
  onBack: () => void;
  conversationHistory: any[];
}

const NameInputStep: React.FC<NameInputStepProps> = ({
  name,
  onNameChange,
  onContinue,
  onBack,
  conversationHistory
}) => {
  // Check if there's already a recent Nicole message about wishlist creation
  const hasRecentWishlistMessage = conversationHistory.some(msg => 
    msg.role === 'assistant' && 
    msg.content.toLowerCase().includes('wonderful') && 
    msg.content.toLowerCase().includes('wishlist')
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversationHistory.map((message) => (
          <NicoleChatBubble key={message.id} message={message} />
        ))}
        
        <div className="space-y-4">
          {!hasRecentWishlistMessage && (
            <NicoleChatBubble
              message={{
                role: 'assistant',
                content: "Wonderful! Creating a wishlist is such a thoughtful way to help others know what you'd truly appreciate. Let me get to know you better so I can help you build the perfect wishlist! What's your name?"
              }}
            />
          )}
          <div className="bg-gray-50 p-4 rounded-lg">
            <Label htmlFor="name">Your name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Your name"
              className="mt-2"
            />
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-100">
        <div className="space-y-3">
          <Button
            onClick={onContinue}
            className="w-full bg-purple-600 hover:bg-purple-700"
            disabled={!name}
          >
            Continue
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

export default NameInputStep;
