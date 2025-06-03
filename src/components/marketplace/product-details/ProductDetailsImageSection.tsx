
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, ShoppingBag } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import QuickWishlistButton from "../product-item/QuickWishlistButton";
import SignUpDialog from "../SignUpDialog";

interface ProductDetailsImageSectionProps {
  product: any;
  isHeartAnimating: boolean;
  onShare: () => void;
  isWishlisted?: boolean;
  reloadWishlists?: () => void;
}

const ProductDetailsImageSection = ({
  product,
  isHeartAnimating,
  onShare,
  isWishlisted = false,
  reloadWishlists,
}: ProductDetailsImageSectionProps) => {
  const { user } = useAuth();
  const [showSignUpDialog, setShowSignUpDialog] = useState(false);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      setShowSignUpDialog(true);
      return;
    }

    // If user is authenticated, this will be handled by QuickWishlistButton
    if (reloadWishlists) {
      reloadWishlists();
    }
  };

  return (
    <>
      <div className="relative bg-gray-50 flex items-center justify-center min-h-[300px] md:min-h-[500px]">
        {/* Product Image */}
        {product.image ? (
          <img
            src={product.image}
            alt={product.title || product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <ShoppingBag className="w-16 h-16" />
          </div>
        )}

        {/* Action Buttons Overlay */}
        <div className="absolute top-4 right-4 flex gap-2">
          {/* Share Button */}
          <Button
            variant="ghost"
            size="icon"
            className="bg-white/80 hover:bg-white"
            onClick={onShare}
          >
            <Share2 className="h-4 w-4" />
          </Button>

          {/* Wishlist Button - Show SignUp dialog for unauthenticated users */}
          {user ? (
            <QuickWishlistButton
              productId={String(product.product_id || product.id)}
              isFavorited={isWishlisted}
              onClick={handleWishlistClick}
              size="md"
              variant="floating"
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
      </div>

      <SignUpDialog 
        open={showSignUpDialog} 
        onOpenChange={setShowSignUpDialog} 
      />
    </>
  );
};

export default ProductDetailsImageSection;
