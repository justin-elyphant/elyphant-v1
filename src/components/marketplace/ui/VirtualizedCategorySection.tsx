import React, { useMemo, useState } from "react";
import { Product } from "@/types/product";
import UnifiedProductCard from "../UnifiedProductCard";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useVirtualScroll } from "@/hooks/useVirtualScroll";

interface VirtualizedCategorySectionProps {
  title: string;
  subtitle: string;
  products: Product[];
  isLoading?: boolean;
  onSeeAll?: () => void;
  onProductClick?: (product: Product) => void;
  showSeeAll?: boolean;
  onAddToCart?: (product: Product) => void;
  onShare?: (product: Product) => void;
  maxInitialItems?: number;
}

export const VirtualizedCategorySection: React.FC<VirtualizedCategorySectionProps> = ({
  title,
  subtitle,
  products,
  isLoading = false,
  onSeeAll,
  onProductClick,
  showSeeAll = true,
  onAddToCart,
  onShare,
  maxInitialItems = 5
}) => {
  const [showAllProducts, setShowAllProducts] = useState(false);
  
  // Limit initial products for better performance
  const displayProducts = useMemo(() => {
    if (showAllProducts) return products;
    return products.slice(0, maxInitialItems);
  }, [products, showAllProducts, maxInitialItems]);

  // Memoized product cards for better performance
  const productCards = useMemo(() => 
    displayProducts.map((product, index) => ({
      id: product.product_id || product.id || index,
      product,
      index
    })),
    [displayProducts]
  );

  if (isLoading) {
    return (
      <div className="space-y-6 border-b border-border/20 pb-8 last:border-b-0">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-8 bg-muted/50 rounded-md w-64 animate-pulse"></div>
            <div className="h-4 bg-muted/30 rounded w-48 animate-pulse"></div>
          </div>
          <div className="h-10 bg-muted/50 rounded-md w-24 animate-pulse"></div>
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[...Array(maxInitialItems)].map((_, i) => (
            <div 
              key={i} 
              className="flex-shrink-0 w-48 h-64 bg-muted/50 rounded-lg animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="space-y-6 border-b border-border/20 pb-8 last:border-b-0">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-foreground tracking-tight">{title}</h2>
            <p className="text-muted-foreground text-sm">{subtitle}</p>
          </div>
        </div>
        <div className="text-center py-12 px-6 bg-muted/20 rounded-lg border border-border/30">
          <p className="text-muted-foreground">No products found in this category</p>
        </div>
      </div>
    );
  }

  const handleLoadMore = () => {
    setShowAllProducts(true);
  };

  return (
    <div className="space-y-6 border-b border-border/20 pb-8 last:border-b-0">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-foreground tracking-tight">{title}</h2>
          <p className="text-muted-foreground text-sm">{subtitle}</p>
        </div>
        {showSeeAll && onSeeAll && (
          <Button
            variant="outline"
            onClick={onSeeAll}
            className="flex items-center gap-2 transition-all duration-200 hover:shadow-md border-border/50 hover:border-primary/30"
          >
            See All
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      <div className="relative">
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth">
          {productCards.map(({ id, product, index }) => (
            <div 
              key={id}
              className="flex-shrink-0 w-48 transition-transform duration-200 hover:scale-105"
              style={{ 
                animationDelay: `${index * 30}ms`,
                willChange: 'transform'
              }}
            >
              <UnifiedProductCard
                cardType="general"
                product={product}
                onClick={() => onProductClick?.(product)}
                onAddToCart={onAddToCart}
                onShare={onShare}
              />
            </div>
          ))}
          
          {/* Load more button if there are more products */}
          {!showAllProducts && products.length > maxInitialItems && (
            <div className="flex-shrink-0 w-48 flex items-center justify-center">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                className="h-32 w-full border-2 border-dashed border-border/50 hover:border-primary/50 transition-colors"
              >
                <div className="text-center">
                  <div className="text-sm font-medium">Load More</div>
                  <div className="text-xs text-muted-foreground">
                    +{products.length - maxInitialItems} more
                  </div>
                </div>
              </Button>
            </div>
          )}
        </div>
        
        {/* Gradient fade for overflow indication */}
        <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
      </div>
    </div>
  );
};