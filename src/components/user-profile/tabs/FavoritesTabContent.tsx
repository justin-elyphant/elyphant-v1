
import React from "react";
import { Heart } from "lucide-react";
import { useFavorites } from "@/components/gifting/hooks/useFavorites";
import ProductCard from "@/components/gifting/ProductCard";

const FavoritesTabContent = ({ isCurrentUser = false }) => {
  const { favoriteItems, handleFavoriteToggle, isFavorited } = useFavorites();

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
            onToggleWishlist={() => {}}
            onClick={() => {}}
          />
        ))}
      </div>
    </div>
  );
};

export default FavoritesTabContent;
