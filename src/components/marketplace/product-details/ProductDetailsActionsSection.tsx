
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import SignUpDialog from "../SignUpDialog";
import WishlistSelectionPopoverButton from "@/components/gifting/wishlist/WishlistSelectionPopoverButton";

interface ProductDetailsActionsSectionProps {
  product: any;
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  isHeartAnimating: boolean;
  isWishlisted?: boolean;
  reloadWishlists?: () => void;
}

const ProductDetailsActionsSection = ({
  product,
  quantity,
  onIncrease,
  onDecrease,
  isHeartAnimating,
  isWishlisted = false,
  reloadWishlists,
}: ProductDetailsActionsSectionProps) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [showSignUpDialog, setShowSignUpDialog] = useState(false);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    toast.success(`Added ${quantity} ${product.title || product.name}(s) to cart`);
  };

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
      <div className="space-y-4">
        {/* Quantity Selector */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Quantity:</span>
          <div className="flex items-center border rounded-md">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDecrease}
              disabled={quantity <= 1}
              className="h-8 w-8 p-0"
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="px-3 py-1 text-sm font-medium min-w-[2rem] text-center">
              {quantity}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onIncrease}
              disabled={quantity >= 10}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button onClick={handleAddToCart} className="flex-1">
            <ShoppingBag className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>

          {/* Wishlist Button */}
          {user ? (
            <WishlistSelectionPopoverButton
              product={{
                id: String(product.product_id || product.id),
                name: product.title || product.name || "",
                image: product.image || "",
                price: product.price,
                brand: product.brand || "",
              }}
              triggerClassName="p-2"
              onAdded={handleWishlistAdded}
            />
          ) : (
            <Button
              variant="outline"
              size="icon"
              onClick={handleWishlistClick}
              className="flex-shrink-0"
            >
              <Heart className="h-4 w-4" />
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

export default ProductDetailsActionsSection;
