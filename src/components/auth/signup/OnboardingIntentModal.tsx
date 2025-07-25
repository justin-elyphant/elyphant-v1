
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Zap, Search, List, Bot } from "lucide-react";

interface OnboardingIntentModalProps {
  open: boolean;
  onSelect: (userIntent: "quick-gift" | "browse-shop" | "create-wishlist" | "auto-gift") => void;
  onSkip: () => void; // Interface compatibility, not used here
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

  // Enhanced: Handle intent selection with loading states
  const handleIntentSelect = async (intent: "quick-gift" | "browse-shop" | "create-wishlist" | "auto-gift") => {
    setSelectedIntent(intent);
    setIsLoading(true);
    
    // Small delay for better UX
    setTimeout(() => {
      onSelect(intent);
      setIsLoading(false);
    }, 300);
  };

  // Add highlight style if suggested or selected
  const getButtonClass = (intent: "quick-gift" | "browse-shop" | "create-wishlist" | "auto-gift") => {
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
    <Dialog open={open} onOpenChange={(open) => !open && onSkip()}>
      <DialogContent className="sm:max-w-lg md:max-w-xl lg:max-w-2xl animate-fade-in p-6 max-w-[90vw] w-full">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl md:text-2xl font-semibold text-center">
            Welcome! How would you like to get started?
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 mt-4">
          <Button
            variant="outline"
            className={`flex items-center justify-start gap-4 p-4 md:p-6 w-full h-auto text-left hover:bg-purple-50 hover:border-purple-300 ${getButtonClass("quick-gift")}`}
            onClick={() => handleIntentSelect("quick-gift")}
            disabled={isLoading}
            data-testid="intent-quick-gift"
          >
            <Zap className="w-6 h-6 md:w-7 md:h-7 text-purple-600 flex-shrink-0" />
            <div className="flex flex-col flex-1">
              <span className="text-base md:text-lg font-medium text-foreground">
                <span className="font-semibold text-purple-700">Auto Gift (Elyphant will pick a gift for you)</span>
              </span>
              <span className="text-sm md:text-base text-muted-foreground font-normal mt-1">
                Tell us about the occasion and recipient, our AI will help pick the perfect gift
              </span>
            </div>
            {suggestedIntent === "quick-gift" && (
              <span className="ml-auto text-xs px-2 py-1 bg-purple-200 text-purple-800 rounded">
                Suggested
              </span>
            )}
          </Button>
          
          <Button
            variant="outline"
            className={`flex items-center justify-start gap-4 p-4 md:p-6 w-full h-auto text-left hover:bg-blue-50 hover:border-blue-300 ${getButtonClass("browse-shop")}`}
            onClick={() => handleIntentSelect("browse-shop")}
            disabled={isLoading}
            data-testid="intent-browse-shop"
          >
            <Search className="w-6 h-6 md:w-7 md:h-7 text-blue-600 flex-shrink-0" />
            <div className="flex flex-col flex-1">
              <span className="text-base md:text-lg font-medium text-foreground">
                <span className="font-semibold text-blue-700">Browse & Shop with Nicole's Help</span>
              </span>
              <span className="text-sm md:text-base text-muted-foreground font-normal mt-1">
                Explore our curated marketplace with AI assistance
              </span>
            </div>
            {suggestedIntent === "browse-shop" && (
              <span className="ml-auto text-xs px-2 py-1 bg-blue-200 text-blue-800 rounded">
                Suggested
              </span>
            )}
          </Button>
          
          <Button
            variant="outline"
            className={`flex items-center justify-start gap-4 p-4 md:p-6 w-full h-auto text-left hover:bg-indigo-50 hover:border-indigo-300 ${getButtonClass("create-wishlist")}`}
            onClick={() => handleIntentSelect("create-wishlist")}
            disabled={isLoading}
            data-testid="intent-create-wishlist"
          >
            <List className="w-6 h-6 md:w-7 md:h-7 text-indigo-600 flex-shrink-0" />
            <div className="flex flex-col flex-1">
              <span className="text-base md:text-lg font-medium text-foreground">
                <span className="font-semibold text-indigo-700">Create My First Wishlist</span>
              </span>
              <span className="text-sm md:text-base text-muted-foreground font-normal mt-1">
                Build and share your wishlist for perfect gifting
              </span>
            </div>
            {suggestedIntent === "create-wishlist" && (
              <span className="ml-auto text-xs px-2 py-1 bg-indigo-200 text-indigo-800 rounded">
                Suggested
              </span>
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
