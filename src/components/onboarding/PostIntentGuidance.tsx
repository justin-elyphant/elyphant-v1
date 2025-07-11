import React from "react";
import { useNavigate } from "react-router-dom";
import { LocalStorageService } from "@/services/localStorage/LocalStorageService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowRight, Gift, Users, Calendar, Settings } from "lucide-react";

interface PostIntentGuidanceProps {
  selectedIntent: string;
  onComplete?: () => void;
}

const INTENT_GUIDANCE = {
  "giftor": {
    title: "Perfect! Let's find amazing gifts",
    description: "Nicole will help you discover thoughtful gifts for your loved ones",
    nextSteps: [
      { icon: Gift, title: "Browse gift suggestions", description: "Get AI-powered recommendations" },
      { icon: Users, title: "Add recipients", description: "Tell us about who you're shopping for" },
      { icon: Calendar, title: "Set occasions", description: "Never miss birthdays or special dates" },
    ],
    primaryAction: { label: "Start Gift Search", path: "/marketplace?mode=nicole&open=true" },
    secondaryAction: { label: "Add Recipients", path: "/connections" },
  },
  "giftee": {
    title: "Great! Let's build your wishlist",
    description: "Share your preferences so friends and family can find perfect gifts for you",
    nextSteps: [
      { icon: Gift, title: "Create wishlists", description: "Organize your favorite items" },
      { icon: Users, title: "Connect with gifters", description: "Share your lists with friends" },
      { icon: Settings, title: "Set preferences", description: "Tell us about your interests" },
    ],
    primaryAction: { label: "Create Wishlist", path: "/wishlists" },
    secondaryAction: { label: "Browse Items", path: "/marketplace" },
  },
  "group-gifting": {
    title: "Excellent! Group gifts made easy",
    description: "Coordinate with others to give meaningful, higher-value gifts",
    nextSteps: [
      { icon: Users, title: "Invite participants", description: "Add friends to your gift group" },
      { icon: Gift, title: "Choose a gift together", description: "Browse and decide as a group" },
      { icon: CheckCircle, title: "Split the cost", description: "Everyone contributes their share" },
    ],
    primaryAction: { label: "Start Group Gift", path: "/marketplace?mode=group" },
    secondaryAction: { label: "View Messages", path: "/messages" },
  },
  "auto-gifting": {
    title: "Smart choice! Never forget again",
    description: "Set up automatic gift giving for birthdays, holidays, and special occasions",
    nextSteps: [
      { icon: Calendar, title: "Add important dates", description: "Set up birthdays and anniversaries" },
      { icon: Gift, title: "Choose gift preferences", description: "Define budget and gift types" },
      { icon: Settings, title: "Configure automation", description: "Set timing and approval preferences" },
    ],
    primaryAction: { label: "Set Up Auto-Gifting", path: "/events" },
    secondaryAction: { label: "View Calendar", path: "/events" },
  },
};

/**
 * PostIntentGuidance provides immediate next steps after intent selection
 */
const PostIntentGuidance: React.FC<PostIntentGuidanceProps> = ({
  selectedIntent,
  onComplete,
}) => {
  const navigate = useNavigate();
  const guidance = INTENT_GUIDANCE[selectedIntent as keyof typeof INTENT_GUIDANCE];

  if (!guidance) {
    return null;
  }

  const handlePrimaryAction = () => {
    // Store completion in localStorage
    LocalStorageService.setNicoleContext({
      selectedIntent,
      timestamp: new Date().toISOString(),
      currentPage: guidance.primaryAction.path,
    });
    
    onComplete?.();
    navigate(guidance.primaryAction.path);
  };

  const handleSecondaryAction = () => {
    onComplete?.();
    navigate(guidance.secondaryAction.path);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <CheckCircle className="h-6 w-6 text-green-500" />
          {guidance.title}
        </CardTitle>
        <CardDescription className="text-base">
          {guidance.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Next Steps */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Your next steps:</h3>
          <div className="space-y-3">
            {guidance.nextSteps.map((step, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <step.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">{step.title}</h4>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={handlePrimaryAction}
            className="flex-1 gap-2"
            size="lg"
          >
            {guidance.primaryAction.label}
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button 
            onClick={handleSecondaryAction}
            variant="outline"
            className="flex-1"
            size="lg"
          >
            {guidance.secondaryAction.label}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PostIntentGuidance;