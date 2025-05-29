
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ExternalLink, ShoppingCart, Sparkles } from "lucide-react";
import { useGiftAdvisorBot } from "../hooks/useGiftAdvisorBot";

type ResultsStepProps = ReturnType<typeof useGiftAdvisorBot>;

const ResultsStep = ({ botState, closeBot, resetBot }: ResultsStepProps) => {
  const navigate = useNavigate();

  const handleViewInMarketplace = () => {
    if (botState.searchQuery) {
      closeBot();
      navigate(`/marketplace?search=${encodeURIComponent(botState.searchQuery)}`);
    }
  };

  const handleStartOver = () => {
    resetBot();
  };

  const recipientName = botState.selectedFriend?.name || botState.recipientDetails?.name || "recipient";

  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          <h3 className="text-lg font-semibold text-gray-900">Ready to Shop!</h3>
          <Sparkles className="h-5 w-5 text-yellow-500" />
        </div>
        <p className="text-sm text-gray-600">
          I've prepared personalized gift recommendations for {recipientName}.
        </p>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
        <h4 className="font-semibold text-gray-900 mb-2">Search Summary</h4>
        <div className="space-y-2 text-sm text-gray-700">
          <div><strong>For:</strong> {recipientName}</div>
          <div><strong>Occasion:</strong> {botState.occasion}</div>
          <div><strong>Budget:</strong> ${botState.budget?.min} - ${botState.budget?.max}</div>
          {botState.selectedFriend && (
            <div><strong>Based on:</strong> Wishlist & preferences</div>
          )}
          {botState.recipientDetails && (
            <div><strong>Interests:</strong> {botState.recipientDetails.interests.join(", ")}</div>
          )}
        </div>
      </div>

      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
        <div className="flex items-center gap-2 mb-2">
          <ShoppingCart className="h-4 w-4 text-purple-600" />
          <span className="text-sm font-medium text-purple-800">Search Query Generated</span>
        </div>
        <p className="text-xs text-purple-700 bg-white px-2 py-1 rounded border">
          "{botState.searchQuery}"
        </p>
      </div>

      <div className="space-y-3 flex-1">
        <Button 
          onClick={handleViewInMarketplace}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          View Recommendations in Marketplace
        </Button>

        <Button 
          onClick={handleStartOver}
          variant="outline"
          className="w-full hover:bg-purple-50 hover:border-purple-300"
        >
          Find Gifts for Someone Else
        </Button>
      </div>

      <div className="text-center">
        <p className="text-xs text-gray-500">
          🎁 Happy gift hunting! The marketplace will show you curated results.
        </p>
      </div>
    </div>
  );
};

export default ResultsStep;
