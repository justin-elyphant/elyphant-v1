
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
  // New variation props
  selectedProductId?: string;
  variationText?: string;
  isVariationComplete?: boolean;
  // Context for button priority
  context?: 'marketplace' | 'wishlist';
}

const ProductDetailsActionsSection = ({
  product,
  quantity,
  onIncrease,
  onDecrease,
  isHeartAnimating,
  isWishlisted = false,
  reloadWishlists,
  selectedProductId,
  variationText,
  isVariationComplete = true,
  context = 'marketplace',
}: ProductDetailsActionsSectionProps) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [showSignUpDialog, setShowSignUpDialog] = useState(false);

  const handleAddToCart = () => {
    // Check if variations are complete before adding to cart
    if (!isVariationComplete) {
      toast.error("Please select all product options before adding to cart");
      return;
    }

    // Create enhanced product object with variation data
    const productToAdd = {
      ...product,
      // Use selected product ID if variations are present
      product_id: selectedProductId || product.product_id,
      id: selectedProductId || product.id,
      // Add variation display text for cart display
      variationText: variationText || "",
      selectedVariations: variationText || ""
    };

    for (let i = 0; i < quantity; i++) {
      addToCart(productToAdd);
    }
    
    const successMessage = variationText 
      ? `Added ${quantity} ${product.title || product.name}(s) (${variationText}) to cart`
      : `Added ${quantity} ${product.title || product.name}(s) to cart`;
    
    toast.success(successMessage);
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

        {/* Variation validation warning */}
        {!isVariationComplete && (
          <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded border">
            ⚠️ Please select all product options above
          </div>
        )}

        {/* Action Buttons - Context Aware */}
        <div className="flex gap-3">
          {context === 'wishlist' ? (
            // Wishlist Context: Wishlist button primary, Cart secondary
            <>
              {user ? (
                <WishlistSelectionPopoverButton
                  product={{
                    id: String(selectedProductId || product.product_id || product.id),
                    name: product.title || product.name || "",
                    image: product.image || "",
                    price: product.price,
                    brand: product.brand || "",
                  }}
                  triggerClassName="flex-1 h-10"
                  onAdded={handleWishlistAdded}
                />
              ) : (
                <Button
                  variant="default"
                  onClick={handleWishlistClick}
                  className="flex-1"
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Add to Wishlist
                </Button>
              )}
              
              <Button 
                onClick={handleAddToCart} 
                variant="outline"
                size="icon"
                disabled={!isVariationComplete}
                className="flex-shrink-0"
              >
                <ShoppingBag className="h-4 w-4" />
              </Button>
            </>
          ) : (
            // Marketplace Context: Cart button primary, Wishlist secondary
            <>
              <Button 
                onClick={handleAddToCart} 
                className="flex-1"
                disabled={!isVariationComplete}
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>

              {user ? (
                <WishlistSelectionPopoverButton
                  product={{
                    id: String(selectedProductId || product.product_id || product.id),
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
            </>
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
