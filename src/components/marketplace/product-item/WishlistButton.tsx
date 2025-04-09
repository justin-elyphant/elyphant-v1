
import React from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  userData: any;
  productId: number;
  productName: string;
  onWishlistClick: (e: React.MouseEvent) => void;
  isFavorited: boolean;
}

const WishlistButton = ({
  userData,
  productId,
  productName,
  onWishlistClick,
  isFavorited
}: WishlistButtonProps) => {
  return (
    <button
      className={cn(
        "absolute top-2 right-2 h-8 w-8 rounded-full flex items-center justify-center bg-white/80 backdrop-blur-sm transition-all",
        isFavorited ? "text-red-500" : "text-gray-600 hover:text-red-500"
      )}
      onClick={onWishlistClick}
      aria-label={isFavorited ? `Remove ${productName} from favorites` : `Add ${productName} to favorites`}
    >
      <Heart
        className={cn(
          "h-5 w-5",
          isFavorited ? "fill-current" : "fill-none"
        )}
      />
    </button>
  );
};

export default WishlistButton;
