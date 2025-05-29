
import React from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Gift, Heart, Sparkles } from "lucide-react";
import { useGiftAdvisorBot } from "../hooks/useGiftAdvisorBot";

type FriendSelectedStepProps = ReturnType<typeof useGiftAdvisorBot>;

const FriendSelectedStep = ({ botState, nextStep }: FriendSelectedStepProps) => {
  const friend = botState.selectedFriend;

  if (!friend) return null;

  const handleContinue = () => {
    nextStep("occasion");
  };

  return (
    <div className="flex flex-col h-full p-4 space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Great choice!</h3>
        <p className="text-sm text-gray-600">
          I'll use {friend.name}'s preferences to find perfect gifts.
        </p>
      </div>

      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-purple-100 text-purple-600 text-lg">
              {friend.name.split(' ').map((n: string) => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-semibold text-gray-900">{friend.name}</h4>
            <p className="text-sm text-gray-600">Your friend</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Heart className="h-4 w-4 text-pink-500" />
            <span className="text-gray-700">
              <strong>Wishlist:</strong> 5 items available
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Gift className="h-4 w-4 text-purple-500" />
            <span className="text-gray-700">
              <strong>Interests:</strong> Technology, Books, Travel
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            <span className="text-gray-700">
              <strong>Past gifts:</strong> Loved practical items
            </span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
        <p className="text-xs text-blue-800 text-center">
          💡 I'll prioritize items from {friend.name}'s wishlist and suggest similar products based on their interests!
        </p>
      </div>

      <div className="flex-1"></div>

      <Button 
        onClick={handleContinue}
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
      >
        Continue
      </Button>
    </div>
  );
};

export default FriendSelectedStep;
