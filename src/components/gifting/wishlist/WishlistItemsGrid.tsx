
import React from "react";
import { Gift } from "lucide-react";
import GiftItemCard from "@/components/gifting/GiftItemCard";
import { WishlistItem } from "@/types/profile";
import { enhanceWishlistItemWithSource } from "@/utils/productSourceDetection";

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
      {items.map((item) => {
        // Enhance item with product source detection for correct pricing
        const enhancedItem = enhanceWishlistItemWithSource(item);
        
        return (
          <div key={item.id} className="relative">
            <GiftItemCard
              name={item.name || item.title || "Unknown Item"}
              price={item.price || 0}
              brand={item.brand || ""}
              imageUrl={item.image_url || "/placeholder.svg"}
              onRemove={() => onSaveItem(item)}
              isRemoving={savingItemId === item.id}
              // Pass detected product source for unified pricing
              productSource={enhancedItem.productSource}
              vendor={(item as any).vendor}
              retailer={(item as any).retailer}
              isZincApiProduct={(item as any).isZincApiProduct}
              skipCentsDetection={(item as any).skipCentsDetection}
            />
          </div>
        );
      })}
    </div>
  );
};

export default WishlistItemsGrid;
