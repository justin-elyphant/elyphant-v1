import React from "react";
import { Heart, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface WishlistStatusBannerProps {
  isInWishlist?: boolean;
  wishlistCount?: number;
  className?: string;
}

const WishlistStatusBanner: React.FC<WishlistStatusBannerProps> = ({
  isInWishlist = false,
  wishlistCount = 1,
  className
}) => {
  if (!isInWishlist) return null;

  return (
    <div className={cn(
      "relative overflow-hidden rounded-lg p-3 mb-4",
      "bg-gradient-to-r from-pink-500/90 via-purple-500/90 to-pink-600/90",
      "text-white shadow-lg",
      className
    )}>
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm">
          <Check className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">
            {wishlistCount > 1 
              ? `In ${wishlistCount} Wishlists` 
              : "In Your Wishlist"}
          </p>
          <p className="text-xs opacity-90">
            This item is saved to your collection
          </p>
        </div>
        <Heart className="h-5 w-5 fill-white" />
      </div>
      
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
    </div>
  );
};

export default WishlistStatusBanner;
