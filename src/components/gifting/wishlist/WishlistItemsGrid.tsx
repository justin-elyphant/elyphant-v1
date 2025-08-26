
import React from "react";
import { Gift } from "lucide-react";
import EnhancedWishlistCard from "@/components/gifting/wishlist/EnhancedWishlistCard";
import { WishlistItem } from "@/types/profile";

interface WishlistItemsGridProps {
  items: WishlistItem[];
  onSaveItem: (item: WishlistItem) => void;
  savingItemId: string | null;
  onGiftNow?: (item: WishlistItem) => void;
}

const WishlistItemsGrid = ({ items, onSaveItem, savingItemId, onGiftNow }: WishlistItemsGridProps) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <Gift className="h-12 w-12 mx-auto text-gray-300 mb-2" />
        <p className="text-muted-foreground">This wishlist is empty.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <EnhancedWishlistCard
          key={item.id}
          item={item}
          onRemove={() => onSaveItem(item)}
          isRemoving={savingItemId === item.id}
          onGiftNow={onGiftNow}
        />
      ))}
    </div>
  );
};

export default WishlistItemsGrid;
