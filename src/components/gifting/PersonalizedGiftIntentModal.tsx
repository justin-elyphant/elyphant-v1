
import React from "react";
import { Gift, Search, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Connection } from "@/types/connections";

interface PersonalizedGiftIntentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connection: Connection;
  onIntentSelect: (intent: "ai-gift" | "marketplace-browse" | "quick-ideas") => void;
}

const PersonalizedGiftIntentModal: React.FC<PersonalizedGiftIntentModalProps> = ({
  open,
  onOpenChange,
  connection,
  onIntentSelect
}) => {
  const friendName = connection.name;

  const handleIntentSelect = (intent: "ai-gift" | "marketplace-browse" | "quick-ideas") => {
    onIntentSelect(intent);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            Send a gift to {friendName}
          </DialogTitle>
          <DialogDescription className="text-center">
            How would you like to find the perfect gift for {friendName}?
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-3 py-4">
          <Button
            variant="outline"
            className="h-auto p-4 flex flex-col items-start gap-2 hover:bg-purple-50 hover:border-purple-200"
            onClick={() => handleIntentSelect("ai-gift")}
          >
            <div className="flex items-center gap-2 w-full">
              <Gift className="h-5 w-5 text-purple-600" />
              <span className="font-medium">Elyphant can buy the gift for {friendName}</span>
            </div>
            <p className="text-sm text-muted-foreground text-left">
              Tell us about the occasion, our AI will pick and send the perfect gift to {friendName}
            </p>
          </Button>

          <Button
            variant="outline"
            className="h-auto p-4 flex flex-col items-start gap-2 hover:bg-blue-50 hover:border-blue-200"
            onClick={() => handleIntentSelect("marketplace-browse")}
          >
            <div className="flex items-center gap-2 w-full">
              <Search className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Search the marketplace for {friendName} with Nicole's help</span>
            </div>
            <p className="text-sm text-muted-foreground text-left">
              Browse our curated marketplace with AI assistance to find the perfect gift for {friendName}
            </p>
          </Button>

          <Button
            variant="outline"
            className="h-auto p-4 flex flex-col items-start gap-2 hover:bg-green-50 hover:border-green-200"
            onClick={() => handleIntentSelect("quick-ideas")}
          >
            <div className="flex items-center gap-2 w-full">
              <Sparkles className="h-5 w-5 text-green-600" />
              <span className="font-medium">Quick Gift Ideas for {friendName}</span>
            </div>
            <p className="text-sm text-muted-foreground text-left">
              Get instant AI-powered gift suggestions based on {friendName}'s interests and your relationship
            </p>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PersonalizedGiftIntentModal;
