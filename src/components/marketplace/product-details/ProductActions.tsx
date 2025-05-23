
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import BuyNowButton from "./BuyNowButton";
import SignUpDialog from "../SignUpDialog";
import { useAuth } from "@/contexts/auth";
import WishlistSelectionPopoverButton from "@/components/gifting/wishlist/WishlistSelectionPopoverButton";
import { useIsMobile } from "@/hooks/use-mobile";

interface ProductActionsProps {
  product: any;
  className?: string;
  onAddToCart?: () => void;
  isInWishlist?: boolean;
  userData?: any;
}

const ProductActions = ({
  product,
  className = "",
  onAddToCart,
  isInWishlist = false,
  userData,
}: ProductActionsProps) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [showSignUpDialog, setShowSignUpDialog] = useState(false);
  const isMobile = useIsMobile();

  const handleAddToCart = () => {
    addToCart(product);
    if (onAddToCart) onAddToCart();
  };

  // Responsive: Popover will expand on mobile, be smaller on desktop
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex gap-3">
        <Button
          onClick={handleAddToCart}
          variant="outline"
          className="flex-1 border-primary/20"
        >
          <ShoppingBag className="h-4 w-4 mr-2" />
          Add to Cart
        </Button>
        {/* Always use popover-based wishlist button */}
        <div onClick={e => e.stopPropagation()}>
          <WishlistSelectionPopoverButton
            product={{
              id: String(product.id),
              name: product.title || product.name || "",
              image: product.image || "",
              price: product.price,
              brand: product.brand || "",
            }}
            triggerClassName={`p-1.5 rounded-full transition-colors ${isInWishlist
                ? "bg-pink-100 text-pink-500 hover:bg-pink-200"
                : "bg-white/80 text-gray-400 hover:text-pink-500 hover:bg-white"
              }`}
            onAdded={undefined}
          />
        </div>
      </div>

      <BuyNowButton 
        productId={product.id}
        productName={product.name}
        price={product.price}
        productImage={product.image}
        className="w-full"
      />

      <SignUpDialog 
        open={showSignUpDialog} 
        onOpenChange={setShowSignUpDialog} 
      />
    </div>
  );
};

export default ProductActions;
