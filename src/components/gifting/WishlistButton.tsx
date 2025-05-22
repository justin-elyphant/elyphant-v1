
import React from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  isWishlisted: boolean;
  isGifteeView: boolean;
  isMobile: boolean;
  onToggleWishlist?: () => void;
}

const WishlistButton: React.FC<WishlistButtonProps> = ({
  isWishlisted,
  isGifteeView,
  isMobile,
  onToggleWishlist,
}) => {
  if (!isGifteeView) return null;
  return (
    <button 
      className={cn(
        "absolute top-2 right-2 p-1.5 rounded-full transition-colors",
        isMobile && "p-2",
        isWishlisted 
          ? "bg-pink-100 text-pink-500 hover:bg-pink-200" 
          : "bg-white/80 text-gray-400 hover:text-pink-500 hover:bg-white"
      )}
      onClick={(e) => {
        e.stopPropagation();
        if (onToggleWishlist) onToggleWishlist();
      }}
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      type="button"
    >
      <Heart className={cn(
        isMobile ? "h-5 w-5" : "h-4 w-4",
        isWishlisted && "fill-pink-500"
      )} />
    </button>
  );
};

export default WishlistButton;
