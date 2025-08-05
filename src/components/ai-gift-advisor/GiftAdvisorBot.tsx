
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Sparkles, X } from "lucide-react";
import { useGiftAdvisorBot } from "./hooks/useGiftAdvisorBot";
import ConversationFlow from "./ConversationFlow";

interface GiftAdvisorBotProps {
  isOpen: boolean;
  onClose: () => void;
}

const GiftAdvisorBot = ({ isOpen, onClose }: GiftAdvisorBotProps) => {
  const botHook = useGiftAdvisorBot();

  const handleClose = () => {
    onClose();
    botHook.resetBot();
  };

  const canGoBack = botHook.botState.step !== "welcome";

  const handleBack = () => {
    switch (botHook.botState.step) {
      case "recipient-selection":
        botHook.nextStep("welcome");
        break;
      case "friend-selected":
      case "manual-input":
        botHook.nextStep("recipient-selection");
        break;
      case "nicole-auto-gift":
        if (botHook.botState.selectedFriend) {
          botHook.nextStep("friend-selected");
        } else {
          botHook.nextStep("manual-input");
        }
        break;
      case "occasion":
        botHook.nextStep("nicole-auto-gift");
        break;
      case "budget":
        botHook.nextStep("occasion");
        break;
      case "results":
        botHook.nextStep("budget");
        break;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto h-[80vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <div className="flex items-center gap-3">
            {canGoBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="p-1 h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <Avatar className="w-10 h-10">
              <AvatarImage src="/nicole-avatar.png" />
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                <Sparkles className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-lg">Nicole - Your Shopping Buddy</DialogTitle>
              <p className="text-sm text-muted-foreground">AI Gift Assistant</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <ConversationFlow {...botHook} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GiftAdvisorBot;
