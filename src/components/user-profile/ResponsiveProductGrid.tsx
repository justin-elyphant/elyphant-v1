import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Trash2 } from "lucide-react";
import { formatPrice, cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface ProductWithSource {
  product_id: string;
  title: string;
  price: number;
  image: string;
  source: 'wishlist' | 'interests' | 'ai' | 'trending';
  sourceIcon: React.ComponentType<any>;
  sourceLabel: string;
  sourceColor: string;
}

interface ResponsiveProductGridProps {
  products: ProductWithSource[];
  isOwnProfile: boolean;
  isPreviewMode?: boolean;
  onProductClick: (product: ProductWithSource) => void;
  onWishlistAction: (e: React.MouseEvent, product: ProductWithSource) => void;
  onRemoveFromWishlist: (e: React.MouseEvent, product: ProductWithSource) => void;
  wishlistedProducts: string[];
}

const ResponsiveProductGrid: React.FC<ResponsiveProductGridProps> = ({
  products,
  isOwnProfile,
  isPreviewMode = false,
  onProductClick,
  onWishlistAction,
  onRemoveFromWishlist,
  wishlistedProducts
}) => {
  const isMobile = useIsMobile();

  // Mobile layout - keep exactly the same as before
  if (isMobile) {
    return (
      <div 
        className="grid grid-cols-2 gap-2" 
        style={{ width: '100%', maxWidth: 'none' }}
      >
        {products.map((product) => {
          const isWishlisted = wishlistedProducts.includes(product.product_id);
          const SourceIcon = product.sourceIcon;

          return (
            <div
              key={product.product_id}
              className="group relative aspect-square cursor-pointer min-w-0"
              onClick={() => onProductClick(product)}
            >
              {/* Product Image */}
              <div className="relative w-full h-full bg-muted rounded-lg overflow-hidden">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                  
                {/* Source Badge */}
                <Badge
                  className={cn(
                    "absolute top-1 left-1 text-xs px-1.5 py-0.5 scale-90",
                    product.sourceColor
                  )}
                >
                  <SourceIcon className="w-2.5 h-2.5 mr-0.5" />
                  <span className="hidden sm:inline">{product.sourceLabel}</span>
                </Badge>

                {/* Price Badge */}
                {product.price > 0 && (
                  <Badge
                    variant="secondary"
                    className="absolute bottom-1 left-1 text-xs px-1.5 py-0.5 scale-90"
                  >
                    {formatPrice(product.price)}
                  </Badge>
                 )}

                {/* Action Buttons - Context Aware */}
                <div className="absolute top-1 right-1 flex gap-1">
                  {product.source === 'wishlist' && isOwnProfile && !isPreviewMode ? (
                    // Show remove button for own wishlist items
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 sm:h-8 sm:w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/80 hover:bg-red-500"
                      onClick={(e) => onRemoveFromWishlist(e, product)}
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                    </Button>
                  ) : (
                    // Show wishlist heart for other products
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-6 w-6 sm:h-8 sm:w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity",
                        isWishlisted && "opacity-100"
                      )}
                      onClick={(e) => onWishlistAction(e, product)}
                    >
                      <Heart 
                        className={cn(
                          "h-3 w-3 sm:h-4 sm:w-4",
                          isWishlisted ? "fill-red-500 text-red-500" : "text-white"
                        )} 
                      />
                    </Button>
                  )}
                </div>

                {/* Overlay with title - only visible on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-white text-xs font-medium line-clamp-2">
                      {product.title}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Desktop layout - enhanced with cards and better spacing
  return (
    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
      {products.map((product) => {
        const isWishlisted = wishlistedProducts.includes(product.product_id);
        const SourceIcon = product.sourceIcon;

        return (
          <Card
            key={product.product_id}
            className="group cursor-pointer overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1"
            onClick={() => onProductClick(product)}
          >
            <CardContent className="p-0">
              <div className="relative aspect-square">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                
                {/* Source Badge */}
                <Badge
                  className={cn(
                    "absolute top-2 left-2 text-xs backdrop-blur-md",
                    product.sourceColor
                  )}
                >
                  <SourceIcon className="w-3 h-3 mr-1" />
                  {product.sourceLabel}
                </Badge>

                {/* Price Badge */}
                {product.price > 0 && (
                  <Badge
                    variant="secondary"
                    className="absolute bottom-2 left-2 text-xs backdrop-blur-md bg-black/60 text-white border-0"
                  >
                    {formatPrice(product.price)}
                  </Badge>
                )}

                {/* Action Buttons */}
                <div className="absolute top-2 right-2">
                  {product.source === 'wishlist' && isOwnProfile && !isPreviewMode ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/80 hover:bg-red-500 backdrop-blur-sm"
                      onClick={(e) => onRemoveFromWishlist(e, product)}
                    >
                      <Trash2 className="h-4 w-4 text-white" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm bg-black/20 hover:bg-black/40",
                        isWishlisted && "opacity-100 bg-red-500/80"
                      )}
                      onClick={(e) => onWishlistAction(e, product)}
                    >
                      <Heart 
                        className={cn(
                          "h-4 w-4",
                          isWishlisted ? "fill-white text-white" : "text-white"
                        )} 
                      />
                    </Button>
                  )}
                </div>

                {/* Overlay with title - visible on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-white text-sm font-medium line-clamp-2">
                      {product.title}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ResponsiveProductGrid;
