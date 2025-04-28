
import React from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface WishlistButtonProps {
  userData: any;
  productId: string;
  productName: string;
  onWishlistClick: (e: React.MouseEvent) => void;
  onSaveOptionSelect?: (option: "wishlist" | "later", productId: string) => void;
  isFavorited: boolean;
}

const WishlistButton = ({
  userData,
  productId,
  productName,
  onWishlistClick,
  onSaveOptionSelect,
  isFavorited
}: WishlistButtonProps) => {
  const handleOptionSelect = (e: React.MouseEvent, option: "wishlist" | "later") => {
    e.stopPropagation();
    if (onSaveOptionSelect) {
      onSaveOptionSelect(option, productId);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "absolute top-2 right-2 h-8 w-8 rounded-full flex items-center justify-center bg-white/80 backdrop-blur-sm transition-all",
            isFavorited ? "text-red-500" : "text-gray-600 hover:text-red-500"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onWishlistClick(e);
          }}
          aria-label={isFavorited ? `Remove ${productName} from favorites` : `Add ${productName} to favorites`}
        >
          <Heart
            className={cn(
              "h-5 w-5",
              isFavorited ? "fill-current" : "fill-none"
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="end" className="w-56 p-0">
        <div className="px-4 py-3 border-b">
          <h4 className="font-medium text-sm">Save this item</h4>
        </div>
        <div className="p-2">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-sm mb-1 font-normal" 
            onClick={(e) => handleOptionSelect(e, "later")}
          >
            Save for later
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-sm font-normal" 
            onClick={(e) => handleOptionSelect(e, "wishlist")}
          >
            Add to my wishlist
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default WishlistButton;
