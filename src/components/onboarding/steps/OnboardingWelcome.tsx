
import React from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Gift } from "lucide-react";

interface OnboardingWelcomeProps {
  onNext: () => void;
  userName: string;
}

const OnboardingWelcome: React.FC<OnboardingWelcomeProps> = ({ onNext, userName }) => {
  return (
    <div className="p-6 flex flex-col items-center text-center">
      <div className="bg-purple-100 p-4 rounded-full mb-6">
        <Sparkles className="h-10 w-10 text-purple-600" />
      </div>
      
      <h1 className="text-2xl font-bold mb-3">Welcome to Gift Giver, {userName}!</h1>
      
      <p className="text-muted-foreground mb-6 max-w-md">
        We're excited to help you discover and share perfect gifts. Let's take a moment to personalize your experience.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md mb-8">
        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
          <h3 className="font-medium text-green-800 mb-1">Create Wishlists</h3>
          <p className="text-sm text-green-700">Share your gift preferences with friends and family</p>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h3 className="font-medium text-blue-800 mb-1">Discover Gifts</h3>
          <p className="text-sm text-blue-700">Find perfect presents for special occasions</p>
        </div>
        
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
          <h3 className="font-medium text-amber-800 mb-1">Connect Friends</h3>
          <p className="text-sm text-amber-700">Build your gifting network with loved ones</p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
          <h3 className="font-medium text-purple-800 mb-1">Never Miss Events</h3>
          <p className="text-sm text-purple-700">Get reminders for birthdays and anniversaries</p>
        </div>
      </div>
      
      <Button onClick={onNext} className="w-full md:w-auto bg-purple-600 hover:bg-purple-700">
        Let's Get Started <Gift className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
};

export default OnboardingWelcome;
