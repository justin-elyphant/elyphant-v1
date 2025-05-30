
import React from "react";
import WishlistSelectionPopover from "@/components/marketplace/WishlistSelectionPopover";
import { useIsMobile } from "@/hooks/use-mobile";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUnifiedWishlist } from "@/hooks/useUnifiedWishlist";

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
}

const WishlistSelectionPopoverButton: React.FC<WishlistSelectionPopoverButtonProps> = ({
  product,
  triggerClassName,
  onAdded,
  isWishlisted,
}) => {
  const isMobile = useIsMobile();
  const { isProductWishlisted } = useUnifiedWishlist();

  // Always live-calculate wishlist state
  const computedIsWishlisted = typeof isWishlisted === "boolean"
    ? isWishlisted
    : isProductWishlisted(product.id);

  const triggerNode = (
    <Button
      variant="ghost"
      size="icon"
      className={triggerClassName || ""}
      aria-label="Add to wishlist"
    >
      <Heart
        className="h-4 w-4"
        fill={computedIsWishlisted ? "#ec4899" : "none"}
        color={computedIsWishlisted ? "#ec4899" : undefined}
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
      onClose={onAdded}
    />
  );
};

export default WishlistSelectionPopoverButton;
