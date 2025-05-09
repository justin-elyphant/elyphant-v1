
import React from "react";
import { Clock, Gift, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import GiftItemCard from "@/components/gifting/GiftItemCard";
import { WishlistItem } from "@/types/profile";

interface WishlistItemsGridProps {
  items: WishlistItem[];
  onSaveItem: (item: WishlistItem) => void;
  savingItemId: string | null;
}

const WishlistItemsGrid = ({ items, onSaveItem, savingItemId }: WishlistItemsGridProps) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <Gift className="h-12 w-12 mx-auto text-gray-300 mb-2" />
        <p className="text-muted-foreground">This wishlist is empty.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <div key={item.id} className="relative group">
          <GiftItemCard
            name={item.name}
            price={item.price || 0}
            brand={item.brand || ""}
            imageUrl={item.image_url || "/placeholder.svg"}
          />
          <Button
            variant="secondary"
            size="sm"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onSaveItem(item)}
            disabled={savingItemId === item.id}
          >
            {savingItemId === item.id ? (
              <Clock className="h-4 w-4 animate-spin" />
            ) : (
              <Heart className="h-4 w-4 mr-1" />
            )}
            {savingItemId === item.id ? "Saving..." : "Save"}
          </Button>
        </div>
      ))}
    </div>
  );
};

export default WishlistItemsGrid;
