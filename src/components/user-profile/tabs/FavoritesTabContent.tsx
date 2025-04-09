
import React from "react";
import { Heart } from "lucide-react";
import { useFavorites } from "@/components/gifting/hooks/useFavorites";
import ProductCard from "@/components/gifting/ProductCard";
import { useNavigate } from "react-router-dom";

interface FavoritesTabContentProps {
  isCurrentUser?: boolean;
}

const FavoritesTabContent: React.FC<FavoritesTabContentProps> = ({ isCurrentUser = false }) => {
  const { favoriteItems, handleFavoriteToggle, isFavorited } = useFavorites();
  const navigate = useNavigate();

  // Handle product click to navigate to the product or marketplace
  const handleProductClick = (productId: number) => {
    navigate(`/marketplace?productId=${productId}`);
  };

  if (favoriteItems.length === 0) {
    return (
      <div className="text-center py-8 border rounded-lg">
        <Heart className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
        <h4 className="font-medium">No favorites yet</h4>
        <p className="text-sm text-muted-foreground mt-1">
          {isCurrentUser 
            ? "Products you favorite will appear here." 
            : "This user hasn't favorited any products yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {favoriteItems.map(product => (
          <ProductCard 
            key={product.id}
            product={product}
            isWishlisted={false}
            isGifteeView={isCurrentUser}
            onToggleWishlist={() => {
              if (isCurrentUser) {
                handleFavoriteToggle(product.id);
              }
            }}
            onClick={() => handleProductClick(product.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default FavoritesTabContent;
