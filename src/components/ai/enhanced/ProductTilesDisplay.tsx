import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, ShoppingCart, ExternalLink, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Product } from '@/types/product';
import { formatPrice } from '@/lib/utils';

interface ProductTilesDisplayProps {
  products: Product[];
  onAddToWishlist?: (product: Product) => void;
  onSendGift?: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
  className?: string;
}

const ProductTilesDisplay: React.FC<ProductTilesDisplayProps> = ({
  products,
  onAddToWishlist,
  onSendGift,
  onViewDetails,
  className = ""
}) => {
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -280, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 280, behavior: 'smooth' });
    }
  };

  // Use centralized formatPrice from utils

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />);
    }
    
    if (hasHalfStar) {
      stars.push(<Star key="half" className="w-3 h-3 fill-yellow-400/50 text-yellow-400" />);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-3 h-3 text-gray-300" />);
    }

    return <div className="flex items-center gap-0.5">{stars}</div>;
  };

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No products found</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Navigation Arrows */}
      {showLeftArrow && (
        <Button
          variant="outline"
          size="icon"
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm shadow-md hover:bg-white"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      )}
      
      {showRightArrow && (
        <Button
          variant="outline"
          size="icon"
          onClick={scrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm shadow-md hover:bg-white"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.slice(0, 8).map((product, index) => (
          <Card
            key={product.product_id || product.id || index}
            className="flex-shrink-0 w-64 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg"
            onClick={() => onViewDetails?.(product)}
          >
            <CardContent className="p-3">
              {/* Product Image */}
              <div className="relative mb-3">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={product.image || product.images?.[0] || '/placeholder.svg'}
                    alt={product.title || product.name || 'Product'}
                    className="w-full h-full object-cover transition-transform duration-200 hover:scale-110"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                </div>
                
                {/* Best Seller Badge */}
                {(product.isBestSeller || product.bestSellerType) && (
                  <Badge
                    variant="secondary"
                    className="absolute top-2 left-2 text-xs bg-orange-500 text-white"
                  >
                    {product.badgeText || 'Best Seller'}
                  </Badge>
                )}
              </div>

              {/* Product Info */}
              <div className="space-y-2">
                <h3 className="font-medium text-sm line-clamp-2 leading-tight">
                  {product.title || product.name || 'Unnamed Product'}
                </h3>
                
                {product.brand && (
                  <p className="text-xs text-muted-foreground">{product.brand}</p>
                )}

                {/* Rating */}
                {(product.rating || product.stars) && (
                  <div className="flex items-center gap-1">
                    {renderStars(product.rating || product.stars)}
                    {(product.reviewCount || product.num_reviews) && (
                      <span className="text-xs text-muted-foreground">
                        ({product.reviewCount || product.num_reviews})
                      </span>
                    )}
                  </div>
                )}

                {/* Price */}
                <div className="font-semibold text-primary">
                  {formatPrice(product.price)}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-1 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToWishlist?.(product);
                    }}
                    className="flex-1 h-8 text-xs"
                  >
                    <Heart className="w-3 h-3 mr-1" />
                    Wishlist
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSendGift?.(product);
                    }}
                    className="flex-1 h-8 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                  >
                    <ShoppingCart className="w-3 h-3 mr-1" />
                    Gift
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Show more indicator */}
      {products.length > 8 && (
        <div className="text-center mt-3">
          <p className="text-xs text-muted-foreground">
            Showing 8 of {products.length} products
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductTilesDisplay;