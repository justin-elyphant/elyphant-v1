
import React from "react";
import { usePersonalizedRecommendations } from "@/hooks/usePersonalizedRecommendations";
import { Product } from "@/types/product";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuickWishlist } from "@/hooks/useQuickWishlist";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
import { useFavorites } from "@/components/gifting/hooks/useFavorites";
import RecommendationCard from "./recommendations/RecommendationCard";
import RecommendationsSkeleton from "./recommendations/RecommendationsSkeleton";
import SignUpDialog from "./SignUpDialog";

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
  const [userData] = useLocalStorage("userData", null);
  const { handleFavoriteToggle, isFavorited } = useFavorites();
  const { toggleWishlist, showSignUpDialog, setShowSignUpDialog } = useQuickWishlist();
  
  if (isLoading) {
    return (
      <div className="my-8">
        <h2 className="text-xl font-semibold mb-2">{title}</h2>
        {description && <p className="text-muted-foreground mb-4">{description}</p>}
        <RecommendationsSkeleton limit={limit} />
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
            onFavoriteToggle={(e) => toggleWishlist(e, {
              id: product.product_id || product.id || "",
              name: product.title || product.name || "",
              image: product.image,
              price: product.price
            })}
          />
        ))}
      </div>
      
      <SignUpDialog 
        open={showSignUpDialog} 
        onOpenChange={setShowSignUpDialog} 
      />
    </div>
  );
};

export default PersonalizedRecommendations;
