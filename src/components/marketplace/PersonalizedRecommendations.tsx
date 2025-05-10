
import React from "react";
import { usePersonalizedRecommendations } from "@/hooks/usePersonalizedRecommendations";
import { Product } from "@/types/product";
import { Card, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useLazyImage } from "@/hooks/useLazyImage";
import { Badge } from "@/components/ui/badge";
import WishlistButton from "./product-item/WishlistButton";
import { Heart, Award, Star, Clock, Truck } from "lucide-react";
import { useFavorites } from "@/components/gifting/hooks/useFavorites";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";

interface PersonalizedRecommendationsProps {
  products: Product[];
  title?: string;
  description?: string;
  limit?: number;
  categories?: string[];
  strategy?: 'balanced' | 'personalized' | 'popular';
}

const PersonalizedRecommendations = ({
  products,
  title = "Recommended for You",
  description,
  limit = 6,
  categories = [],
  strategy = 'balanced'
}: PersonalizedRecommendationsProps) => {
  const { recommendations, isLoading } = usePersonalizedRecommendations(
    products, 
    { 
      limit, 
      preferredCategories: categories,
      strategy 
    }
  );
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [userData] = useLocalStorage("userData", null);
  const { handleFavoriteToggle, isFavorited } = useFavorites();
  
  if (isLoading) {
    return (
      <div className="my-8">
        <h2 className="text-xl font-semibold mb-2">{title}</h2>
        {description && <p className="text-muted-foreground mb-4">{description}</p>}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: limit }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="relative">
                <Skeleton className="h-32 w-full" />
              </div>
              <CardContent className="p-3">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/4 mb-2" />
                <Skeleton className="h-6 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  if (recommendations.length === 0) {
    return null;
  }
  
  const gridCols = isMobile 
    ? "grid-cols-2 gap-3" 
    : `grid-cols-2 md:grid-cols-3 lg:grid-cols-${Math.min(recommendations.length, 6)} gap-4`;
  
  return (
    <div className="my-8">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      {description && <p className="text-muted-foreground mb-4">{description}</p>}
      <div className={`grid ${gridCols}`}>
        {recommendations.map((product) => (
          <RecommendationCard 
            key={product.id || product.product_id} 
            product={product} 
            isFavorited={userData ? isFavorited(product.product_id || product.id || "") : false}
            onFavoriteToggle={() => handleFavoriteToggle(product.product_id || product.id || "")}
          />
        ))}
      </div>
    </div>
  );
};

// Enhanced Recommendation card component with improved scannability
const RecommendationCard = ({ 
  product, 
  isFavorited, 
  onFavoriteToggle 
}: { 
  product: Product; 
  isFavorited: boolean;
  onFavoriteToggle: () => void;
}) => {
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
        
        {/* Wishlist button */}
        <WishlistButton 
          productId={product.id || product.product_id}
          productName={getTitle()}
          productImage={product.image}
          productPrice={product.price}
          productBrand={product.brand}
          isFavorited={isFavorited}
          onClick={(e) => {
            e.stopPropagation();
            onFavoriteToggle();
          }}
        />
        
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

export default PersonalizedRecommendations;

