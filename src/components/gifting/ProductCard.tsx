
import React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Heart, Sparkles, Star, Clock, Truck } from "lucide-react";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useProductDataSync } from "@/hooks/useProductDataSync";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
// Add import for getPrimaryProductImage
import { getPrimaryProductImage } from "@/components/marketplace/product-item/getPrimaryProductImage";

interface ProductCardProps {
  product: any;
  isWishlisted?: boolean;
  isGifteeView?: boolean;
  onToggleWishlist?: () => void;
  onClick?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isWishlisted = false,
  isGifteeView = true, 
  onToggleWishlist,
  onClick
}) => {
  const { addItem } = useRecentlyViewed();
  const { trackProductView } = useProductDataSync();
  const isMobile = useIsMobile();
  
  const handleClick = () => {
    if (onClick) onClick();
    
    // Track this product as recently viewed locally
    addItem({
      id: product.product_id || product.id || "",
      title: product.title || product.name || "",
      image: product.image || "",
      price: product.price
    });
    
    // Also track for profile synchronization
    trackProductView(product);
  };

  // Helper functions to improve readability
  const getProductName = () => product.title || product.name || "";
  // Change: use getPrimaryProductImage(product) (uses robust fallback logic!)
  const getProductImage = () => {
    const selectedImg = getPrimaryProductImage(product);
    console.log("[ProductCard] selected image", {
      title: getProductName(),
      selectedImg,
      image: product.image,
      images: product.images,
      productId: product.product_id || product.id
    });
    return selectedImg;
  };
  const getPrice = () => (typeof product.price === 'number' ? product.price.toFixed(2) : '0.00');
  const isRecentlyViewed = () => product.recentlyViewed;
  const isNewArrival = () => product.tags?.includes("new") || (product.id && Number(product.id) > 9000);
  const isBestSeller = () => product.isBestSeller || false;
  const isFreeShipping = () => product.prime || product.free_shipping || false;
  const getRating = () => product.rating || product.stars || 0;
  const hasDiscount = () => product.sale_price && product.sale_price < product.price;

  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all relative group hover:shadow-md cursor-pointer border-2",
        isWishlisted && "border-pink-200 hover:border-pink-300",
        !isWishlisted && "hover:border-gray-300"
      )}
      onClick={handleClick}
    >
      <div className="aspect-square relative overflow-hidden">
        <img 
          src={getProductImage()} 
          alt={getProductName()} 
          className="object-cover w-full h-full transition-transform group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder.svg";
          }}
          loading="lazy"
        />
        
        {/* Status badges - positioned at top left for improved scannability */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isBestSeller() && (
            <Badge variant="secondary" className="bg-amber-500 text-white border-0">
              <Sparkles className="h-3 w-3 mr-1" />
              <span className="text-xs">Bestseller</span>
            </Badge>
          )}
          
          {isNewArrival() && (
            <Badge variant="secondary" className="bg-green-500 text-white border-0">
              <span className="text-xs">New</span>
            </Badge>
          )}
          
          {isRecentlyViewed() && (
            <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
              <Clock className="h-3 w-3 mr-1" />
              <span className="text-xs">Viewed</span>
            </Badge>
          )}
        </div>
        
        {/* Wishlist button - positioned at top right */}
        {isGifteeView && (
          <button 
            className={cn(
              "absolute top-2 right-2 p-1.5 rounded-full transition-colors",
              isMobile && "p-2", // Increased padding for better touch target on mobile
              isWishlisted 
                ? "bg-pink-100 text-pink-500 hover:bg-pink-200" 
                : "bg-white/80 text-gray-400 hover:text-pink-500 hover:bg-white"
            )}
            onClick={(e) => {
              e.stopPropagation();
              if (onToggleWishlist) onToggleWishlist();
            }}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={cn(
              isMobile ? "h-5 w-5" : "h-4 w-4", // Larger icon for mobile
              isWishlisted && "fill-pink-500"
            )} />
          </button>
        )}
      </div>
      
      <div className={cn(
        "p-3", 
        isMobile && "p-2.5" // Adjusted padding for mobile
      )}>
        {/* Product name - limited to 2 lines for consistency */}
        <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors">
          {getProductName()}
        </h3>
        
        {/* Price section with sale price if applicable */}
        <div className="mt-2 flex items-center">
          <div className="font-bold text-base">
            ${getPrice()}
            
            {hasDiscount() && (
              <span className="text-xs line-through text-gray-400 ml-1">
                ${product.price?.toFixed(2)}
              </span>
            )}
          </div>
          
          {hasDiscount() && (
            <Badge className="ml-2 bg-red-500 text-white text-xs">
              Sale
            </Badge>
          )}
        </div>
        
        {/* Rating display with stars */}
        {getRating() > 0 && (
          <div className="flex items-center mt-1 text-xs text-amber-500">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-3 w-3",
                  i < Math.round(getRating()) ? "fill-amber-500 text-amber-500" : "text-gray-300"
                )}
              />
            ))}
            <span className="text-gray-500 ml-1">
              {product.reviewCount || product.num_reviews || 0}
            </span>
          </div>
        )}
        
        {/* Free shipping indicator */}
        {isFreeShipping() && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center text-xs text-green-600 mt-1">
                  <Truck className="h-3 w-3 mr-1" />
                  <span>Free shipping</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Free shipping on this item</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {/* Tags/categories - show the most relevant tag */}
        {product.tags && product.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {product.tags.slice(0, 1).map((tag: string, i: number) => (
              <span 
                key={i} 
                className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-sm"
              >
                {tag}
              </span>
            ))}
            {product.tags.length > 1 && (
              <span className="text-xs text-gray-500">+{product.tags.length - 1}</span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default ProductCard;

// NOTE: This file is approaching 200+ lines and is a great candidate to be broken out into smaller, focused components for maintainability.
