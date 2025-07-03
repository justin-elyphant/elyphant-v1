
import React from "react";
import { Product } from "@/types/product";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobileProductGridProps {
  products: Product[];
  onProductClick: (productId: string) => void;
  isLoading?: boolean;
  hasMore?: boolean;
  getProductStatus?: (product: Product) => { badge: string; color: string } | null;
}

const MobileProductGrid: React.FC<MobileProductGridProps> = ({
  products,
  onProductClick,
  isLoading = false,
  hasMore = false,
  getProductStatus
}) => {
  const isMobile = useIsMobile();

  if (products.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12">
        <div className="max-w-sm mx-auto">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-500">Try adjusting your search to find what you're looking for.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 2-column grid layout matching your screenshot */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {products.map((product) => {
          const productId = String(product.product_id || product.id);
          const status = getProductStatus?.(product);
          // Fix the price type handling
          const price = typeof product.price === 'number' ? product.price : parseFloat(String(product.price) || '0');
          
          return (
            <Card 
              key={productId} 
              className="cursor-pointer hover:shadow-md transition-shadow border rounded-lg overflow-hidden"
              onClick={() => onProductClick(productId)}
            >
              <CardContent className="p-0">
                {/* Product Image */}
                <div className="relative aspect-square bg-gray-100">
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.title || product.name || "Product"}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  
                  {/* Heart icon for wishlist */}
                  <button 
                    className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow-sm flex items-center justify-center hover:bg-gray-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle wishlist toggle
                    }}
                  >
                    <Heart className="w-4 h-4 text-gray-600" />
                  </button>
                  
                  {/* Status badge */}
                  {status && (
                    <Badge 
                      className="absolute top-2 left-2 text-xs"
                      variant={status.color === 'orange' ? 'destructive' : 'secondary'}
                    >
                      {status.badge}
                    </Badge>
                  )}
                </div>
                
                {/* Product Details */}
                <div className="p-3 space-y-1">
                  {/* Product Title */}
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight">
                    {product.title || product.name || "Untitled Product"}
                  </h3>
                  
                  {/* Rating */}
                  {(product.rating || product.stars) && (
                    <div className="flex items-center gap-1">
                      <div className="flex text-yellow-400">
                        {Array.from({ length: 5 }, (_, i) => (
                          <span key={i} className="text-xs">
                            {i < Math.floor(product.rating || product.stars || 0) ? '★' : '☆'}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">
                        ({product.reviewCount || product.num_reviews || 0})
                      </span>
                    </div>
                  )}
                  
                  {/* Price */}
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900">
                      ${price.toFixed(2)}
                    </span>
                    
                    {/* Vendor */}
                    {product.vendor && (
                      <span className="text-xs text-gray-500 truncate">
                        {product.vendor}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-gray-600">Loading more products...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileProductGrid;
