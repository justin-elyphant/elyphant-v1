
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [step, setStep] = useState(0);
  const [collectedData, setCollectedData] = useState({
    interests: [] as string[],
    birthday: "",
    name: "",
    wishlist_preferences: [] as string[]
  });

  const handleInterestAdd = (interest: string) => {
    if (interest && !collectedData.interests.includes(interest)) {
      setCollectedData(prev => ({
        ...prev,
        interests: [...prev.interests, interest]
      }));
    }
  };

  const handleWishlistPrefAdd = (pref: string) => {
    if (pref && !collectedData.wishlist_preferences.includes(pref)) {
      setCollectedData(prev => ({
        ...prev,
        wishlist_preferences: [...prev.wishlist_preferences, pref]
      }));
    }
  };

  const handleComplete = () => {
    onAddMessage({
      role: 'assistant',
      content: "Wonderful! Your wishlist setup is ready. Now let's connect you with friends and family so they know what you'd love!"
    });

    // Store the collected data in localStorage for profile setup
    localStorage.setItem("nicoleCollectedData", JSON.stringify(collectedData));
    
    setTimeout(() => {
      onComplete({ 
        gifteeSetup: true,
        userData: collectedData
      });
    }, 1500);
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <NicoleChatBubble
              message={{
                role: 'assistant',
                content: "Perfect! Creating wishlists is such a thoughtful way to help others know what you'd truly appreciate. Let me get to know you better!"
              }}
            />
            <div className="bg-gray-50 p-4 rounded-lg">
              <Label htmlFor="name">What's your name?</Label>
              <Input
                id="name"
                value={collectedData.name}
                onChange={(e) => setCollectedData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Your name"
                className="mt-2"
              />
            </div>
          </div>
        );
      
      case 1:
        return (
          <div className="space-y-4">
            <NicoleChatBubble
              message={{
                role: 'assistant',
                content: `Nice to meet you, ${collectedData.name}! When's your birthday? This helps others know when special occasions are coming up.`
              }}
            />
            <div className="bg-gray-50 p-4 rounded-lg">
              <Label htmlFor="birthday">Your Birthday</Label>
              <Input
                id="birthday"
                type="date"
                value={collectedData.birthday}
                onChange={(e) => setCollectedData(prev => ({ ...prev, birthday: e.target.value }))}
                className="mt-2"
              />
            </div>
          </div>
        );

      case 2:
        return (
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
                {collectedData.interests.map((interest, index) => (
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
                      handleInterestAdd((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
              </div>
              <div className="mt-2 text-sm text-gray-500">Press Enter to add each interest</div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversationHistory.map((message) => (
          <NicoleChatBubble key={message.id} message={message} />
        ))}
        
        {renderStep()}
      </div>

      <div className="p-4 border-t border-gray-100">
        <div className="space-y-3">
          {step < 2 ? (
            <Button
              onClick={() => setStep(step + 1)}
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={
                (step === 0 && !collectedData.name) ||
                (step === 1 && !collectedData.birthday)
              }
            >
              Continue
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Create my wishlist profile
            </Button>
          )}
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
