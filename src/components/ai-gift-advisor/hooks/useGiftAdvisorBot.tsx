
import { useState } from "react";
import { useAuth } from "@/contexts/auth";
import { useConnections } from "@/hooks/profile/useConnections";
import { useGiftingData } from "@/hooks/useGiftingData";
import { toast } from "sonner";

export type ConversationStep = 
  | "welcome"
  | "recipient-selection" 
  | "friend-selected"
  | "manual-input"
  | "nicole-auto-gift"
  | "nicole-auto-gift-connection"
  | "friend-search"
  | "invite-new-friend"
  | "invitation-sent"
  | "auto-gift-confirmation"
  | "auto-gift-success"
  | "occasion"
  | "budget"
  | "generating"
  | "results"
  | "results-preview"
  | "signup-prompt";

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
  searchContext?: any; // Enhanced context from agent model
  isAuthenticated: boolean;
  showSignupPrompt: boolean;
  pendingAction?: string;
  pendingFriendData?: {
    name: string;
    email: string;
    relationship: string;
  };
  invitedFriend?: {
    name: string;
    email: string;
    relationship: string;
    occasion?: string;
  };
  agentModelFeatures?: {
    threadId?: string;
    conversationHistory?: any[];
    persistentMemory?: boolean;
    intelligentContext?: boolean;
  };
}

export const useGiftAdvisorBot = () => {
  const { user } = useAuth();
  const { connections } = useConnections();
  const { 
    saveRecipientProfile, 
    saveAIGiftSearch, 
    updateAIInteractionData,
    updateGiftingPreferences 
  } = useGiftingData();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [botState, setBotState] = useState<BotState>({
    step: "welcome",
    isAuthenticated: !!user,
    showSignupPrompt: false
  });

  const resetBot = () => {
    setBotState({ 
      step: "welcome",
      isAuthenticated: !!user,
      showSignupPrompt: false
    });
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
      isAuthenticated: !!user,
      ...updates
    }));
  };

  const selectFriend = async (friend: any) => {
    console.log("🎯 Friend selected:", friend);
    
    if (!user) {
      nextStep("signup-prompt", {
        selectedFriend: friend,
        pendingAction: "nicole-auto-gift"
      });
      return;
    }

    // Save friend selection to AI interaction data
    if (user?.id) {
      await updateAIInteractionData({
        preferred_flow: "friend-based",
        common_recipients: [friend],
        learned_preferences: {
          last_friend_selected: friend.id,
          friend_selection_count: 1
        }
      });
    }

    nextStep("nicole-auto-gift", { selectedFriend: friend });
  };

  const setRecipientDetails = async (details: BotState['recipientDetails']) => {
    if (!user) {
      nextStep("signup-prompt", {
        recipientDetails: details,
        pendingAction: "nicole-auto-gift"
      });
      return;
    }

    // Save recipient as a profile for future use
    if (user?.id && details) {
      await saveRecipientProfile({
        name: details.name,
        relationship: details.relationship,
        age_range: details.ageRange,
        interests: details.interests,
        preferences: {
          gender: details.gender,
          source: "ai-manual-input"
        }
      });
    }

    nextStep("nicole-auto-gift", { recipientDetails: details });
  };

  const setOccasion = async (occasion: string) => {
    // Update gifting preferences with occasion data
    if (user?.id) {
      const currentPrefs = await updateGiftingPreferences({
        occasions: [occasion],
        last_occasion: occasion,
        occasion_frequency: { [occasion]: 1 }
      });
    }

    setBotState(prev => ({
      ...prev,
      occasion,
      step: "budget"
    }));
  };

  const setBudget = async (budget: { min: number; max: number }) => {
    // Update gifting preferences with budget data
    if (user?.id) {
      await updateGiftingPreferences({
        budget_ranges: {
          preferred_min: budget.min,
          preferred_max: budget.max,
          last_budget: budget
        }
      });
    }

    setBotState(prev => ({
      ...prev,
      budget,
      step: "generating"
    }));
  };

  const generateSearchQuery = async () => {
    setIsLoading(true);
    
    try {
      // Enhanced integration with Nicole AI agent model
      let query = "";
      let context = {};
      
      if (botState.selectedFriend) {
        // Use friend's data for query with enhanced context
        query = `gifts for ${botState.selectedFriend.name}`;
        context = {
          recipient: botState.selectedFriend.name,
          relationship: botState.selectedFriend.relationship_type || "friend",
          interests: botState.selectedFriend.interests || [],
          connectionData: botState.selectedFriend
        };
        if (botState.occasion) {
          query += ` ${botState.occasion}`;
          context = { ...context, occasion: botState.occasion };
        }
      } else if (botState.recipientDetails) {
        // Use manual input for query with enhanced context
        const { interests, ageRange, relationship, name } = botState.recipientDetails;
        query = `gifts for ${relationship} ${ageRange} ${interests.join(" ")}`;
        context = {
          recipient: name,
          relationship,
          interests,
          exactAge: ageRange,
          recipientDetails: botState.recipientDetails
        };
        if (botState.occasion) {
          query += ` ${botState.occasion}`;
          context = { ...context, occasion: botState.occasion };
        }
      }

      if (botState.budget) {
        query += ` under $${botState.budget.max}`;
        context = { ...context, budget: [botState.budget.min, botState.budget.max] };
      }

      // Save the AI search session with enhanced context
      if (user?.id) {
        await saveAIGiftSearch({
          search_query: query,
          recipient_data: botState.selectedFriend || botState.recipientDetails,
          occasion: botState.occasion,
          budget_range: botState.budget,
          results: { 
            query, 
            context,
            agentModelUsed: true,
            enhancedFeatures: true
          },
          was_successful: true
        });

        // Update AI interaction data with enhanced agent features
        await updateAIInteractionData({
          agent_model_usage: true,
          conversation_quality: "high",
          feature_usage: ["enhanced_search", "agent_memory", "intelligent_context"],
          search_context: context
        });
      }

      // For non-authenticated users, show preview instead of full results
      const targetStep = user ? "results" : "results-preview";

      setBotState(prev => ({
        ...prev,
        searchQuery: query,
        searchContext: context, // Store enhanced context
        step: targetStep
      }));

      toast.success(user ? "Enhanced AI recommendations generated!" : "Preview generated!");
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
