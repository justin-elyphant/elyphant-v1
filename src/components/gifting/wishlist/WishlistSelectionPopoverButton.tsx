
import React from "react";
import WishlistSelectionPopover from "@/components/marketplace/WishlistSelectionPopover";
import { useIsMobile } from "@/hooks/use-mobile";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/components/gifting/hooks/useWishlist";

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
  isWishlisted?: boolean; // NEW: explicit prop
}

const WishlistSelectionPopoverButton: React.FC<WishlistSelectionPopoverButtonProps> = ({
  product,
  triggerClassName,
  onAdded,
  isWishlisted, // NEW
}) => {
  const isMobile = useIsMobile();
  const { wishlists } = useWishlist();

  // Determine if product is in any wishlist, unless overridden with prop
  const computedIsWishlisted = typeof isWishlisted === "boolean"
    ? isWishlisted
    : wishlists.some(list =>
        Array.isArray(list.items) && list.items.some(item => item.product_id === product.id)
      );

  const triggerNode = (
    <Button
      variant="ghost"
      size="icon"
      className={triggerClassName || ""}
      aria-label="Add to wishlist"
    >
      <Heart
        className="h-4 w-4"
        fill={computedIsWishlisted ? "#ec4899" : "none"} // filled if in wishlist
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
      key={computedIsWishlisted ? "wishlisted" : "not-wishlisted"}
    />
  );
};

export default WishlistSelectionPopoverButton;
