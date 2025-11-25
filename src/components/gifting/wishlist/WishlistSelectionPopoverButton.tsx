
import React from "react";
import WishlistSelectionPopover from "@/components/marketplace/WishlistSelectionPopover";
import { useIsMobile } from "@/hooks/use-mobile";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUnifiedWishlistSystem } from "@/hooks/useUnifiedWishlistSystem";

interface WishlistSelectionPopoverButtonProps {
  product: {
    id: string;
    name: string;
    image?: string;
    price?: number;
    brand?: string;
  };
  triggerClassName?: string;
  onAdded?: () => void;
  isWishlisted?: boolean;
  showText?: boolean;
}

const WishlistSelectionPopoverButton: React.FC<WishlistSelectionPopoverButtonProps> = ({
  product,
  triggerClassName,
  onAdded,
  isWishlisted,
  showText = false,
}) => {
  const isMobile = useIsMobile();
  const { isProductWishlisted, loadWishlists } = useUnifiedWishlistSystem();

  // Always live-calculate wishlist state - this ensures we show the correct state
  const computedIsWishlisted = typeof isWishlisted === "boolean"
    ? isWishlisted
    : isProductWishlisted(product.id);

  

  const handleAdded = async () => {
    
    
    // Refresh the wishlist state first
    await loadWishlists();
    
    if (onAdded) {
      onAdded();
    }
    
    // Force a small delay to ensure state propagation
    setTimeout(() => {
      // State propagated
    }, 100);
  };

  const triggerNode = showText ? (
    <Button
      variant="ghost"
      className={triggerClassName || ""}
      aria-label="Add to wishlist"
    >
      <Heart
        className="h-5 w-5 mr-2"
        fill={computedIsWishlisted ? "currentColor" : "none"}
        strokeWidth={2}
      />
      Add to Wishlist
    </Button>
  ) : (
    <Button
      variant="ghost"
      size="icon"
      className={triggerClassName || ""}
      aria-label="Add to wishlist"
    >
      <Heart
        className="h-4 w-4"
        fill={computedIsWishlisted ? "white" : "none"}
        color={computedIsWishlisted ? "white" : undefined}
        strokeWidth={computedIsWishlisted ? 2.5 : 2}
      />
    </Button>
  );

  return (
    <WishlistSelectionPopover
      productId={product.id}
      productName={product.name}
      productImage={product.image}
      productPrice={product.price}
      productBrand={product.brand}
      trigger={triggerNode}
      className={isMobile ? "w-full" : ""}
      onClose={handleAdded}
    />
  );
};

export default WishlistSelectionPopoverButton;
