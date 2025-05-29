
import React, { useEffect } from "react";
import { Loader2, Sparkles, Gift, Search } from "lucide-react";
import { useGiftAdvisorBot } from "../hooks/useGiftAdvisorBot";

type GeneratingStepProps = ReturnType<typeof useGiftAdvisorBot>;

const GeneratingStep = ({ generateSearchQuery, botState }: GeneratingStepProps) => {
  useEffect(() => {
    // Start generating the search query when this step loads
    const timer = setTimeout(() => {
      generateSearchQuery();
    }, 2000); // Simulate processing time

    return () => clearTimeout(timer);
  }, [generateSearchQuery]);

  const recipientName = botState.selectedFriend?.name || botState.recipientDetails?.name || "them";

  return (
    <div className="flex flex-col h-full justify-center items-center text-center p-6 space-y-6">
      <div className="relative">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Gift className="h-8 w-8 text-purple-500 animate-bounce" />
          <Search className="h-6 w-6 text-pink-500 animate-pulse" />
          <Sparkles className="h-8 w-8 text-yellow-500 animate-bounce delay-150" />
        </div>
        <Loader2 className="h-8 w-8 text-purple-600 animate-spin mx-auto" />
      </div>
      
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">
          🎯 Finding Perfect Gifts
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed max-w-sm">
          I'm analyzing {recipientName}'s preferences and searching for the best gift options for {botState.occasion}...
        </p>
      </div>

      <div className="space-y-2 text-xs text-gray-500">
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
          <span>Checking wishlist items</span>
        </div>
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse delay-300"></div>
          <span>Analyzing interests & preferences</span>
        </div>
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse delay-500"></div>
          <span>Finding products in budget range</span>
        </div>
      </div>
    </div>
  );
};

export default GeneratingStep;
