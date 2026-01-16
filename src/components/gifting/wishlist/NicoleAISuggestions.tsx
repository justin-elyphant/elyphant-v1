import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, TrendingUp, History, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNicoleRecommendations } from "@/hooks/useNicoleRecommendations";
import { useWishlist } from "@/components/gifting/hooks/useWishlist";
import { triggerHapticFeedback, HapticPatterns } from "@/utils/haptics";
import { toast } from "sonner";
import AirbnbStyleProductCard from "@/components/marketplace/AirbnbStyleProductCard";

interface NicoleAISuggestionsProps {
  className?: string;
  maxProducts?: number;
  variant?: "compact" | "full";
}

interface ProductSection {
  id: string;
  title: string;
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
  
  // Use the new Nicole recommendations hook
  const { 
    products, 
    sections, 
    isLoading, 
    error, 
    refreshRecommendations 
  } = useNicoleRecommendations();

  // Responsive product counts per section based on maxProducts hint
  const productsPerSection = useMemo(() => {
    // Determine responsive count: mobile=6, tablet=6, desktop=8
    // Use maxProducts as a hint (16 = desktop, 12 = tablet, 6 = mobile)
    if (maxProducts >= 16) return 8; // Desktop
    if (maxProducts >= 12) return 6; // Tablet
    return 6; // Mobile
  }, [maxProducts]);

  // Build sections for full variant
  const displaySections: ProductSection[] = useMemo(() => {
    if (variant === "compact") return [];
    
    return [
      {
        id: "search",
        title: "Based on Your Searches",
        icon: <History className="h-4 w-4" />,
        products: sections.searchBased.slice(0, productsPerSection),
        emptyMessage: "Search for products to get personalized picks"
      },
      {
        id: "viewed",
        title: "Similar to Items You Viewed",
        icon: <Sparkles className="h-4 w-4" />,
        products: sections.viewedBased.slice(0, productsPerSection),
        emptyMessage: "Browse products to see similar recommendations"
      },
      {
        id: "trending",
        title: "Trending Gifts",
        icon: <TrendingUp className="h-4 w-4" />,
        products: sections.trending.slice(0, productsPerSection),
        emptyMessage: "No trending products available"
      }
    ].filter(section => variant === "full" || section.products.length > 0);
  }, [sections, variant, productsPerSection]);

  // For compact mode, use mixed products
  const compactProducts = useMemo(() => {
    return products.slice(0, maxProducts);
  }, [products, maxProducts]);

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

  // Render product grid - responsive columns
  const renderProductGrid = (productList: any[]) => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
      {productList.map((product) => (
        <AirbnbStyleProductCard
          key={product.product_id || product.id}
          product={product}
          onProductClick={() => {}}
          context="wishlist"
        />
      ))}
    </div>
  );

  // Loading skeleton - responsive grid version
  const renderSkeleton = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].slice(0, maxProducts >= 16 ? 8 : maxProducts >= 12 ? 6 : 4).map((i) => (
        <div key={i} className="rounded-xl overflow-hidden">
          <div className="aspect-square bg-muted animate-pulse" />
          <div className="p-3 space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
          </div>
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

  // Full variant with sections
  if (variant === "full") {
    return (
      <div className={cn("space-y-8", className)}>
        {/* Header with refresh button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
              <Sparkles className="h-4 w-4 text-purple-600" />
            </div>
            <h3 className="font-semibold text-foreground">
              Nicole AI Picks
            </h3>
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
          <div className="space-y-8">
            {[1, 2, 3].map(i => (
              <div key={i}>
                <div className="h-5 bg-muted rounded w-40 mb-4 animate-pulse" />
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
          <div key={section.id} className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-muted">
                {section.icon}
              </div>
              <h4 className="font-medium text-foreground">{section.title}</h4>
            </div>
            
            {section.products.length > 0 ? (
              renderProductGrid(section.products)
            ) : (
              <p className="text-sm text-muted-foreground italic py-6 text-center bg-muted/30 rounded-xl">
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
            <h3 className="font-semibold text-foreground">
              Nicole AI Suggestions
            </h3>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground min-h-[44px] touch-manipulation"
            onClick={handleSeeMore}
          >
            See More
          </Button>
        </div>

        {/* Products Grid */}
        {isLoading ? renderSkeleton() : renderProductGrid(compactProducts)}
      </CardContent>
    </Card>
  );
};

export default NicoleAISuggestions;
