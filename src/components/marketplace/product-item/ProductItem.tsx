import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { Product } from "@/types/product";
import { useLazyImage } from "@/hooks/useLazyImage";
import QuickWishlistButton from "./QuickWishlistButton";
import { getProductFallbackImage } from "./productImageUtils";

// Utility for fallback image (always use this order: image, images[0], fallback)
const getPrimaryProductImage = (product: Product) => {
  if (product.image && product.image !== "/placeholder.svg") return product.image;
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    const validImg = product.images.find(img => !!img && img !== "/placeholder.svg");
    if (validImg) return validImg;
  }
  // If mock/test (missing image), always show fallback
  return getProductFallbackImage(product.title || product.name || "Product", product.category || "");
};

interface ProductItemProps {
  product: Product;
  viewMode: "grid" | "list" | "modern"; 
  onProductClick: (productId: string) => void;
  onWishlistClick: (e: React.MouseEvent) => void;
  isFavorited: boolean;
  statusBadge?: { badge: string; color: string } | null;
}

const ProductItem = ({
  product,
  viewMode,
  onProductClick,
  onWishlistClick,
  isFavorited,
  statusBadge
}: ProductItemProps) => {
  // Use our new logic for primary image selection
  const productImage = getPrimaryProductImage(product);

  // Use lazy loading, always attempt to load the primary image (fallback already ensured)
  const { src: imageSrc } = useLazyImage(productImage);

  const handleClick = () => {
    onProductClick(product.product_id || product.id || "");
  };

  // Helper functions for product data access
  const getTitle = () => product.title || product.name || "";
  const getPrice = () => product.price?.toFixed(2) || "0.00";
  const getRating = () => product.rating || product.stars || 0;
  const getReviewCount = () => product.reviewCount || product.num_reviews || 0;
  
  // Get the discount percentage if available
  const getDiscountPercent = () => {
    if ((product as any).original_price && (product as any).original_price > product.price) {
      const discount = ((product as any).original_price - product.price) / (product as any).original_price * 100;
      return Math.round(discount);
    }
    return null;
  };
  
  const discountPercent = getDiscountPercent();
  
  if (viewMode === "list") {
    return (
      <Card className="overflow-hidden cursor-pointer border hover:border-primary/50 transition-all duration-200"
        onClick={handleClick}>
        <div className="flex flex-col xs:flex-row">
          <div className="relative w-full xs:w-1/3 aspect-square">
            {/* Status badge */}
            {statusBadge && (
              <div className="absolute top-2 left-2 z-10">
                <Badge className={`${statusBadge.color}`}>
                  {statusBadge.badge}
                </Badge>
              </div>
            )}
            
            {/* Discount badge */}
            {discountPercent && (
              <div className="absolute top-2 right-2 z-10">
                <Badge className="bg-red-100 text-red-800 border-red-200">
                  {discountPercent}% OFF
                </Badge>
              </div>
            )}
            
            {/* Product image */}
            <img
              src={imageSrc}
              alt={product.title || product.name || ""}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          
          <CardContent className="flex-1 p-3">
            {/* Title */}
            <div className="flex justify-between items-start">
              <h3 className="font-medium text-sm line-clamp-2 flex-1">
                {getTitle()}
              </h3>
              
              {/* Quick wishlist button */}
              <div className="ml-2">
                <QuickWishlistButton
                  productId={product.product_id || product.id || ""}
                  isFavorited={isFavorited}
                  onClick={onWishlistClick}
                  size="sm"
                  variant="subtle"
                />
              </div>
            </div>
            
            {/* Price */}
            <div className="mt-2">
              <span className="font-bold">${getPrice()}</span>
              {discountPercent && (product as any).original_price && (
                <span className="text-sm text-muted-foreground line-through ml-2">
                  ${(product as any).original_price.toFixed(2)}
                </span>
              )}
            </div>
            
            {/* Ratings */}
            {getRating() > 0 && (
              <div className="flex items-center mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star 
                    key={i}
                    className={`h-3 w-3 ${i < Math.round(getRating()) ? 'text-amber-500 fill-amber-500' : 'text-gray-200'}`}
                  />
                ))}
                <span className="text-xs text-muted-foreground ml-1">
                  {getReviewCount()}
                </span>
              </div>
            )}
          </CardContent>
        </div>
      </Card>
    );
  }
  
  // Default is grid view
  return (
    <Card 
      className="overflow-hidden cursor-pointer border hover:border-primary/50 transition-all duration-200"
      onClick={handleClick}
    >
      <div className="relative">
        {/* Status badge */}
        {statusBadge && (
          <div className="absolute top-2 left-2 z-10">
            <Badge className={`${statusBadge.color}`}>
              {statusBadge.badge}
            </Badge>
          </div>
        )}
        
        {/* Quick wishlist button */}
        <div className="absolute top-2 right-2 z-10">
          <QuickWishlistButton
            productId={product.product_id || product.id || ""}
            isFavorited={isFavorited}
            onClick={onWishlistClick}
            size="md"
            variant="default"
          />
        </div>
        
        {/* Discount badge */}
        {discountPercent && (
          <div className="absolute bottom-2 left-2 z-10">
            <Badge className="bg-red-100 text-red-800 border-red-200">
              {discountPercent}% OFF
            </Badge>
          </div>
        )}
        
        {/* Product image with consistent aspect ratio */}
        <div className="aspect-square overflow-hidden">
          <img
            src={imageSrc}
            alt={product.title || product.name || ""}
            className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
            loading="lazy"
          />
        </div>
      </div>
      
      <CardContent className="p-3">
        {/* Product title with line clamping */}
        <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem]">
          {getTitle()}
        </h3>
        
        {/* Price with original price if discounted */}
        <div className="mt-2 flex items-baseline">
          <span className="font-bold">${getPrice()}</span>
          {discountPercent && (product as any).original_price && (
            <span className="text-sm text-muted-foreground line-through ml-2">
              ${(product as any).original_price.toFixed(2)}
            </span>
          )}
        </div>
        
        {/* Rating stars for visual evaluation */}
        {getRating() > 0 && (
          <div className="flex items-center mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star 
                key={i}
                className={`h-3 w-3 ${i < Math.round(getRating()) ? 'text-amber-500 fill-amber-500' : 'text-gray-200'}`}
              />
            ))}
            <span className="text-xs text-muted-foreground ml-1">
              {getReviewCount()}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductItem;
