import React from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { useUnifiedWishlistSystem } from "@/hooks/useUnifiedWishlistSystem";
import WishlistSelectionPopoverButton from "@/components/gifting/wishlist/WishlistSelectionPopoverButton";

interface QuickWishlistButtonProps {
  productId: string;
  productName: string;
  productPrice?: number;
  productImage?: string;
  productBrand?: string;
  className?: string;
}

const QuickWishlistButton: React.FC<QuickWishlistButtonProps> = ({
  productId,
  productName,
  productPrice,
  productImage,
  productBrand,
  className,
}) => {
  const { user } = useAuth();
  const { wishlistedProducts } = useUnifiedWishlistSystem();
  const isWishlisted = wishlistedProducts.has(productId);

  if (!user) {
    return (
      <Button variant="ghost" size="icon" className={className}>
        <Heart className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <WishlistSelectionPopoverButton
      product={{
        id: productId,
        name: productName,
        price: productPrice,
        image: productImage,
        brand: productBrand,
      }}
      variant="icon"
      triggerClassName={className}
    />
  );
};

export default QuickWishlistButton;
