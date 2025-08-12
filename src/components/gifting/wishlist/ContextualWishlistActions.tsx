import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Clock, TrendingUp, Users, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface ContextualWishlistActionsProps {
  recentlyViewedCount?: number;
  trendingCategories?: string[];
  collaborativeWishlists?: number;
  className?: string;
}

const ContextualWishlistActions: React.FC<ContextualWishlistActionsProps> = ({
  recentlyViewedCount = 0,
  trendingCategories = [],
  collaborativeWishlists = 0,
  className
}) => {
  const navigate = useNavigate();

  const contextualActions = [
    {
      title: "Continue Shopping",
      description: `${recentlyViewedCount} items waiting to be added`,
      icon: ShoppingBag,
      action: () => navigate('/marketplace'),
      variant: "default" as const,
      enabled: recentlyViewedCount > 0
    },
    {
      title: "Recently Added",
      description: "See your latest wishlist additions",
      icon: Clock,
      action: () => {},
      variant: "secondary" as const,
      enabled: true
    },
    {
      title: "Trending Now",
      description: trendingCategories.length > 0 
        ? `Popular: ${trendingCategories.slice(0, 2).join(', ')}`
        : "Discover what's popular",
      icon: TrendingUp,
      action: () => navigate('/marketplace?sort=trending'),
      variant: "secondary" as const,
      enabled: true
    },
    {
      title: "Collaborative Lists",
      description: collaborativeWishlists > 0 
        ? `${collaborativeWishlists} shared with you`
        : "Create shared wishlists",
      icon: Users,
      action: () => {},
      variant: "secondary" as const,
      enabled: true
    }
  ];

  return (
    <div className={cn("space-y-4", className)}>
      {/* Quick Actions */}
      <Card className="contextual-section">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {contextualActions
            .filter(action => action.enabled)
            .map((action, index) => (
            <Button
              key={index}
              variant={action.variant}
              className={cn(
                "w-full justify-start h-auto p-3",
                action.variant === "default" && action.title === "Continue Shopping" && "bg-primary hover:bg-primary/90 text-primary-foreground"
              )}
              onClick={action.action}
            >
              <div className="flex items-center gap-3">
                <action.icon className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium text-sm">{action.title}</div>
                  <div className="text-xs opacity-75">{action.description}</div>
                </div>
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Smart Category Tags */}
      {trendingCategories.length > 0 && (
        <Card className="contextual-section">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Trending Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {trendingCategories.slice(0, 6).map((category, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="smart-tag cursor-pointer"
                  onClick={() => navigate(`/marketplace?category=${encodeURIComponent(category)}`)}
                >
                  {category}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ContextualWishlistActions;