
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import WishlistSelectionPopoverButton from "@/components/gifting/wishlist/WishlistSelectionPopoverButton";
import SignUpDialog from "../SignUpDialog";

interface ProductDetailsImageSectionProps {
  product: any;
  productData: any;
  isHeartAnimating: boolean;
  onShare: () => void;
  isWishlisted?: boolean;
  reloadWishlists?: () => void;
}

const ProductDetailsImageSection = ({
  product,
  productData,
  isHeartAnimating,
  onShare,
  isWishlisted = false,
  reloadWishlists,
}: ProductDetailsImageSectionProps) => {
  const { user } = useAuth();
  const [showSignUpDialog, setShowSignUpDialog] = useState(false);

  const handleWishlistClick = () => {
    if (!user) {
      setShowSignUpDialog(true);
      return;
    }
  };

  const handleWishlistAdded = () => {
    if (reloadWishlists) {
      reloadWishlists();
    }
  };

  return (
    <>
      {/* Action Buttons Overlay - positioned absolutely over the carousel */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        {/* Share Button */}
        <Button
          variant="ghost"
          size="icon"
          className="bg-white/80 hover:bg-white"
          onClick={onShare}
        >
          <Share2 className="h-4 w-4" />
        </Button>

        {/* Wishlist Button - Always use the popover version for authenticated users */}
        {user ? (
          <WishlistSelectionPopoverButton
            product={{
              id: String(product.product_id || product.id),
              name: product.title || product.name || "",
              image: product.image || "",
              price: product.price,
              brand: product.brand || "",
            }}
            triggerClassName="bg-white/80 hover:bg-white text-gray-400 hover:text-pink-500 p-2"
            onAdded={handleWishlistAdded}
          />
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="bg-white/80 hover:bg-white text-gray-400 hover:text-pink-500"
            onClick={handleWishlistClick}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </Button>
        )}
      </div>

      <SignUpDialog 
        open={showSignUpDialog} 
        onOpenChange={setShowSignUpDialog} 
      />
    </>
  );
};

export default ProductDetailsImageSection;
