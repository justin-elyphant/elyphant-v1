
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
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
      case "occasion":
        if (botHook.botState.selectedFriend) {
          botHook.nextStep("friend-selected");
        } else {
          botHook.nextStep("manual-input");
        }
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
          <div className="flex items-center gap-2">
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
            <DialogTitle className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              🎁 AI Gift Advisor
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <ConversationFlow {...botHook} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GiftAdvisorBot;
