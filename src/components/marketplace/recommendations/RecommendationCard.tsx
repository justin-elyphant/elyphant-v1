
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Star, Truck } from "lucide-react";
import { Product } from "@/types/product";
import { useLazyImage } from "@/hooks/useLazyImage";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import QuickWishlistButton from "../product-item/QuickWishlistButton";

interface RecommendationCardProps {
  product: Product;
  isFavorited: boolean;
  onFavoriteToggle: (e: React.MouseEvent) => void;
}

const RecommendationCard = ({ 
  product, 
  isFavorited, 
  onFavoriteToggle 
}: RecommendationCardProps) => {
  const navigate = useNavigate();
  const { src: imageSrc } = useLazyImage(product.image);
  const isMobile = useIsMobile();
  
  const handleClick = () => {
    navigate(`/marketplace?productId=${product.id || product.product_id}`);
  };
  
  // Helper functions to improve code readability
  const getTitle = () => product.title || product.name || "";
  const getPrice = () => product.price.toFixed(2);
  const isBestSeller = () => product.isBestSeller || false;
  const getRating = () => product.rating || product.stars || 0;
  
  // Safe type checking for free_shipping which isn't in the Product type
  const isFreeShipping = () => {
    return product.prime || (product as any).free_shipping || false;
  };
  
  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/20"
      onClick={handleClick}
    >
      <div className="relative">
        {/* Status badges for better scannability */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
          {isBestSeller() && (
            <Badge className="bg-amber-500 text-white border-0">
              <Award className="h-3 w-3 mr-1" />
              <span className="text-xs">Best Seller</span>
            </Badge>
          )}
        </div>
        
        {/* Quick wishlist button */}
        <div className="absolute top-2 right-2 z-10">
          <QuickWishlistButton
            productId={product.id || product.product_id || ""}
            isFavorited={isFavorited}
            onClick={onFavoriteToggle}
            size="md"
            variant="default"
          />
        </div>
        
        {/* Product image with consistent aspect ratio */}
        <div className="aspect-square overflow-hidden">
          <img
            src={imageSrc}
            alt={getTitle()}
            className="w-full h-full object-cover transition-transform hover:scale-105"
            loading="lazy"
          />
        </div>
      </div>
      
      <CardContent className={`${isMobile ? 'p-2' : 'p-3'}`}>
        {/* Product title with line clamping */}
        <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem] group-hover:text-primary">
          {getTitle()}
        </h3>
        
        {/* Price with prominent styling */}
        <p className="font-bold text-base mt-2">${getPrice()}</p>
        
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
              {product.reviewCount || product.num_reviews || 0}
            </span>
          </div>
        )}
        
        {/* Free shipping indicator */}
        {isFreeShipping() && (
          <div className="flex items-center text-xs text-green-600 mt-1">
            <Truck className="h-3 w-3 mr-1" />
            <span>Free shipping</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecommendationCard;
