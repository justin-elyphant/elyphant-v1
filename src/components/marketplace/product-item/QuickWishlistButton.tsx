import React from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { useUnifiedWishlistSystem } from "@/hooks/useUnifiedWishlistSystem";
import WishlistSelectionPopoverButton from "@/components/gifting/wishlist/WishlistSelectionPopoverButton";
import { cn } from "@/lib/utils";

interface QuickWishlistButtonProps {
  productId: string;
  productName?: string;
  productPrice?: number;
  productImage?: string;
  productBrand?: string;
  className?: string;
  isFavorited?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "subtle" | "outline" | "floating";
}

const QuickWishlistButton: React.FC<QuickWishlistButtonProps> = ({
  productId,
  productName = "",
  productPrice,
  productImage,
  productBrand,
  className,
  isFavorited,
  onClick,
  size = "md",
  variant = "default",
}) => {
  const { user } = useAuth();
  const { wishlistedProducts } = useUnifiedWishlistSystem();
  
  // Use prop if provided, otherwise check from hook (using includes for array)
  const isWishlisted = isFavorited ?? wishlistedProducts.includes(productId);

  const sizeClasses = {
    sm: "h-7 w-7",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  if (!user) {
    return (
      <Button 
        variant="ghost" 
        size="icon" 
        className={cn(sizeClasses[size], className)}
        onClick={onClick}
      >
        <Heart className={iconSizes[size]} />
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
      triggerClassName={cn(sizeClasses[size], className)}
      isWishlisted={isWishlisted}
    />
  );
};

export default QuickWishlistButton;
