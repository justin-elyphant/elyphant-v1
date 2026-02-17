
import React, { useMemo } from "react";
import { Product } from "@/types/product";
import { formatPrice } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import OptimizedImage from "@/components/ui/optimized-image";
import UnifiedProductCard from "../UnifiedProductCard";
import { useVirtualInfiniteScroll } from "@/hooks/useVirtualScroll";
import { triggerHapticFeedback, HapticPatterns } from "@/utils/haptics";

interface MobileProductGridProps {
  products: Product[];
  onProductClick: (productId: string) => void;
  getProductStatus: (product: Product) => { badge: string; color: string } | null;
  isLoading: boolean;
  hasMore: boolean;
  onRefresh?: () => void;
  onLoadMore?: () => void;
}

const ITEM_HEIGHT = 320; // Increased height to accommodate the add to cart button
const CONTAINER_HEIGHT = typeof window !== 'undefined' ? window.innerHeight - 200 : 600;

const MobileProductGrid = ({
  products,
  onProductClick,
  getProductStatus,
  isLoading,
  hasMore,
  onRefresh,
  onLoadMore
}: MobileProductGridProps) => {
  
  // Enhanced click handler with haptic feedback
  const handleProductClick = (productId: string) => {
    triggerHapticFeedback(HapticPatterns.cardTap);
    onProductClick(productId);
  };
  
  const handleWishlistClick = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    triggerHapticFeedback(HapticPatterns.addToCart);
    console.log('Add to wishlist:', productId);
  };

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  // Memoize product pairs for 2-column layout
  const productPairs = useMemo(() => {
    const pairs = [];
    for (let i = 0; i < products.length; i += 2) {
      pairs.push(products.slice(i, i + 2));
    }
    return pairs;
  }, [products]);
  
  // Use virtual scrolling for large lists
  const shouldUseVirtualScrolling = products.length > 50;
  
  const virtualScroll = useVirtualInfiniteScroll(
    shouldUseVirtualScrolling ? productPairs : [],
    {
      itemHeight: ITEM_HEIGHT,
      containerHeight: CONTAINER_HEIGHT,
      overscan: 3,
      hasNextPage: hasMore,
      isLoading,
      onLoadMore,
      threshold: 5
    }
  );

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-2 gap-3 p-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="animate-pulse">
          <CardContent className="p-0">
            <div className="aspect-square bg-gray-200 rounded-t-lg mb-3"></div>
            <div className="p-3 space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Empty state
  if (!isLoading && (!products || products.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 safe-area-inset">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-500 mb-4 leading-relaxed">Try adjusting your search or filters to find what you're looking for.</p>
          {onRefresh && (
            <Button 
              onClick={() => {
                triggerHapticFeedback(HapticPatterns.buttonTap);
                onRefresh();
              }} 
              variant="outline"
              className="touch-target-48"
            >
              Refresh
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Product card component
  const ProductCard = ({ product, isVirtual = false }: { product: Product; isVirtual?: boolean }) => {
    const status = getProductStatus(product);
    const productId = product.product_id || product.id;
    const productName = product.title || product.name;
    
    return (
      <Card 
        className="cursor-pointer hover:shadow-md transition-shadow touch-manipulation tap-feedback safe-area-inset h-full flex flex-col"
        onClick={() => handleProductClick(productId)}
        role="button"
        tabIndex={0}
        aria-label={`View details for ${productName}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleProductClick(productId);
          }
        }}
      >
        <CardContent className="p-0">
          {/* Product Image with optimization */}
          <div className="relative aspect-square overflow-hidden rounded-t-lg bg-gray-100">
            <OptimizedImage
              src={product.image}
              alt={productName}
              width={200}
              height={200}
              priority={!isVirtual}
              compressionLevel="medium"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
              fallbackSrc="/placeholder.svg"
            />
            
            {/* Status Badge */}
            {status && (
              <Badge 
                className={`absolute top-2 left-2 text-xs px-2 py-1 ${status.color}`}
                aria-label={`Product status: ${status.badge}`}
              >
                {status.badge}
              </Badge>
            )}

            {/* Wishlist Button with haptic feedback */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 w-8 h-8 p-0 bg-white/80 hover:bg-white touch-target-44"
              onClick={(e) => handleWishlistClick(e, productId)}
              aria-label={`Add ${productName} to wishlist`}
              hapticFeedback="addToCart"
            >
              <Heart className="w-4 h-4" />
            </Button>
          </div>

          {/* Product Info */}
          <div className="p-3 space-y-2 flex-1 flex flex-col">
            <h3 className="font-medium text-sm line-clamp-2 mb-1 leading-tight">
              {productName}
            </h3>
            
            {product.vendor && (
              <p className="text-xs text-gray-500 mb-2">{product.vendor}</p>
            )}

            {/* Rating with accessibility */}
            {(product.rating || product.stars) && (
              <div className="flex items-center gap-1 mb-2" role="img" aria-label={`Rating: ${product.rating || product.stars} stars`}>
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                <span className="text-xs text-gray-600">
                  {product.rating || product.stars}
                  {(product.reviewCount || product.num_reviews) && (
                    <span className="text-gray-400 ml-1">
                      ({product.reviewCount || product.num_reviews})
                    </span>
                  )}
                </span>
              </div>
            )}

            {/* Price */}
            <div className="font-semibold text-lg text-green-600 mb-2" aria-label={`Price: ${formatPrice(product.price)}`}>
              {formatPrice(product.price)}
            </div>

            {/* Add to Cart Button - keeping existing implementation */}
            <Button
              variant="outline"
              size="sm"
              className="w-full h-9 text-sm font-medium border-gray-200 hover:border-gray-300 active:scale-[0.96] transition-transform duration-100"
              onClick={handleAddToCartClick}
            >
              Add to Cart
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Loading state
  if (isLoading && products.length === 0) {
    return <LoadingSkeleton />;
  }

  // Virtual scrolling for large lists
  if (shouldUseVirtualScrolling) {
    return (
      <div 
        className="relative"
        style={{ height: CONTAINER_HEIGHT }}
        role="region"
        aria-label="Product grid with virtual scrolling"
      >
        <div 
          {...virtualScroll.scrollElementProps}
          className="overflow-auto safe-area-inset"
          style={{ ...virtualScroll.scrollElementProps.style, height: '100%' }}
        >
          <div style={{ height: virtualScroll.totalHeight, position: 'relative' }}>
            {virtualScroll.virtualItems.map(({ index, start, item: productPair }) => (
              <div
                key={index}
                style={{
                  position: 'absolute',
                  top: start,
                  left: 0,
                  right: 0,
                  height: ITEM_HEIGHT
                }}
                className="grid grid-cols-2 gap-3 px-4 items-stretch"
              >
                {productPair.map((product: Product) => (
                  <ProductCard key={product.product_id || product.id} product={product} isVirtual={true} />
                ))}
              </div>
            ))}
          </div>
        </div>
        
        {/* Loading indicator for infinite scroll */}
        {isLoading && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="bg-white rounded-full p-2 shadow-lg">
              <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Standard grid for smaller lists
  return (
    <div className="safe-area-inset" role="region" aria-label="Product grid">
      <div className="grid grid-cols-2 gap-3 p-4 mobile-grid-optimized items-stretch">
        {products.map((product) => (
          <ProductCard 
            key={product.product_id || product.id} 
            product={product} 
          />
        ))}
      </div>
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center py-4">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"
               role="status" 
               aria-label="Loading more products" />
        </div>
      )}
    </div>
  );
};

export default MobileProductGrid;
