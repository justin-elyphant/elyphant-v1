import React, { useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import WishlistSelectionPopover from "../WishlistSelectionPopover";
import SignUpDialog from "../SignUpDialog";
import { useAuth } from "@/contexts/auth";

interface WishlistButtonProps {
  onWishlistClick?: (e: React.MouseEvent) => void;
  onClick?: (e: React.MouseEvent) => void; // Make this prop optional
  isFavorited?: boolean;
  userData?: any;
  productId?: string;
  productName?: string;
  productImage?: string;
  productPrice?: number;
  productBrand?: string;
  onSaveOptionSelect?: (option: "wishlist" | "later", productId: string) => void;
}

const WishlistButton = ({
  onWishlistClick,
  onClick,
  isFavorited = false,
  userData,
  productId = "",
  productName = "",
  productImage,
  productPrice,
  productBrand,
  onSaveOptionSelect,
}: WishlistButtonProps) => {
  const { user } = useAuth();
  const [showSignUpDialog, setShowSignUpDialog] = useState(false);
  
  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      setShowSignUpDialog(true);
    } else {
      // Use onWishlistClick first, fall back to onClick if needed
      if (onWishlistClick) {
        onWishlistClick(e);
      } else if (onClick) {
        onClick(e);
      }
    }
  };
  
  const handleOptionSelect = (e: React.MouseEvent, option: "wishlist" | "later") => {
    e.stopPropagation();
    if (onSaveOptionSelect) {
      onSaveOptionSelect(option, productId);
    }
  };

  const trigger = (
    <button
      className={cn(
        "absolute top-2 right-2 h-8 w-8 rounded-full flex items-center justify-center bg-white/80 backdrop-blur-sm transition-all",
        isFavorited ? "text-red-500" : "text-gray-600 hover:text-red-500"
      )}
      onClick={handleWishlistClick}
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

  // Simplified logic for demo purposes
  if (!user || !userData) {
    return (
      <>
        {trigger}
        <SignUpDialog 
          open={showSignUpDialog} 
          onOpenChange={setShowSignUpDialog} 
        />
      </>
    );
  }

  // If we have user data and proper product info
  if (productId && productName) {
    return (
      <WishlistSelectionPopover
        productId={productId}
        productName={productName}
        productImage={productImage}
        productPrice={productPrice}
        productBrand={productBrand}
        trigger={trigger}
      />
    );
  }

  // Fallback if we're missing product info
  return (
    <>
      {trigger}
    </>
  );
};

export default WishlistButton;
