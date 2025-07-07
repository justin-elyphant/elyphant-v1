
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift, List } from "lucide-react";

interface OnboardingIntentModalProps {
  open: boolean;
  onSelect: (userIntent: "giftor" | "giftee") => void;
  onSkip: () => void; // Interface compatibility, not used here
  suggestedIntent?: "giftor" | "giftee";
}

const OnboardingIntentModal: React.FC<OnboardingIntentModalProps> = ({
  open,
  onSelect,
  suggestedIntent,
}) => {
  const [selectedIntent, setSelectedIntent] = React.useState<"giftor" | "giftee" | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  // Enhanced: Handle intent selection with loading states
  const handleIntentSelect = async (intent: "giftor" | "giftee") => {
    setSelectedIntent(intent);
    setIsLoading(true);
    
    // Small delay for better UX
    setTimeout(() => {
      onSelect(intent);
      setIsLoading(false);
    }, 300);
  };

  // Add highlight style if suggested or selected
  const getButtonClass = (intent: "giftor" | "giftee") => {
    let baseClass = "border-2 transition-all duration-200";
    
    if (selectedIntent === intent) {
      return `${baseClass} border-purple-600 bg-purple-100 scale-105`;
    }
    
    if (suggestedIntent === intent) {
      return `${baseClass} border-purple-500 bg-purple-50`;
    }
    
    return `${baseClass} hover:border-purple-300`;
  };

  return (
    <Dialog open={open} modal={true}>
      <DialogContent className="sm:max-w-md animate-fade-in p-6 max-w-[90vw]">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-xl font-semibold text-center">
            Welcome! What brings you to Elyphant?
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-5 mt-4">
          <Button
            variant="outline"
            className={`flex items-center justify-start gap-3 p-4 w-full h-auto text-left hover:bg-purple-50 hover:border-purple-300 ${getButtonClass("giftor")}`}
            onClick={() => handleIntentSelect("giftor")}
            disabled={isLoading}
            data-testid="intent-giftor"
          >
            <Gift className="w-6 h-6 text-purple-600 flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-base font-medium text-foreground">
                I'm here to <span className="font-semibold text-purple-700">give a gift</span>
              </span>
              <span className="text-sm text-muted-foreground font-normal mt-0.5">
                Buy a gift for someone else (no wishlist needed)
              </span>
            </div>
            {suggestedIntent === "giftor" && (
              <span className="ml-auto text-xs px-2 py-1 bg-purple-200 text-purple-800 rounded">
                Suggested
              </span>
            )}
          </Button>
          <Button
            variant="outline"
            className={`flex items-center justify-start gap-3 p-4 w-full h-auto text-left hover:bg-indigo-50 hover:border-indigo-300 ${getButtonClass("giftee")}`}
            onClick={() => handleIntentSelect("giftee")}
            disabled={isLoading}
            data-testid="intent-giftee"
          >
            <List className="w-6 h-6 text-indigo-600 flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-base font-medium text-foreground">
                I want to <span className="font-semibold text-indigo-700">set up a wishlist</span>
              </span>
              <span className="text-sm text-muted-foreground font-normal mt-0.5">
                Create &amp; share your wishlist for perfect gifting
              </span>
            </div>
            {suggestedIntent === "giftee" && (
              <span className="ml-auto text-xs px-2 py-1 bg-indigo-200 text-indigo-800 rounded">
                Suggested
              </span>
            )}
            {isLoading && selectedIntent === "giftee" && (
              <div className="ml-auto flex items-center">
                <div className="animate-spin w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
              </div>
            )}
          </Button>
        </div>
        
        {/* Loading state overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full"></div>
              <p className="text-sm text-muted-foreground">Setting up your experience...</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingIntentModal;
