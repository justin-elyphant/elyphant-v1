
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Zap, Search, List } from "lucide-react";
import { motion } from "framer-motion";
import { triggerHapticFeedback } from "@/utils/haptics";

interface OnboardingIntentModalProps {
  open: boolean;
  onSelect: (userIntent: "quick-gift" | "browse-shop" | "create-wishlist" | "auto-gift") => void;
  onSkip: () => void;
  suggestedIntent?: "quick-gift" | "browse-shop" | "create-wishlist" | "auto-gift";
}

const OnboardingIntentModal: React.FC<OnboardingIntentModalProps> = ({
  open,
  onSelect,
  onSkip,
  suggestedIntent,
}) => {
  const [selectedIntent, setSelectedIntent] = React.useState<"quick-gift" | "browse-shop" | "create-wishlist" | "auto-gift" | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleIntentSelect = async (intent: "quick-gift" | "browse-shop" | "create-wishlist" | "auto-gift") => {
    triggerHapticFeedback('selection');
    setSelectedIntent(intent);
    setIsLoading(true);
    
    setTimeout(() => {
      onSelect(intent);
      setIsLoading(false);
    }, 300);
  };

  const handleSkip = () => {
    triggerHapticFeedback('light');
    onSkip();
  };

  const getButtonClass = (intent: "quick-gift" | "browse-shop" | "create-wishlist" | "auto-gift") => {
    let baseClass = "border-2 min-h-[44px]";
    
    if (selectedIntent === intent) {
      return `${baseClass} border-primary bg-primary/10`;
    }
    
    if (suggestedIntent === intent) {
      return `${baseClass} border-primary/50 bg-primary/5`;
    }
    
    return `${baseClass} hover:border-primary/30`;
  };

  const intents = [
    {
      id: "quick-gift" as const,
      icon: Zap,
      title: "Auto Gift (Elyphant will pick a gift for you)",
      description: "Tell us about the occasion and recipient, our AI will help pick the perfect gift",
    },
    {
      id: "browse-shop" as const,
      icon: Search,
      title: "Browse & Shop with Nicole's Help",
      description: "Explore our curated marketplace with AI assistance",
    },
    {
      id: "create-wishlist" as const,
      icon: List,
      title: "Create My First Wishlist",
      description: "Build and share your wishlist for perfect gifting",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleSkip()}>
      <DialogContent className="sm:max-w-lg md:max-w-xl lg:max-w-2xl p-6 max-w-[90vw] w-full pb-safe">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl md:text-2xl font-semibold text-center">
            Welcome! How would you like to get started?
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 mt-4">
          {intents.map((intent, index) => (
            <motion.div
              key={intent.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 300, damping: 25 }}
              whileTap={{ scale: 0.97 }}
            >
              <Button
                variant="outline"
                className={`flex items-center justify-start gap-4 p-4 md:p-6 w-full h-auto text-left ${getButtonClass(intent.id)}`}
                onClick={() => handleIntentSelect(intent.id)}
                disabled={isLoading}
                data-testid={`intent-${intent.id}`}
              >
                <intent.icon className="w-6 h-6 md:w-7 md:h-7 text-primary flex-shrink-0" />
                <div className="flex flex-col flex-1">
                  <span className="text-base md:text-lg font-medium text-foreground">
                    <span className="font-semibold text-primary">{intent.title}</span>
                  </span>
                  <span className="text-sm md:text-base text-muted-foreground font-normal mt-1">
                    {intent.description}
                  </span>
                </div>
                {suggestedIntent === intent.id && (
                  <span className="ml-auto text-xs px-2 py-1 bg-primary/20 text-primary rounded">
                    Suggested
                  </span>
                )}
              </Button>
            </motion.div>
          ))}
        </div>
        
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
              <p className="text-sm text-muted-foreground">Setting up your experience...</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingIntentModal;
