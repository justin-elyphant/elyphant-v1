
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, ShoppingBag } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import WishlistSelectionPopoverButton from "@/components/gifting/wishlist/WishlistSelectionPopoverButton";
import SignUpDialog from "../SignUpDialog";
import { cn } from "@/lib/utils";
import { ZincProductDetail } from "@/services/enhancedZincApiService";

interface ProductDetailsImageSectionProps {
  product: any;
  productData: ZincProductDetail;
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [images, setImages] = useState([]);

  useEffect(() => {
    const images = Array.isArray(productData?.images) ? productData?.images : [productData?.main_image].filter(Boolean);
    setImages(images);
  }, [productData]);

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
      <div className="relative bg-gray-50 flex items-center justify-center min-h-[300px] md:min-h-[500px]">
        {/* Product Image */}
        {product.image ? (
          <img
            src={images[currentImageIndex] || "/placeholder.svg"}
            alt={product.title || product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <ShoppingBag className="w-16 h-16" />
          </div>
        )}

        {/* Navigation dots for multiple images */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors touch-target-44",
                  index === currentImageIndex ? "bg-white" : "bg-white/50"
                )}
                aria-label={`View image ${index + 1}`}
              />
            ))}
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
      </div>

      <SignUpDialog 
        open={showSignUpDialog} 
        onOpenChange={setShowSignUpDialog} 
      />
    </>
  );
};

export default ProductDetailsImageSection;
