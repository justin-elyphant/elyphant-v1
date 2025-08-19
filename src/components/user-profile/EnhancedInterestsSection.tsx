import React from "react";
import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";

interface EnhancedInterestsSectionProps {
  interests: string[];
  isOwnProfile: boolean;
}

const EnhancedInterestsSection = ({ interests, isOwnProfile }: EnhancedInterestsSectionProps) => {
  if (!interests || interests.length === 0) return null;

  const handleFindGifts = (interest: string) => {
    console.log(`Finding gifts for interest: ${interest}`);
    // Dispatch Nicole event with gift context
    window.dispatchEvent(new CustomEvent('triggerNicole', {
      detail: {
        capability: 'gift-recommendations',
        source: 'interest-discovery',
        autoGreeting: true,
        greetingContext: {
          greeting: 'interest-gifts',
          interest: interest,
          activeMode: 'gift-advisor'
        }
      }
    }));
  };
  
  return (
    <div className="mb-8">
      <h3 className="text-lg font-medium mb-2">Interests</h3>
      <div className="grid gap-3">
        {interests.map((interest, index) => (
          <div 
            key={index} 
            className="flex items-center justify-between bg-muted/50 rounded-lg p-3"
          >
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                {interest}
              </div>
            </div>
            
            {!isOwnProfile && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFindGifts(interest)}
                className="flex items-center gap-2 text-xs"
              >
                <Bot className="h-3 w-3" />
                Find Gifts
              </Button>
            )}
          </div>
        ))}
        
        {!isOwnProfile && interests.length > 0 && (
          <div className="mt-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => handleFindGifts(interests.join(', '))}
              className="flex items-center gap-2"
            >
              <Bot className="h-4 w-4" />
              Get Gift Ideas for All Interests
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedInterestsSection;