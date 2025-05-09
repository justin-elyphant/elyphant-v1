
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
import { Heart, Award } from "lucide-react";

interface PersonalizedRecommendationsProps {
  products: Product[];
  title?: string;
  description?: string;
  limit?: number;
  categories?: string[];
}

const PersonalizedRecommendations = ({
  products,
  title = "Recommended for You",
  description,
  limit = 6,
  categories = []
}: PersonalizedRecommendationsProps) => {
  const { recommendations, isLoading } = usePersonalizedRecommendations(
    products, 
    { limit, preferredCategories: categories }
  );
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
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
          <RecommendationCard key={product.id || product.product_id} product={product} />
        ))}
      </div>
    </div>
  );
};

// Recommendation card component
const RecommendationCard = ({ product }: { product: Product }) => {
  const navigate = useNavigate();
  const { src: imageSrc } = useLazyImage(product.image);
  
  const handleClick = () => {
    navigate(`/marketplace?productId=${product.id || product.product_id}`);
  };
  
  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleClick}
    >
      <div className="relative">
        {product.isBestSeller && (
          <div className="absolute top-2 left-2 z-10">
            <Badge className="bg-amber-500 text-white">
              <Award className="h-3 w-3 mr-1" />
              Best Seller
            </Badge>
          </div>
        )}
        <WishlistButton 
          productId={product.id || product.product_id}
          productName={product.title || product.name || ""}
          productImage={product.image}
          productPrice={product.price}
          productBrand={product.brand}
        />
        <div className="h-32 overflow-hidden">
          <img
            src={imageSrc}
            alt={product.title || product.name || ""}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      </div>
      <CardContent className="p-3">
        <h3 className="font-medium text-sm line-clamp-2">
          {product.title || product.name}
        </h3>
        <p className="font-bold text-sm mt-1">${product.price.toFixed(2)}</p>
      </CardContent>
    </Card>
  );
};

export default PersonalizedRecommendations;
