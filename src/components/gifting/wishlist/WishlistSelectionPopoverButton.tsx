
import React from "react";
import WishlistSelectionPopover from "@/components/marketplace/WishlistSelectionPopover";
import { useIsMobile } from "@/hooks/use-mobile";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

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
}

const WishlistSelectionPopoverButton: React.FC<WishlistSelectionPopoverButtonProps> = ({
  product,
  triggerClassName,
  onAdded,
}) => {
  const isMobile = useIsMobile();

  const triggerNode = (
    <Button
      variant="ghost"
      size="icon"
      className={triggerClassName || ""}
      aria-label="Add to wishlist"
    >
      <Heart className="h-4 w-4" />
    </Button>
  );

  // Mobile: Full width popover, or fallback to dialog if needed.
  // Desktop: Standard popover.
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

