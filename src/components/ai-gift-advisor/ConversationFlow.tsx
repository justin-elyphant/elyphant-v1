
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { ConversationStep } from "./hooks/useGiftAdvisorBot";
import WelcomeStep from "./steps/WelcomeStep";
import RecipientSelectionStep from "./steps/RecipientSelectionStep";
import FriendSelectedStep from "./steps/FriendSelectedStep";
import ManualInputStep from "./steps/ManualInputStep";
import OccasionStep from "./steps/OccasionStep";
import BudgetStep from "./steps/BudgetStep";
import GeneratingStep from "./steps/GeneratingStep";
import ResultsStep from "./steps/ResultsStep";
import ResultsPreviewStep from "./steps/ResultsPreviewStep";
import SignUpPromptStep from "./steps/SignUpPromptStep";
import ContextualLinks from "../ai/conversation/ContextualLinks";
import { ContextualLink } from "@/services/ai/nicoleAiService";

interface ConversationFlowProps {
  isOpen: boolean;
  isLoading: boolean;
  botState: any;
  connections: any[];
  openBot: () => void;
  closeBot: () => void;
  resetBot: () => void;
  nextStep: (step: ConversationStep, updates?: any) => void;
  selectFriend: (friend: any) => Promise<void>;
  setRecipientDetails: (details: any) => Promise<void>;
  setOccasion: (occasion: string) => Promise<void>;
  setBudget: (budget: { min: number; max: number }) => Promise<void>;
  generateSearchQuery: () => Promise<void>;
}

const ConversationFlow: React.FC<ConversationFlowProps> = (props) => {
  const { botState } = props;

  // Generate contextual links based on current step
  const getContextualLinks = (): ContextualLink[] => {
    const links: ContextualLink[] = [];

    switch (botState.step) {
      case "recipient-selection":
        links.push({
          label: "Browse your connections",
          text: "Browse your connections",
          url: "/connections",
          type: "connections"
        });
        break;
      case "occasion":
        if (botState.selectedFriend || botState.recipientDetails) {
          links.push({
            label: "View their wishlist",
            text: "View their wishlist",
            url: botState.selectedFriend ? `/profile/${botState.selectedFriend.id}` : "/wishlists",
            type: "wishlist"
          });
        }
        break;
      case "budget":
        links.push({
          label: "Set up recurring gifts",
          text: "Set up recurring gifts",
          url: "/gift-scheduling/create",
          type: "schedule"
        });
        break;
      case "results":
        if (botState.searchQuery) {
          links.push(
            {
              label: "Save these to a wishlist",
              text: "Save these to a wishlist",
              url: `/wishlists/create?query=${encodeURIComponent(botState.searchQuery)}`,
              type: "wishlist"
            },
            {
              label: "Schedule as recurring gift",
              text: "Schedule as recurring gift",
              url: `/gift-scheduling/create?query=${encodeURIComponent(botState.searchQuery)}`,
              type: "schedule"
            }
          );
        }
        break;
    }

    return links;
  };

  const renderStep = () => {
    switch (botState.step) {
      case "welcome":
        return <WelcomeStep {...props} />;
      case "recipient-selection":
        return <RecipientSelectionStep {...props} />;
      case "friend-selected":
        return <FriendSelectedStep {...props} />;
      case "manual-input":
        return <ManualInputStep {...props} />;
      case "occasion":
        return <OccasionStep {...props} />;
      case "budget":
        return <BudgetStep {...props} />;
      case "generating":
        return <GeneratingStep {...props} />;
      case "results":
        return <ResultsStep {...props} />;
      case "results-preview":
        return <ResultsPreviewStep {...props} />;
      case "signup-prompt":
        return <SignUpPromptStep {...props} />;
      default:
        return <WelcomeStep {...props} />;
    }
  };

  const contextualLinks = getContextualLinks();

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        {renderStep()}
      </div>
      
      {/* Show contextual links at the bottom */}
      {contextualLinks.length > 0 && (
        <div className="p-4 border-t bg-gray-50">
          <p className="text-xs text-gray-600 mb-2">Quick actions:</p>
          <ContextualLinks links={contextualLinks} />
        </div>
      )}
    </div>
  );
};

export default ConversationFlow;
