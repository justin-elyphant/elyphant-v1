import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Sparkles, 
  Calendar, 
  Settings, 
  Heart,
  ArrowRight
} from "lucide-react";
import { useGiftAdvisorBot } from "../hooks/useGiftAdvisorBot";

type AutoGiftSuccessStepProps = ReturnType<typeof useGiftAdvisorBot>;

const AutoGiftSuccessStep = ({ 
  botState,
  resetBot,
  closeBot
}: AutoGiftSuccessStepProps) => {
  const recipient = botState.selectedFriend;
  const occasion = botState.occasion || 'birthday';

  const handleViewDashboard = () => {
    closeBot();
    // Navigate to AI gifting dashboard
    window.location.href = '/dashboard?tab=auto-gifts';
  };

  const handleSetupAnother = () => {
    resetBot();
  };

  return (
    <div className="space-y-6 text-center">
      {/* Success Icon */}
      <div className="space-y-4">
        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-green-700">AI Gifting Activated!</h2>
          <p className="text-muted-foreground">
            Nicole will now handle {occasion} gifts for {recipient?.connected_user_id || 'them'} automatically
          </p>
        </div>
      </div>

      {/* Setup Summary */}
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-green-600" />
              <p className="font-medium text-green-800">What happens next?</p>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-left">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-800">Smart Reminders</p>
                  <p className="text-green-600">You'll get notifications 7, 3, and 1 days before {occasion}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-left">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Heart className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-800">Curated Gift Selection</p>
                  <p className="text-green-600">
                    {recipient?.hasWishlist 
                      ? "Nicole will check their wishlist first, then find perfect alternatives"
                      : "Nicole will use AI to find gifts based on their preferences"
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-left">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Settings className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-800">Your Control</p>
                  <p className="text-green-600">Review and approve before any purchase - you're always in control</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">What would you like to do next?</p>
        
        <div className="space-y-2">
          <Button 
            className="w-full"
            onClick={handleViewDashboard}
          >
            <Settings className="w-4 h-4 mr-2" />
            View AI Gifting Dashboard
          </Button>
          
          <Button 
            variant="outline"
            className="w-full"
            onClick={handleSetupAnother}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Set Up AI Gifting for Someone Else
          </Button>
        </div>
      </div>

      {/* Pro Tip */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3 text-left">
            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="w-3 h-3 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-sm">Pro Tip</p>
              <p className="text-sm text-muted-foreground">
                Add more friends to your connections to set up AI gifting for birthdays, anniversaries, and other special occasions. Nicole gets smarter with each relationship!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AutoGiftSuccessStep;