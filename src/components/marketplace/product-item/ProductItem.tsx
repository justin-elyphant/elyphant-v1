
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types/product";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLazyImage } from "@/hooks/useLazyImage";
import { cn } from "@/lib/utils";
import WishlistButton from "./WishlistButton";
import SocialShareButton from "./SocialShareButton";
import GroupGiftingButton from "./GroupGiftingButton";
import { Award, Star, Truck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface ProductItemProps {
  product: Product;
  viewMode?: "grid" | "list" | "modern";
  showBadges?: boolean;
  onProductView?: (productId: string) => void;
  onProductClick?: (productId: string) => void;
  onWishlistClick?: (e: React.MouseEvent) => void;
  isFavorited?: boolean;
  statusBadge?: { badge: string; color: string } | null;
  useMock?: boolean;
}

const ProductItem = ({
  product,
  viewMode = "grid",
  showBadges = true,
  onProductView,
  onProductClick,
  onWishlistClick,
  isFavorited = false,
  statusBadge,
  useMock = false,
}: ProductItemProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { src: imageSrc } = useLazyImage(
    product.image, 
    "/placeholder.svg",
    { 
      threshold: 0.1,
      rootMargin: "100px",
    }
  );
  
  const handleClick = () => {
    const productId = product.product_id || product.id || "";
    
    if (productId) {
      // Track product view if callback is provided
      if (onProductView) {
        onProductView(productId);
      }
      
      // Handle custom click handler if provided
      if (onProductClick) {
        onProductClick(productId);
        return;
      }
      
      // Default navigation behavior
      navigate(`/marketplace?productId=${productId}`);
    }
  };

  // Function to render rating stars
  const renderRating = () => {
    const rating = product.rating || product.stars || 0;
    const fillColor = rating >= 4 ? "text-yellow-400" : "text-gray-400";
    
    return (
      <div className="flex items-center">
        <div className="flex items-center mr-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                "h-3 w-3", 
                i < Math.round(rating) ? fillColor : "text-gray-200"
              )}
              fill={i < Math.round(rating) ? "currentColor" : "none"}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground">
          {product.reviewCount || product.num_reviews || 0}
        </span>
      </div>
    );
  };
  
  // Get the product ID reliably
  const getProductId = (): string => {
    return product.product_id || product.id || "";
  };
  
  // Get product name reliably
  const getProductName = (): string => {
    return product.title || product.name || "";
  };
  
  // Determine if product is on sale or has free shipping
  const isFreeShipping = product.prime || (product as any).free_shipping;
  const isOnSale = (product as any).sale_price && 
    (product as any).sale_price < product.price;

  // Render product based on view mode
  if (viewMode === "list") {
    return (
      <Card 
        className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
        onClick={handleClick}
      >
        <div className="flex">
          <div className="w-1/3 md:w-1/4 relative">
            {showBadges && product.isBestSeller && (
              <div className="absolute top-2 left-2 z-10">
                <Badge className="bg-amber-500 text-white text-xs py-0">
                  <Award className="h-3 w-3 mr-1" />
                  Best Seller
                </Badge>
              </div>
            )}
            <div className="h-full relative">
              <WishlistButton 
                productId={getProductId()}
                productName={getProductName()}
                productImage={product.image}
                productPrice={product.price}
                productBrand={product.brand}
                isFavorited={isFavorited}
                onClick={onWishlistClick}
              />
              <img
                src={imageSrc}
                alt={getProductName()}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
          <div className="w-2/3 md:w-3/4">
            <CardContent className="p-3 md:p-4">
              <div className="flex flex-col h-full justify-between">
                <div>
                  <h3 className="font-medium text-sm md:text-base line-clamp-2">
                    {getProductName()}
                  </h3>
                  
                  {(product.rating || product.stars) && renderRating()}
                  
                  {product.brand && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {product.brand}
                    </p>
                  )}
                </div>
                
                <div className="mt-2">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="font-bold">
                        ${product.price.toFixed(2)}
                        {isOnSale && (
                          <span className="text-xs line-through text-muted-foreground ml-1">
                            ${(product as any).original_price?.toFixed(2)}
                          </span>
                        )}
                      </p>
                      
                      {isFreeShipping && (
                        <div className="flex items-center text-xs text-green-600 mt-1">
                          <Truck className="h-3 w-3 mr-1" />
                          <span>Free shipping</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-1">
                      <SocialShareButton product={{
                        id: getProductId(),
                        title: getProductName(),
                        image: product.image,
                        price: product.price
                      }} />
                      <GroupGiftingButton product={{
                        id: getProductId(),
                        title: getProductName(),
                        image: product.image,
                        price: product.price
                      }} />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </div>
        </div>
      </Card>
    );
  }
  
  if (viewMode === "modern") {
    return (
      <div 
        className="group relative cursor-pointer"
        onClick={handleClick}
      >
        <div className="relative overflow-hidden rounded-lg aspect-[4/5]">
          {showBadges && product.isBestSeller && (
            <div className="absolute top-2 left-2 z-10">
              <Badge className="bg-amber-500 text-white">
                <Award className="h-3 w-3 mr-1" />
                Best Seller
              </Badge>
            </div>
          )}
          
          <WishlistButton 
            productId={getProductId()}
            productName={getProductName()}
            productImage={product.image}
            productPrice={product.price}
            productBrand={product.brand}
            isFavorited={isFavorited}
            onClick={onWishlistClick}
          />
          
          <img
            src={imageSrc}
            alt={getProductName()}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 transition-opacity opacity-0 group-hover:opacity-100">
            <div className="flex justify-end space-x-1">
              <SocialShareButton 
                product={{
                  id: getProductId(),
                  title: getProductName(),
                  image: product.image,
                  price: product.price
                }}
                className="bg-white/80 hover:bg-white"
              />
              <GroupGiftingButton 
                product={{
                  id: getProductId(),
                  title: getProductName(),
                  image: product.image,
                  price: product.price
                }}
                className="bg-white/80 hover:bg-white"
              />
            </div>
          </div>
        </div>
        
        <div className="mt-3">
          <h3 className="font-medium text-sm md:text-base line-clamp-2 group-hover:text-primary">
            {getProductName()}
          </h3>
          
          <div className="flex justify-between items-center mt-1">
            <p className="font-bold">
              ${product.price.toFixed(2)}
              {isOnSale && (
                <span className="text-xs line-through text-muted-foreground ml-1">
                  ${(product as any).original_price?.toFixed(2)}
                </span>
              )}
            </p>
            
            {(product.rating || product.stars) && renderRating()}
          </div>
          
          {(isFreeShipping || product.brand) && (
            <div className="flex justify-between items-center mt-1 text-xs text-muted-foreground">
              {product.brand && <span>{product.brand}</span>}
              {isFreeShipping && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center text-green-600">
                        <Truck className="h-3 w-3 mr-1" />
                        <span>Free</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Free Shipping</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Default grid view
  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleClick}
    >
      <div className="relative">
        {showBadges && (
          <>
            {product.isBestSeller && (
              <div className="absolute top-2 left-2 z-10">
                <Badge className="bg-amber-500 text-white text-xs">
                  <Award className="h-3 w-3 mr-1" />
                  Best Seller
                </Badge>
              </div>
            )}
          </>
        )}
        <WishlistButton 
          productId={getProductId()}
          productName={getProductName()}
          productImage={product.image}
          productPrice={product.price}
          productBrand={product.brand}
          onClick={onWishlistClick}
          isFavorited={isFavorited}
        />
        <div className="h-40 overflow-hidden">
          <img
            src={imageSrc}
            alt={getProductName()}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      </div>
      <CardContent className={isMobile ? "p-3" : "p-4"}>
        <h3 className="font-medium text-sm line-clamp-2">
          {getProductName()}
        </h3>
        
        {(product.rating || product.stars) && (
          <div className="mt-1">{renderRating()}</div>
        )}
        
        <div className="mt-2 flex justify-between items-end">
          <p className="font-bold">${product.price.toFixed(2)}</p>
          
          <div className="flex space-x-1">
            <SocialShareButton product={{
              id: getProductId(),
              title: getProductName(),
              image: product.image,
              price: product.price
            }} />
            <GroupGiftingButton product={{
              id: getProductId(),
              title: getProductName(),
              image: product.image,
              price: product.price
            }} />
          </div>
        </div>
        
        {isFreeShipping && (
          <div className="flex items-center text-xs text-green-600 mt-1">
            <Truck className="h-3 w-3 mr-1" />
            <span>Free shipping</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductItem;
