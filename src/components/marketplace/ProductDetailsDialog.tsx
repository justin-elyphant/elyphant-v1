import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Product } from "@/types/product";
import ProductDetailsImageSection from "./product-details/ProductDetailsImageSection";
import ProductDetailsActionsSection from "./product-details/ProductDetailsActionsSection";
import { useUnifiedWishlist } from "@/hooks/useUnifiedWishlist";

interface ProductDetailsDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userData: any;
}

const ProductDetailsDialog = ({
  product,
  open,
  onOpenChange,
  userData
}: ProductDetailsDialogProps) => {
  const [quantity, setQuantity] = useState(1);
  const [isHeartAnimating, setIsHeartAnimating] = useState(false);

  // Use unified wishlist system directly
  const { wishlists, loadWishlists } = useUnifiedWishlist();

  // Always recalculate isWishlisted live
  const isWishlisted =
    !!product &&
    wishlists.some(list =>
      Array.isArray(list.items) &&
      list.items.some(item => item.product_id === (product.product_id || product.id))
    );

  // Use loadWishlists instead of reloadWishlists
  const reloadWishlists = loadWishlists;

  // 1. Use the shared wishlist context:
  // 2. Check if the product is in ANY wishlist
  // 3. Update quantity
  const increaseQuantity = () => setQuantity(prev => Math.min(prev + 1, 10));
  const decreaseQuantity = () => setQuantity(prev => Math.max(prev - 1, 1));

  if (!product) return null;

  // 4. Share function (unchanged)
  const handleShareProduct = () => {
    if (navigator.share) {
      navigator.share({
        title: product.title || product.name || "Check out this product",
        text: `Check out this product: ${product.title || product.name}`,
        url: window.location.href,
      });
    }
  };

  // 5. Product features extraction (unchanged)
  const productFeatures = Array.isArray(product.product_details)
    ? product.product_details.map(detail => detail?.value || detail?.toString())
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px] p-0 overflow-hidden max-h-[90vh]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Pass isWishlisted to the image section */}
          <ProductDetailsImageSection
            product={product}
            isHeartAnimating={isHeartAnimating}
            onShare={handleShareProduct}
            isWishlisted={isWishlisted}
            reloadWishlists={reloadWishlists}
          />

          {/* Product Details Section */}
          <div className="p-6 overflow-y-auto max-h-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold mb-1">
                {product.title || product.name}
              </DialogTitle>
              <div className="flex items-center justify-between mt-2">
                <div className="text-lg font-bold">${product.price?.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">
                  {product.vendor && `By ${product.vendor}`}
                </div>
              </div>
            </DialogHeader>
            <Separator className="my-4" />
            <div className="mb-6">
              <p className="text-sm text-muted-foreground">
                {product.description || "No description available for this product."}
              </p>
            </div>
            {productFeatures.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium mb-2">Features</h4>
                <ul className="text-sm list-disc pl-4 space-y-1">
                  {productFeatures.map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
              </div>
            )}
            <ProductDetailsActionsSection
              product={product}
              quantity={quantity}
              onIncrease={increaseQuantity}
              onDecrease={decreaseQuantity}
              isHeartAnimating={isHeartAnimating}
              isWishlisted={isWishlisted}
              reloadWishlists={reloadWishlists}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsDialog;
