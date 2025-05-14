
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
      <DialogContent className="sm:max-w-md animate-fade-in">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-center w-full">
            Welcome! What brings you to Elyphant?
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 mt-2">
          <Button
            variant="outline"
            size="lg"
            className="flex flex-col sm:flex-row items-center justify-start gap-2 py-4 text-lg w-full"
            onClick={() => onSelect("giftor")}
          >
            <Gift className="w-6 h-6 text-purple-600" />
            <span>
              I’m here to <span className="font-semibold text-purple-700">give a gift</span>
              <span className="block text-sm text-muted-foreground font-normal mt-1">
                Buy a gift for someone else (no wishlist needed)
              </span>
            </span>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="flex flex-col sm:flex-row items-center justify-start gap-2 py-4 text-lg w-full"
            onClick={() => onSelect("giftee")}
          >
            <List className="w-6 h-6 text-indigo-600" />
            <span>
              I want to <span className="font-semibold text-indigo-700">set up a wishlist</span>
              <span className="block text-sm text-muted-foreground font-normal mt-1">
                Create &amp; share your wishlist for perfect gifting
              </span>
            </span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 text-gray-500 hover:text-gray-700"
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
