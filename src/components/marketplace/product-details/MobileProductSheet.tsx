
import React, { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Heart, Share2, ShoppingBag, Minus, Plus } from "lucide-react";
import { Product } from "@/types/product";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { triggerHapticFeedback, HapticPatterns } from "@/utils/haptics";
import WishlistSelectionPopoverButton from "@/components/gifting/wishlist/WishlistSelectionPopoverButton";
import { useAuth } from "@/contexts/auth";

interface MobileProductSheetProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isWishlisted?: boolean;
  onWishlistChange?: () => void;
}

const MobileProductSheet = ({
  product,
  open,
  onOpenChange,
  isWishlisted = false,
  onWishlistChange
}: MobileProductSheetProps) => {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { user } = useAuth();

  const increaseQuantity = () => setQuantity(prev => Math.min(prev + 1, 10));
  const decreaseQuantity = () => setQuantity(prev => Math.max(prev - 1, 1));

  const handleAddToCart = () => {
    triggerHapticFeedback(HapticPatterns.addToCart);
    
    // Add items to cart based on quantity
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    
    toast.success(`Added ${quantity} ${product.title || product.name}(s) to cart`);
  };

  const handleShare = () => {
    triggerHapticFeedback(HapticPatterns.buttonTap);
    if (navigator.share) {
      navigator.share({
        title: product.title || product.name || "Check out this product",
        text: `Check out this product: ${product.title || product.name}`,
        url: window.location.href,
      });
    }
  };

  const handleWishlistAdded = () => {
    if (onWishlistChange) {
      onWishlistChange();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-left">{product.title || product.name}</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-6">
          {/* Product Image */}
          <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden">
            {product.image ? (
              <img
                src={product.image}
                alt={product.title || product.name || "Product"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <span>No Image Available</span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">${product.price?.toFixed(2)}</div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleShare}
                  className="flex-shrink-0"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                
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
                    className="flex-shrink-0"
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {product.description && (
              <p className="text-gray-600 text-sm leading-relaxed">
                {product.description}
              </p>
            )}

            {product.brand && (
              <div className="text-sm text-gray-500">
                Brand: {product.brand}
              </div>
            )}
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Quantity:</span>
            <div className="flex items-center border rounded-md">
              <Button
                variant="ghost"
                size="sm"
                onClick={decreaseQuantity}
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
                onClick={increaseQuantity}
                disabled={quantity >= 10}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Add to Cart Button */}
          <Button 
            onClick={handleAddToCart}
            className="w-full h-12 text-base font-medium"
            size="lg"
          >
            <ShoppingBag className="h-5 w-5 mr-2" />
            Add to Cart
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileProductSheet;
