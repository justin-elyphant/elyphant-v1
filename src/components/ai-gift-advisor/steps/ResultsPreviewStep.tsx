
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { ExternalLink, Lock, Sparkles, ArrowRight, Eye } from "lucide-react";
import { useGiftAdvisorBot } from "../hooks/useGiftAdvisorBot";

type ResultsPreviewStepProps = ReturnType<typeof useGiftAdvisorBot>;

const ResultsPreviewStep = ({ botState, closeBot }: ResultsPreviewStepProps) => {
  const navigate = useNavigate();

  const handleSignUp = () => {
    closeBot();
    navigate("/auth");
  };

  const handleViewLimitedResults = () => {
    if (botState.searchQuery) {
      closeBot();
      navigate(`/marketplace?search=${encodeURIComponent(botState.searchQuery)}`);
    }
  };

  const recipientName = botState.recipientDetails?.name || "recipient";

  // Mock preview data to show what's possible
  const previewStats = {
    totalRecommendations: 47,
    friendBasedMatches: 12,
    wishlistItems: 8,
    priceMatches: 35
  };

  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Eye className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-foreground">Preview Generated!</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Here's a preview of what we found for {recipientName}.
        </p>
      </div>

      {/* Preview Statistics */}
      <div className="bg-muted p-4 rounded-lg border border-border relative">
        <h4 className="font-semibold text-foreground mb-3">AI Recommendations Summary</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-background p-2 rounded border">
            <div className="font-bold text-blue-600">{previewStats.totalRecommendations}</div>
            <div className="text-muted-foreground">Total matches</div>
          </div>
          <div className="bg-background p-2 rounded border relative">
            <div className="font-bold text-purple-600">{previewStats.friendBasedMatches}</div>
            <div className="text-muted-foreground">Friend-based</div>
            <Lock className="h-3 w-3 absolute top-1 right-1 text-muted-foreground" />
          </div>
          <div className="bg-background p-2 rounded border relative">
            <div className="font-bold text-green-600">{previewStats.wishlistItems}</div>
            <div className="text-muted-foreground">From wishlists</div>
            <Lock className="h-3 w-3 absolute top-1 right-1 text-muted-foreground" />
          </div>
          <div className="bg-background p-2 rounded border">
            <div className="font-bold text-orange-600">{previewStats.priceMatches}</div>
            <div className="text-muted-foreground">In budget</div>
          </div>
        </div>
      </div>

      {/* Blurred Preview Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-foreground">Top Recommendations</h4>
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <Lock className="h-3 w-3 mr-1" />
            Premium
          </Badge>
        </div>
        
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="relative">
              <div className="bg-background p-3 rounded-lg border blur-sm">
                <div className="flex gap-3">
                  <div className="w-12 h-12 bg-muted rounded"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded mb-1"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                  <div className="h-4 bg-green-200 rounded w-16"></div>
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Lock className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sign Up CTA */}
      <div className="bg-elyphant-gradient p-4 rounded-lg text-white">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5" />
          <span className="font-semibold">Unlock All {previewStats.totalRecommendations} Recommendations</span>
        </div>
        <p className="text-sm text-white/90 mb-3">
          Sign up to see personalized results, friend-based matches, and save your searches.
        </p>
        <Button 
          onClick={handleSignUp}
          className="w-full bg-background text-purple-600 hover:bg-white/90"
        >
          <ArrowRight className="h-4 w-4 mr-2" />
          Sign Up & See All Results
        </Button>
      </div>

      {/* Limited Access Option */}
      <div className="space-y-3">
        <Button 
          onClick={handleViewLimitedResults}
          variant="outline"
          className="w-full hover:bg-muted/50"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          View Basic Results in Marketplace
        </Button>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            💡 Sign up to unlock friend wishlists, save searches, and get smarter recommendations!
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResultsPreviewStep;
