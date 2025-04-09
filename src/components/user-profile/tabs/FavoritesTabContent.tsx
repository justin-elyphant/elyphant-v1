
import React, { useState } from "react";
import { Heart, Clock } from "lucide-react";
import { useFavorites, SavedItemType } from "@/components/gifting/hooks/useFavorites";
import ProductCard from "@/components/gifting/ProductCard";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FavoritesTabContentProps {
  isCurrentUser?: boolean;
}

const FavoritesTabContent: React.FC<FavoritesTabContentProps> = ({ isCurrentUser = false }) => {
  const { 
    handleFavoriteToggle, 
    handleSaveOptionSelect, 
    isFavorited,
    wishlistItems,
    laterItems
  } = useFavorites();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SavedItemType>("wishlist");

  // Handle product click to navigate to the product or marketplace
  const handleProductClick = (productId: number) => {
    navigate(`/marketplace?productId=${productId}`);
  };

  const renderEmptyState = (type: SavedItemType) => {
    const isLater = type === "later";
    return (
      <div className="text-center py-8 border rounded-lg">
        {isLater ? (
          <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
        ) : (
          <Heart className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
        )}
        <h4 className="font-medium">
          {isLater ? "No items saved for later" : "No wishlist items yet"}
        </h4>
        <p className="text-sm text-muted-foreground mt-1">
          {isCurrentUser 
            ? isLater 
              ? "Items you save for later will appear here." 
              : "Items you add to your wishlist will appear here."
            : isLater
              ? "This user hasn't saved any items for later yet."
              : "This user hasn't added any items to their wishlist yet."
          }
        </p>
      </div>
    );
  };

  const activeItems = activeTab === "later" ? laterItems : wishlistItems;
  
  return (
    <div className="space-y-4">
      {isCurrentUser && (
        <Tabs 
          defaultValue="wishlist" 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as SavedItemType)}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 w-72 mb-4">
            <TabsTrigger value="wishlist">
              <Heart className="h-4 w-4 mr-2" /> My Wishlist
            </TabsTrigger>
            <TabsTrigger value="later">
              <Clock className="h-4 w-4 mr-2" /> Saved for Later
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {activeItems.length === 0 ? (
        renderEmptyState(activeTab)
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {activeItems.map(product => (
            <ProductCard 
              key={product.id}
              product={product}
              isWishlisted={activeTab === "wishlist"}
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
      )}
    </div>
  );
};

export default FavoritesTabContent;
