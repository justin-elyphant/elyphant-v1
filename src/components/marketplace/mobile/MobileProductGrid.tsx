
import React from "react";
import { Product } from "@/types/product";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileProductGridProps {
  products: Product[];
  onProductClick: (productId: string) => void;
  getProductStatus: (product: Product) => { badge: string; color: string } | null;
  isLoading: boolean;
  hasMore: boolean;
  onRefresh?: () => void;
}

const MobileProductGrid = ({
  products,
  onProductClick,
  getProductStatus,
  isLoading,
  hasMore,
  onRefresh
}: MobileProductGridProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 p-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-0">
              <div className="aspect-square bg-gray-200 rounded-t-lg mb-3"></div>
              <div className="p-3">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-2 w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your search or filters to find what you're looking for.</p>
          {onRefresh && (
            <Button onClick={onRefresh} variant="outline">
              Refresh
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {products.map((product) => {
        const status = getProductStatus(product);
        const productId = product.product_id || product.id;
        const productName = product.title || product.name;
        
        return (
          <Card 
            key={productId} 
            className="cursor-pointer hover:shadow-md transition-shadow touch-manipulation"
            onClick={() => onProductClick(productId)}
          >
            <CardContent className="p-0">
              {/* Product Image */}
              <div className="relative aspect-square overflow-hidden rounded-t-lg bg-gray-100">
                <img
                  src={product.image}
                  alt={productName}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y5ZmFmYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOWNhM2FmIiBmb250LXNpemU9IjE0Ij5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                  }}
                />
                
                {/* Status Badge */}
                {status && (
                  <Badge 
                    className={`absolute top-2 left-2 text-xs px-2 py-1 ${status.color}`}
                  >
                    {status.badge}
                  </Badge>
                )}

                {/* Wishlist Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 w-8 h-8 p-0 bg-white/80 hover:bg-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle wishlist action
                    console.log('Add to wishlist:', productId);
                  }}
                >
                  <Heart className="w-4 h-4" />
                </Button>
              </div>

              {/* Product Info */}
              <div className="p-3">
                <h3 className="font-medium text-sm line-clamp-2 mb-1 leading-tight">
                  {productName}
                </h3>
                
                {product.vendor && (
                  <p className="text-xs text-gray-500 mb-2">{product.vendor}</p>
                )}

                {/* Rating */}
                {(product.rating || product.stars) && (
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
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
                <div className="font-semibold text-lg text-green-600">
                  ${product.price?.toFixed(2)}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default MobileProductGrid;
