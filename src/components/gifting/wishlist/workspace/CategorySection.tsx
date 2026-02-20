import React from "react";
import { WishlistItem } from "@/types/profile";
import EnhancedWishlistCard from "../EnhancedWishlistCard";

interface CategorySectionProps {
  category: string;
  items: WishlistItem[];
  onRemove?: (item: WishlistItem) => void;
  isRemoving?: boolean;
  savingItemId?: string | null;
  onGiftNow?: (item: WishlistItem) => void;
  onScheduleGift?: (item: WishlistItem) => void;
  isOwner?: boolean;
  isGuestPreview?: boolean;
  // Guest purchase mode props
  onAddToCart?: (item: WishlistItem) => void;
  onScheduleAndAddToCart?: (item: WishlistItem) => void;
  purchasedItemIds?: Set<string>;
}

const CategorySection = ({
  category,
  items,
  onRemove,
  isRemoving,
  savingItemId,
  onGiftNow,
  onScheduleGift,
  isOwner = true,
  isGuestPreview = false,
  onAddToCart,
  onScheduleAndAddToCart,
  purchasedItemIds = new Set()
}: CategorySectionProps) => {
  if (items.length === 0) return null;

  return (
    <div className="mb-10">
      {/* Category Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold uppercase tracking-wider text-foreground/80 flex items-center gap-3">
          <span>{category}</span>
          <span className="text-sm font-normal text-muted-foreground">
            ({items.length})
          </span>
        </h2>
        <div className="h-px bg-gradient-to-r from-border via-border/50 to-transparent mt-2" />
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <EnhancedWishlistCard
            key={item.id}
            item={item}
            onRemove={isOwner && !isGuestPreview && onRemove ? () => onRemove(item) : undefined}
            isRemoving={savingItemId === item.id}
            onGiftNow={onGiftNow}
            onScheduleGift={onScheduleGift}
            isPurchased={purchasedItemIds.has(item.id)}
            isGuestView={isGuestPreview}
            onAddToCart={onAddToCart && !purchasedItemIds.has(item.id) ? () => onAddToCart(item) : undefined}
            onScheduleAndAddToCart={onScheduleAndAddToCart && !purchasedItemIds.has(item.id) ? () => onScheduleAndAddToCart(item) : undefined}
            className="min-h-[320px]"
          />
        ))}
      </div>
    </div>
  );
};

export default CategorySection;
