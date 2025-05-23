
import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Minus, Plus } from "lucide-react";
import AddToCartButton from "@/components/marketplace/components/AddToCartButton";
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

const ProductDetailsActionsSection: React.FC<ProductDetailsActionsSectionProps> = ({
  product,
  quantity,
  onIncrease,
  onDecrease,
  isHeartAnimating,
  isWishlisted,
  reloadWishlists
}) => {
  const productId = product.product_id || product.id || "";

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <Label htmlFor="quantity">Quantity</Label>
        <div className="flex items-center border rounded-md">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-r-none"
            onClick={onDecrease}
            disabled={quantity <= 1}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <div className="w-8 text-center">{quantity}</div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-l-none"
            onClick={onIncrease}
            disabled={quantity >= 10}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="flex gap-2">
        <AddToCartButton
          product={product}
          className="flex-1"
          quantity={quantity}
        />
        <WishlistSelectionPopoverButton
          product={{
            id: productId,
            name: product.title || product.name || "",
            image: product.image || "",
            price: product.price,
            brand: product.brand || "",
          }}
          triggerClassName={`flex-1 flex justify-center items-center px-4 py-2 rounded-md transition-colors ${isHeartAnimating ? "scale-105" : ""} ${"bg-pink-50"}`}
          onAdded={reloadWishlists}
          isWishlisted={isWishlisted}
        />
      </div>
    </div>
  );
};

export default ProductDetailsActionsSection;
