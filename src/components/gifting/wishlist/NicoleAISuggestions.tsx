import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNicoleTagIntegration } from "@/hooks/useNicoleTagIntegration";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { usePersonalizedRecommendations } from "@/hooks/usePersonalizedRecommendations";
import { useProducts } from "@/contexts/ProductContext";
import { useWishlist } from "@/components/gifting/hooks/useWishlist";
import { triggerHapticFeedback, HapticPatterns } from "@/utils/haptics";
import { toast } from "sonner";
import SuggestionProductCard from "./SuggestionProductCard";

interface NicoleAISuggestionsProps {
  className?: string;
  maxProducts?: number;
}

const NicoleAISuggestions: React.FC<NicoleAISuggestionsProps> = ({
  className,
  maxProducts = 8
}) => {
  const navigate = useNavigate();
  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  
  // Data sources
  const { getUserTagInsights, getPersonalizedGiftTags } = useNicoleTagIntegration();
  const { recentlyViewed } = useRecentlyViewed();
  const { products, isLoading: productsLoading } = useProducts();
  const { quickAddToWishlist, wishlists } = useWishlist();
  
  // Build personalization context from user data
  const personalizationContext = useMemo(() => {
    const tagInsights = getUserTagInsights;
    const giftTags = getPersonalizedGiftTags({});
    
    // Extract categories from wishlists and recently viewed
    const preferredCategories = [
      ...tagInsights.preferredCategories.map((c: any) => c.category),
      ...tagInsights.commonTags.slice(0, 3).map((t: any) => t.tag)
    ].filter(Boolean);
    
    return {
      preferredCategories,
      confidence: giftTags.confidence,
      reasoning: giftTags.reasoning,
      hasData: preferredCategories.length > 0 || recentlyViewed.length >= 3
    };
  }, [getUserTagInsights, getPersonalizedGiftTags, recentlyViewed]);

  // Get personalized recommendations
  const { recommendations, isLoading: recommendationsLoading } = usePersonalizedRecommendations(
    products,
    {
      limit: maxProducts,
      preferredCategories: personalizationContext.preferredCategories,
      strategy: 'personalized',
      includeViewedProducts: false
    }
  );

  // Handle quick add to wishlist
  const handleQuickAdd = async (product: any) => {
    const productId = product.product_id || product.id;
    if (!productId) return;
    
    setAddingProductId(productId);
    triggerHapticFeedback(HapticPatterns.wishlistAdd);
    
    try {
      const success = await quickAddToWishlist(productId);
      
      if (success) {
        toast.success("Added to wishlist");
      }
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      toast.error("Failed to add to wishlist");
      triggerHapticFeedback(HapticPatterns.errorAction);
    } finally {
      setAddingProductId(null);
    }
  };

  // Handle see more click
  const handleSeeMore = () => {
    triggerHapticFeedback(HapticPatterns.buttonTap);
    navigate('/marketplace?recommended=true');
  };

  // Don't show if user has no personalization data
  if (!personalizationContext.hasData && !productsLoading) {
    return null;
  }

  // Don't show if no recommendations and done loading
  const isLoading = productsLoading || recommendationsLoading;
  if (!isLoading && recommendations.length === 0) {
    return null;
  }

  // Subtitle based on context
  const getSubtitle = () => {
    const recentCount = recentlyViewed.length;
    const wishlistCount = wishlists?.length || 0;
    
    if (wishlistCount > 0 && recentCount > 0) {
      return "Based on your wishlists and browsing";
    } else if (wishlistCount > 0) {
      return "Based on your wishlist patterns";
    } else if (recentCount > 0) {
      return "Based on items you've viewed";
    }
    return "Personalized picks for you";
  };

  return (
    <Card className={cn("border-0 bg-muted/30", className)}>
      <CardContent className="p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
              <Sparkles className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                Nicole AI Suggestions
                {personalizationContext.confidence >= 0.7 && (
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(personalizationContext.confidence * 100)}% match
                  </Badge>
                )}
              </h3>
              <p className="text-xs text-muted-foreground">
                {getSubtitle()}
              </p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground min-h-[44px] touch-manipulation"
            onClick={handleSeeMore}
          >
            See More
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Products Carousel */}
        {isLoading ? (
          // Loading skeleton
          <div 
            className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 md:-mx-6 md:px-6"
            style={{ 
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex-shrink-0 w-36">
                <div className="aspect-square rounded-xl bg-muted animate-pulse mb-2" />
                <div className="h-4 bg-muted rounded animate-pulse mb-1" />
                <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <div 
            className={cn(
              "flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 md:-mx-6 md:px-6",
              "snap-x snap-mandatory"
            )}
            style={{ 
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              overscrollBehaviorX: 'contain'
            }}
          >
            {recommendations.map((product) => (
              <SuggestionProductCard
                key={product.product_id || product.id}
                product={product}
                onQuickAdd={handleQuickAdd}
                isAdding={addingProductId === (product.product_id || product.id)}
                className="snap-start"
              />
            ))}
            
            {/* See More Card */}
            <div 
              className="flex-shrink-0 w-36 touch-manipulation cursor-pointer group"
              onClick={handleSeeMore}
            >
              <div className="aspect-square rounded-xl bg-gradient-to-br from-muted to-muted/50 flex flex-col items-center justify-center border border-dashed border-border hover:border-primary/50 transition-colors">
                <ArrowRight className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors text-center px-2">
                  Browse More
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NicoleAISuggestions;
