
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
  // Add highlight style if suggested
  const getButtonClass = (intent: "giftor" | "giftee") =>
    suggestedIntent === intent
      ? "border-2 border-purple-500 bg-purple-50"
      : "border-2";

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
            onClick={() => onSelect("giftor")}
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
            onClick={() => onSelect("giftee")}
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
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingIntentModal;
