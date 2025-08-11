
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
      console.log('🎯 Nicole Bot: Generating search with context preservation');
      
      // Build enhanced Nicole context for direct API integration
      const nicoleContext = {
        recipient: botState.selectedFriend?.name || botState.recipientDetails?.name,
        relationship: botState.selectedFriend?.relationship || botState.recipientDetails?.relationship,
        occasion: botState.occasion,
        interests: botState.selectedFriend?.interests || botState.recipientDetails?.interests || [],
        budget: botState.budget ? [botState.budget.min, botState.budget.max] : undefined,
        exactAge: botState.recipientDetails?.ageRange ? parseInt(botState.recipientDetails.ageRange) : undefined
      };

      // Generate search query with interests
      let query = "";
      if (botState.selectedFriend) {
        query = `gifts for ${botState.selectedFriend.name}`;
        if (botState.occasion) query += ` ${botState.occasion}`;
      } else if (botState.recipientDetails) {
        const { interests, ageRange, relationship } = botState.recipientDetails;
        query = `gifts for ${relationship} ${ageRange} ${interests.join(" ")}`;
        if (botState.occasion) query += ` ${botState.occasion}`;
      }

      // Save the AI search session
      if (user?.id) {
        await saveAIGiftSearch({
          search_query: query,
          recipient_data: botState.selectedFriend || botState.recipientDetails,
          occasion: botState.occasion,
          budget_range: botState.budget,
          results: { query },
          was_successful: true
        });
      }

      // **PHASE 1: Direct Nicole → Marketplace Pipeline**
      // Navigate to marketplace with preserved Nicole context
      const searchParams = new URLSearchParams({
        search: query,
        source: 'nicole',
        recipient: nicoleContext.recipient || 'friend'
      });

      // Add budget to URL for persistence
      if (botState.budget) {
        searchParams.set('minPrice', botState.budget.min.toString());
        searchParams.set('maxPrice', botState.budget.max.toString());
      }

      // **PHASE 2: Persistent Session Storage**
      // Store complete Nicole context in sessionStorage
      sessionStorage.setItem('nicoleContext', JSON.stringify({
        ...nicoleContext,
        source: 'gift-advisor-bot',
        timestamp: Date.now(),
        searchQuery: query
      }));

      console.log('🎯 Nicole Bot: Context stored in sessionStorage:', nicoleContext);

      // Dispatch Nicole search event with full context
      window.dispatchEvent(new CustomEvent('nicole-search', {
        detail: {
          query,
          nicoleContext: {
            ...nicoleContext,
            source: 'gift-advisor-bot'
          }
        }
      }));

      const targetStep = user ? "results" : "results-preview";
      setBotState(prev => ({
        ...prev,
        searchQuery: query,
        step: targetStep
      }));

      // Navigate to marketplace
      window.location.href = `/marketplace?${searchParams.toString()}`;
      
      toast.success(user ? "Gift recommendations generated!" : "Preview generated!");
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
