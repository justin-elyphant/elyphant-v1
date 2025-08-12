import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, Users, Heart } from "lucide-react";
import { useNicoleTagIntegration } from "@/hooks/useNicoleTagIntegration";

interface TagBasedRecommendationsProps {
  className?: string;
}

const TagBasedRecommendations = ({ className }: TagBasedRecommendationsProps) => {
  const { getUserTagInsights } = useNicoleTagIntegration();
  const userInsights = getUserTagInsights;

  if (!userInsights.commonTags.length) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Your Gift Insights
        </CardTitle>
        <CardDescription>
          Based on your wishlist patterns and preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Popular Tags */}
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Your Most Used Tags
          </h4>
          <div className="flex flex-wrap gap-1">
            {userInsights.commonTags.slice(0, 6).map((tag) => (
              <Badge key={tag.tag} variant="secondary" className="text-xs">
                {tag.tag} ({tag.usage})
              </Badge>
            ))}
          </div>
        </div>

        {/* Preferred Categories */}
        {userInsights.preferredCategories.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Favorite Categories
            </h4>
            <div className="flex flex-wrap gap-1">
              {userInsights.preferredCategories.slice(0, 4).map((category) => (
                <Badge key={category.category} variant="outline" className="text-xs capitalize">
                  {category.category} ({category.frequency})
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Price Patterns */}
        {userInsights.pricePatterns.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Price Preferences</h4>
            <div className="flex flex-wrap gap-1">
              {userInsights.pricePatterns.slice(0, 3).map((priceTag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {priceTag.replace('-', ' - $')}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Nicole Integration CTA */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-2">
            Nicole uses these insights to suggest perfect gifts for your friends and family
          </p>
          <Button variant="outline" size="sm" className="w-full">
            <Users className="h-4 w-4 mr-2" />
            Ask Nicole for Gift Ideas
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TagBasedRecommendations;