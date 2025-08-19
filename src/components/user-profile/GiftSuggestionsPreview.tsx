import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Sparkles } from "lucide-react";
import { useEnhancedGiftRecommendations } from "@/hooks/useEnhancedGiftRecommendations";

interface GiftSuggestionsPreviewProps {
  interests: string[];
  profileId: string;
  profileName: string;
  isOwnProfile: boolean;
}

const GiftSuggestionsPreview = ({ 
  interests, 
  profileId, 
  profileName, 
  isOwnProfile 
}: GiftSuggestionsPreviewProps) => {
  if (isOwnProfile || !interests?.length) return null;

  const { 
    generateRecommendations, 
    recommendations, 
    loading,
    hasRecommendations 
  } = useEnhancedGiftRecommendations();

  const [hasGenerated, setHasGenerated] = useState(false);

  useEffect(() => {
    if (!hasGenerated && interests.length > 0) {
      const searchContext = {
        recipient_name: profileName,
        interests: interests,
        occasion: "general",
        budget_range: "25-100"
      };
      
      generateRecommendations(
        searchContext,
        profileId,
        `preview-${profileId}`,
        { maxRecommendations: 3, fallbackToGeneric: true }
      );
      setHasGenerated(true);
    }
  }, [interests, profileId, profileName, generateRecommendations, hasGenerated]);

  const handleSeeMoreSuggestions = () => {
    console.log(`Getting more gift suggestions for ${profileName}`);
    window.dispatchEvent(new CustomEvent('triggerNicole', {
      detail: {
        capability: 'gift-recommendations',
        source: 'suggestions-preview',
        autoGreeting: true,
        greetingContext: {
          greeting: 'comprehensive-recommendations',
          recipientName: profileName,
          interests: interests,
          activeMode: 'gift-advisor'
        }
      }
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Gift Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Bot className="h-4 w-4 animate-pulse" />
              Generating personalized suggestions...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasRecommendations) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Gift Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-4">
              Get AI-powered gift suggestions based on {profileName}'s interests
            </p>
            <Button
              onClick={handleSeeMoreSuggestions}
              className="flex items-center gap-2"
            >
              <Bot className="h-4 w-4" />
              Get Gift Ideas
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const previewRecommendations = recommendations.slice(0, 2);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Gift Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {previewRecommendations.map((rec, index) => (
            <div 
              key={rec.productId || index} 
              className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg"
            >
              {rec.imageUrl && (
                <img 
                  src={rec.imageUrl} 
                  alt={rec.title}
                  className="w-12 h-12 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <div className="font-medium text-sm">{rec.title}</div>
                {rec.price && (
                  <div className="text-primary font-semibold text-sm">
                    ${rec.price}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          <div className="pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeeMoreSuggestions}
              className="w-full flex items-center gap-2"
            >
              <Bot className="h-4 w-4" />
              See More Suggestions
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GiftSuggestionsPreview;