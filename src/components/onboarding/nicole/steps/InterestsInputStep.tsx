
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import NicoleChatBubble from "../NicoleChatBubble";

interface InterestsInputStepProps {
  interests: string[];
  onInterestAdd: (interest: string) => void;
  onComplete: () => void;
  onBack: () => void;
  conversationHistory: any[];
}

const InterestsInputStep: React.FC<InterestsInputStepProps> = ({
  interests,
  onInterestAdd,
  onComplete,
  onBack,
  conversationHistory
}) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversationHistory.map((message) => (
          <NicoleChatBubble key={message.id} message={message} />
        ))}
        
        <div className="space-y-4">
          <NicoleChatBubble
            message={{
              role: 'assistant',
              content: "What are some of your interests and hobbies? This helps me suggest great wishlist categories for you."
            }}
          />
          <div className="bg-gray-50 p-4 rounded-lg">
            <Label>Your Interests</Label>
            <div className="flex flex-wrap gap-2 mt-2 mb-3">
              {interests.map((interest, index) => (
                <span key={index} className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">
                  {interest}
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add an interest"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    onInterestAdd((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
            </div>
            <div className="mt-2 text-sm text-gray-500">Press Enter to add each interest</div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-100">
        <div className="space-y-3">
          <Button
            onClick={onComplete}
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

export default InterestsInputStep;
