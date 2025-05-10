
import React from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";

interface OnboardingCompleteProps {
  onComplete: () => void;
}

const OnboardingComplete: React.FC<OnboardingCompleteProps> = ({ onComplete }) => {
  return (
    <div className="p-6 flex flex-col items-center text-center">
      <div className="mb-6 text-green-500">
        <CheckCircle className="h-16 w-16" />
      </div>
      
      <h2 className="text-2xl font-bold mb-3">You're All Set!</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        Thanks for taking the time to set up your profile. You're now ready to discover and share great gifts!
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-8">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium mb-1">Create a Wishlist</h3>
          <p className="text-xs text-muted-foreground">Start adding items you'd love to receive</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium mb-1">Browse Products</h3>
          <p className="text-xs text-muted-foreground">Discover perfect gifts in our marketplace</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium mb-1">Explore Features</h3>
          <p className="text-xs text-muted-foreground">Check out all the gifting tools available</p>
        </div>
      </div>
      
      <Button onClick={onComplete} className="w-full md:w-auto">
        Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
};

export default OnboardingComplete;
