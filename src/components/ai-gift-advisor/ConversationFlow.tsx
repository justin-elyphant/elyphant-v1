
import React from "react";
import { useGiftAdvisorBot } from "./hooks/useGiftAdvisorBot";
import WelcomeStep from "./steps/WelcomeStep";
import RecipientSelectionStep from "./steps/RecipientSelectionStep";
import FriendSelectedStep from "./steps/FriendSelectedStep";
import ManualInputStep from "./steps/ManualInputStep";
import OccasionStep from "./steps/OccasionStep";
import BudgetStep from "./steps/BudgetStep";
import GeneratingStep from "./steps/GeneratingStep";
import ResultsStep from "./steps/ResultsStep";

type ConversationFlowProps = ReturnType<typeof useGiftAdvisorBot>;

const ConversationFlow = (props: ConversationFlowProps) => {
  const { botState } = props;

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
    default:
      return <WelcomeStep {...props} />;
  }
};

export default ConversationFlow;
