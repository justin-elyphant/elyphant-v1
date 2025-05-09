
import React from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

interface WishlistButtonProps {
  productId: string;
  productName: string;
  productImage: string;
  productPrice: number;
  productBrand?: string;
  isFavorited?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

const WishlistButton = ({
  productId,
  productName,
  productImage,
  productPrice,
  productBrand,
  isFavorited = false,
  onClick
}: WishlistButtonProps) => {
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick(e);
    }
  };
  
  return (
    <Button
      variant="ghost"
      size="icon"
      className="absolute top-2 right-2 z-10 bg-white/70 backdrop-blur-sm hover:bg-white transition-colors"
      onClick={handleClick}
      aria-label={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart 
        className={`h-4 w-4 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} 
      />
    </Button>
  );
};

export default WishlistButton;
