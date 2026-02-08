
import React, { useMemo } from "react";
import { Product } from "@/types/product";
import UnifiedProductCard from "./UnifiedProductCard";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface CategorySectionProps {
  title: string;
  subtitle: string;
  products: Product[];
  isLoading?: boolean;
  onSeeAll?: () => void;
  onProductClick?: (product: Product) => void;
  showSeeAll?: boolean;
  onAddToCart?: (product: Product) => void;
  onShare?: (product: Product) => void;
  maxItems?: number;
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  title,
  subtitle,
  products,
  isLoading = false,
  onSeeAll,
  onProductClick,
  showSeeAll = true,
  onAddToCart,
  onShare,
  maxItems = 5
}) => {
  // Memoize product cards for better performance - respect maxItems per section
  const memoizedProducts = useMemo(() => {
    const limitedProducts = products.slice(0, maxItems);
    return limitedProducts.map((product, index) => ({ 
      product, 
      index,
      key: product.product_id || product.id || index 
    }));
  }, [products, title, maxItems]);
  if (isLoading) {
    return (
      <div className="space-y-6 border-b border-border/20 pb-8 last:border-b-0">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-8 bg-muted/60 rounded-md w-64 animate-pulse"></div>
            <div className="h-4 bg-muted/40 rounded w-48 animate-pulse"></div>
          </div>
          <div className="h-10 bg-muted/60 rounded-md w-24 animate-pulse"></div>
        </div>
        <div className="flex gap-6 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div 
              key={i} 
              className="flex-shrink-0 w-52 h-64 bg-muted/60 rounded-lg animate-pulse"
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
            className="flex items-center gap-2 transition-all duration-300 hover:shadow-md hover:scale-105 border-border/50 hover:border-primary/30"
          >
            See All
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Button>
        )}
      </div>
      
      <div className="relative">
        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide scroll-smooth" style={{ flexWrap: 'nowrap' }}>
          {memoizedProducts.map(({ product, index, key }) => (
            <div 
              key={key}
              className="flex-shrink-0 w-52 transition-transform duration-200 hover:scale-105"
              style={{ 
                willChange: 'transform',
                minWidth: '208px',
                maxWidth: '208px'
              }}
            >
              <UnifiedProductCard
                cardType="general"
                product={product}
                onClick={() => onProductClick?.(product)}
                onAddToCart={onAddToCart}
                onShare={onShare}
                isInCategorySection={true}
              />
            </div>
          ))}
        </div>
        
        {/* Enhanced gradient fade for overflow indication */}
        <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-background via-background/80 to-transparent pointer-events-none" />
      </div>
    </div>
  );
};
