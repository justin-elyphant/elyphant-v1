
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift, List } from "lucide-react";

interface OnboardingIntentModalProps {
  open: boolean;
  onSelect: (userIntent: "giftor" | "giftee") => void;
  onSkip: () => void;
}

const OnboardingIntentModal: React.FC<OnboardingIntentModalProps> = ({
  open,
  onSelect,
  onSkip,
}) => {
  return (
    <Dialog open={open} onOpenChange={onSkip}>
      <DialogContent className="sm:max-w-md animate-fade-in p-6"> {/* Added p-6 for consistent padding */}
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">
            Welcome! What brings you to Elyphant?
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 mt-6"> {/* Increased mt and gap slightly */}
          <Button
            variant="outline"
            className="flex items-center justify-start gap-3 p-4 w-full h-auto text-left"
            onClick={() => onSelect("giftor")}
          >
            <Gift className="w-6 h-6 text-purple-600 flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-base font-medium text-foreground">
                I’m here to <span className="font-semibold text-purple-700">give a gift</span>
              </span>
              <span className="text-sm text-muted-foreground font-normal mt-0.5">
                Buy a gift for someone else (no wishlist needed)
              </span>
            </div>
          </Button>
          <Button
            variant="outline"
            className="flex items-center justify-start gap-3 p-4 w-full h-auto text-left"
            onClick={() => onSelect("giftee")}
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
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="mt-4 text-sm font-medium text-muted-foreground hover:text-foreground/80 self-center"
            onClick={onSkip}
          >
            Skip for now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingIntentModal;
