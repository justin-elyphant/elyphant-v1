import React, { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNicoleTagIntegration } from "@/hooks/useNicoleTagIntegration";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
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
  const { getUserTagInsights } = useNicoleTagIntegration();
  const { recentlyViewed } = useRecentlyViewed();
  const { products, isLoading: productsLoading } = useProducts();
  const { quickAddToWishlist, wishlists } = useWishlist();
  
  // Track categories to avoid re-computation causing infinite loops
  const categoriesRef = useRef<string[]>([]);
  
  // Build personalization context from user data - stable dependencies only
  const tagInsights = getUserTagInsights;
  
  // Memoize preferred categories with stable reference
  const preferredCategories = useMemo(() => {
    const categories = [
      ...tagInsights.preferredCategories.map((c: any) => c.category),
      ...tagInsights.commonTags.slice(0, 3).map((t: any) => t.tag)
    ].filter(Boolean);
    
    // Only update ref if categories actually changed
    const categoriesStr = categories.join(',');
    const prevStr = categoriesRef.current.join(',');
    if (categoriesStr !== prevStr) {
      categoriesRef.current = categories;
    }
    return categoriesRef.current;
  }, [tagInsights.preferredCategories, tagInsights.commonTags]);
  
  const hasData = preferredCategories.length > 0 || recentlyViewed.length >= 3;

  // Get recommendations directly from products - no external hook to avoid infinite loop
  const recommendations = useMemo(() => {
    if (!products || products.length === 0) return [];
    
    // Score products based on relevance
    const scoredProducts = products.map(product => {
      let score = 0;
      score += (product.rating || product.stars || 0) * 2;
      if (product.isBestSeller) score += 10;
      
      const productCategories = [
        product.category,
        product.category_name,
        ...(product.tags || [])
      ].filter(Boolean);
      
      preferredCategories.forEach(category => {
        if (category && productCategories.some(pc => 
          pc && pc.toLowerCase().includes(category.toLowerCase())
        )) {
          score += 15;
        }
      });
      
      return { product, score };
    });
    
    return scoredProducts
      .sort((a, b) => b.score - a.score)
      .slice(0, maxProducts)
      .map(item => item.product);
  }, [products, preferredCategories, maxProducts]);

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
  if (!hasData && !productsLoading) {
    return null;
  }

  // Don't show if no recommendations and done loading
  if (!productsLoading && recommendations.length === 0) {
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
              <h3 className="font-semibold text-foreground">
                Nicole AI Suggestions
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
        {productsLoading ? (
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
