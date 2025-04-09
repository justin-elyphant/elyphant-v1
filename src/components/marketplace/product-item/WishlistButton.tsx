
import React from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import WishlistSelectionPopover from "../WishlistSelectionPopover";

interface WishlistButtonProps {
  userData: any;
  productId: number;
  productName: string;
  onWishlistClick: (e: React.MouseEvent) => void;
  isFavorited?: boolean;
}

const WishlistButton = ({ userData, productId, productName, onWishlistClick, isFavorited = false }: WishlistButtonProps) => {
  if (userData) {
    return (
      <WishlistSelectionPopover 
        productId={productId}
        productName={productName}
        trigger={
          <Button 
            size="icon"
            variant="ghost" 
            className={`absolute top-2 right-2 ${isFavorited 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-white/80 hover:bg-white'} rounded-full h-8 w-8`} 
          >
            <Heart className={`h-4 w-4 ${isFavorited ? 'fill-white text-white' : ''}`} />
          </Button>
        }
      />
    );
  }
  
  return (
    <Button 
      size="icon"
      variant="ghost" 
      className={`absolute top-2 right-2 ${isFavorited 
        ? 'bg-red-500 hover:bg-red-600' 
        : 'bg-white/80 hover:bg-white'} rounded-full h-8 w-8`}
      onClick={onWishlistClick}
    >
      <Heart className={`h-4 w-4 ${isFavorited ? 'fill-white text-white' : ''}`} />
    </Button>
  );
};

export default WishlistButton;
