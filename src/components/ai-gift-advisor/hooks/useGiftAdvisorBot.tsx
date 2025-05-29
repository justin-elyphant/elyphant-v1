
import { useState } from "react";
import { useAuth } from "@/contexts/auth";
import { useConnections } from "@/hooks/profile/useConnections";
import { toast } from "sonner";

export type ConversationStep = 
  | "welcome" 
  | "recipient-selection" 
  | "friend-selected" 
  | "manual-input" 
  | "occasion" 
  | "budget" 
  | "generating" 
  | "results";

export type RecipientType = "friend" | "family" | "coworker" | "other";

export interface BotState {
  step: ConversationStep;
  selectedFriend?: any;
  recipientDetails?: {
    name: string;
    ageRange: string;
    gender: string;
    interests: string[];
    relationship: RecipientType;
  };
  occasion?: string;
  budget?: { min: number; max: number };
  searchQuery?: string;
}

export const useGiftAdvisorBot = () => {
  const { user } = useAuth();
  const { connections } = useConnections();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [botState, setBotState] = useState<BotState>({
    step: "welcome"
  });

  const resetBot = () => {
    setBotState({ step: "welcome" });
    setIsLoading(false);
  };

  const openBot = () => {
    setIsOpen(true);
    if (botState.step !== "welcome") {
      resetBot();
    }
  };

  const closeBot = () => {
    setIsOpen(false);
  };

  // Enhanced nextStep that preserves existing state
  const nextStep = (step: ConversationStep, updates?: Partial<BotState>) => {
    setBotState(prev => ({
      ...prev,
      step,
      ...updates
    }));
  };

  const selectFriend = (friend: any) => {
    setBotState(prev => ({
      ...prev,
      selectedFriend: friend,
      step: "friend-selected"
    }));
  };

  const setRecipientDetails = (details: BotState['recipientDetails']) => {
    setBotState(prev => ({
      ...prev,
      recipientDetails: details,
      step: "occasion"
    }));
  };

  const setOccasion = (occasion: string) => {
    setBotState(prev => ({
      ...prev,
      occasion,
      step: "budget"
    }));
  };

  const setBudget = (budget: { min: number; max: number }) => {
    setBotState(prev => ({
      ...prev,
      budget,
      step: "generating"
    }));
  };

  const generateSearchQuery = async () => {
    setIsLoading(true);
    
    try {
      // Simulate query generation for now
      let query = "";
      
      if (botState.selectedFriend) {
        // Use friend's data for query
        query = `gifts for ${botState.selectedFriend.name}`;
        if (botState.occasion) {
          query += ` ${botState.occasion}`;
        }
      } else if (botState.recipientDetails) {
        // Use manual input for query
        const { interests, ageRange, relationship } = botState.recipientDetails;
        query = `gifts for ${relationship} ${ageRange} ${interests.join(" ")}`;
        if (botState.occasion) {
          query += ` ${botState.occasion}`;
        }
      }

      if (botState.budget) {
        query += ` under $${botState.budget.max}`;
      }

      setBotState(prev => ({
        ...prev,
        searchQuery: query,
        step: "results"
      }));

      toast.success("Gift recommendations generated!");
    } catch (error) {
      console.error("Error generating search query:", error);
      toast.error("Failed to generate recommendations");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isOpen,
    isLoading,
    botState,
    connections: connections || [],
    openBot,
    closeBot,
    resetBot,
    nextStep,
    selectFriend,
    setRecipientDetails,
    setOccasion,
    setBudget,
    generateSearchQuery
  };
};
