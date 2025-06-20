
import React, { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Heart, Plus, Minus } from "lucide-react";
import { Product } from "@/types/product";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/auth";
import WishlistSelectionPopoverButton from "@/components/gifting/wishlist/WishlistSelectionPopoverButton";
import { toast } from "sonner";

interface MobileProductSheetProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isWishlisted?: boolean;
  onWishlistChange?: () => Promise<void>;
}

const MobileProductSheet: React.FC<MobileProductSheetProps> = ({
  product,
  open,
  onOpenChange,
  isWishlisted = false,
  onWishlistChange,
}) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  if (!product) return null;

  const productId = String(product.product_id || product.id);
  const productName = product.title || product.name || "";

  const handleAddToCart = async () => {
    if (isAdding) return;
    
    setIsAdding(true);
    try {
      addToCart(product, quantity);
      toast.success(`Added ${quantity} ${productName} to cart`);
    } catch (error) {
      toast.error("Failed to add to cart");
      console.error("Add to cart error:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleWishlistAdded = async () => {
    if (onWishlistChange) {
      await onWishlistChange();
    }
  };

  const formatPrice = (price: number | undefined) => {
    if (!price) return "Price not available";
    return `$${price.toFixed(2)}`;
  };

  const renderRating = () => {
    const rating = product.rating || product.stars || 0;
    const reviewCount = product.reviewCount || product.num_reviews || 0;
    
    if (!rating) return null;

    return (
      <div className="flex items-center gap-1">
        <div className="flex items-center">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-medium ml-1">{rating.toFixed(1)}</span>
        </div>
        {reviewCount > 0 && (
          <span className="text-sm text-gray-500">({reviewCount} reviews)</span>
        )}
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="text-left text-lg font-semibold">
              {productName}
            </SheetTitle>
          </SheetHeader>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Product Image */}
            <div className="aspect-square bg-gray-50 relative">
              {product.image ? (
                <img
                  src={product.image}
                  alt={productName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Image Available
                </div>
              )}
              
              {/* Wishlist Button */}
              <div className="absolute top-4 right-4">
                {user ? (
                  <WishlistSelectionPopoverButton
                    product={{
                      id: productId,
                      name: productName,
                      image: product.image,
                      price: product.price,
                      brand: product.brand,
                    }}
                    triggerClassName="bg-white/90 backdrop-blur-sm hover:bg-white text-gray-600 hover:text-pink-500 p-2 rounded-full transition-colors shadow-sm"
                    onAdded={handleWishlistAdded}
                    isWishlisted={isWishlisted}
                  />
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-white/90 backdrop-blur-sm hover:bg-white text-gray-600 hover:text-pink-500 rounded-full p-2 shadow-sm"
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Product Details */}
            <div className="p-4 space-y-4">
              {/* Brand */}
              {product.brand && (
                <Badge variant="secondary" className="text-xs">
                  {product.brand}
                </Badge>
              )}

              {/* Price */}
              <div className="text-2xl font-bold text-gray-900">
                {formatPrice(product.price)}
              </div>

              {/* Rating */}
              {renderRating()}

              {/* Description */}
              {product.description && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Features */}
              {product.features && product.features.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Features</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {product.features.slice(0, 5).map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-gray-400 mr-2">•</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Footer with Add to Cart */}
          <div className="border-t bg-white p-4 space-y-3">
            {/* Quantity Selector */}
            <div className="flex items-center justify-center gap-4">
              <span className="text-sm font-medium">Quantity:</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="h-8 w-8"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                  className="h-8 w-8"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <Button
              onClick={handleAddToCart}
              disabled={isAdding}
              className="w-full h-12 text-base font-medium"
            >
              {isAdding ? "Adding..." : `Add ${quantity} to Cart • ${formatPrice((product.price || 0) * quantity)}`}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileProductSheet;
