import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, TrendingUp, History, Tag, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNicoleRecommendations } from "@/hooks/useNicoleRecommendations";
import { useWishlist } from "@/components/gifting/hooks/useWishlist";
import { triggerHapticFeedback, HapticPatterns } from "@/utils/haptics";
import { toast } from "sonner";
import SuggestionProductCard from "./SuggestionProductCard";

interface NicoleAISuggestionsProps {
  className?: string;
  maxProducts?: number;
  variant?: "compact" | "full";
}

interface ProductSection {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  products: any[];
  emptyMessage: string;
}

const NicoleAISuggestions: React.FC<NicoleAISuggestionsProps> = ({
  className,
  maxProducts = 8,
  variant = "compact"
}) => {
  const navigate = useNavigate();
  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  
  // Use the new Nicole recommendations hook
  const { 
    products, 
    sections, 
    isLoading, 
    error, 
    stats, 
    refreshRecommendations 
  } = useNicoleRecommendations();
  
  const { quickAddToWishlist, wishlists } = useWishlist();

  // Build sections for full variant
  const displaySections: ProductSection[] = useMemo(() => {
    if (variant === "compact") return [];
    
    return [
      {
        id: "search",
        title: "Based on Your Searches",
        subtitle: "Products matching what you've looked for",
        icon: <History className="h-4 w-4" />,
        products: sections.searchBased.slice(0, 6),
        emptyMessage: "Search for products to get personalized picks"
      },
      {
        id: "viewed",
        title: "Similar to Items You Viewed",
        subtitle: "More like what caught your eye",
        icon: <Sparkles className="h-4 w-4" />,
        products: sections.viewedBased.slice(0, 6),
        emptyMessage: "Browse products to see similar recommendations"
      },
      {
        id: "trending",
        title: "Trending Gifts",
        subtitle: "Popular picks from our community",
        icon: <TrendingUp className="h-4 w-4" />,
        products: sections.trending.slice(0, 6),
        emptyMessage: "No trending products available"
      }
    ].filter(section => variant === "full" || section.products.length > 0);
  }, [sections, variant]);

  // For compact mode, use mixed products
  const compactProducts = useMemo(() => {
    return products.slice(0, maxProducts);
  }, [products, maxProducts]);

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

  // Handle refresh
  const handleRefresh = () => {
    triggerHapticFeedback(HapticPatterns.buttonTap);
    refreshRecommendations();
    toast.success("Refreshing recommendations...");
  };

  // Render product carousel
  const renderProductCarousel = (productList: any[], showSeeMore = true) => (
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
      {productList.map((product) => (
        <SuggestionProductCard
          key={product.product_id || product.id}
          product={product}
          onQuickAdd={handleQuickAdd}
          isAdding={addingProductId === (product.product_id || product.id)}
          className="snap-start"
        />
      ))}
      
      {showSeeMore && productList.length >= 4 && (
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
      )}
    </div>
  );

  // Loading skeleton
  const renderSkeleton = () => (
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
  );

  // Empty state
  const renderEmptyState = () => (
    <div className="text-center py-8">
      <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
      <h4 className="font-medium text-foreground mb-1">No recommendations yet</h4>
      <p className="text-sm text-muted-foreground mb-4">
        Search for products or browse the marketplace to get personalized picks
      </p>
      <Button variant="outline" size="sm" onClick={() => navigate('/marketplace')}>
        Explore Marketplace
      </Button>
    </div>
  );

  // Subtitle based on context
  const getSubtitle = () => {
    if (stats) {
      const hitRate = stats.cacheHits > 0 
        ? Math.round((stats.cacheHits / (stats.cacheHits + stats.cacheMisses)) * 100)
        : 0;
      return `${stats.uniqueProducts} personalized picks • ${hitRate}% from cache`;
    }
    return "Personalized picks powered by AI";
  };

  // Full variant with sections
  if (variant === "full") {
    return (
      <div className={cn("space-y-6", className)}>
        {/* Header with refresh button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
              <Sparkles className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Nicole AI Picks
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
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>

        {/* Loading state */}
        {isLoading && products.length === 0 && (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i}>
                <div className="h-5 bg-muted rounded w-40 mb-3 animate-pulse" />
                {renderSkeleton()}
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && products.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-2">{error}</p>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              Try Again
            </Button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && products.length === 0 && renderEmptyState()}

        {/* Sections */}
        {displaySections.map(section => (
          <div key={section.id} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-muted">
                {section.icon}
              </div>
              <div>
                <h4 className="font-medium text-sm text-foreground">{section.title}</h4>
                <p className="text-xs text-muted-foreground">{section.subtitle}</p>
              </div>
            </div>
            
            {section.products.length > 0 ? (
              renderProductCarousel(section.products, false)
            ) : (
              <p className="text-xs text-muted-foreground italic py-4 text-center">
                {section.emptyMessage}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Compact variant (original behavior)
  if (!isLoading && compactProducts.length === 0) {
    return null;
  }

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
        {isLoading ? renderSkeleton() : renderProductCarousel(compactProducts)}
      </CardContent>
    </Card>
  );
};

export default NicoleAISuggestions;
