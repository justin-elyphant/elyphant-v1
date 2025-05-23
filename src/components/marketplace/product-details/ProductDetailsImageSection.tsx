
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import WishlistSelectionPopoverButton from "@/components/gifting/wishlist/WishlistSelectionPopoverButton";

interface ProductDetailsImageSectionProps {
  product: any;
  isHeartAnimating: boolean;
  onShare: () => void;
  isWishlisted?: boolean;
  reloadWishlists?: () => void;
}

const ProductDetailsImageSection: React.FC<ProductDetailsImageSectionProps> = ({
  product,
  isHeartAnimating,
  onShare,
  isWishlisted,
  reloadWishlists
}) => {
  const productId = product.product_id || product.id || "";

  return (
    <div className="h-[250px] md:h-[500px] bg-muted relative overflow-hidden">
      {product.image && (
        <img
          src={product.image}
          alt={product.title || product.name || "Product"}
          className="w-full h-full object-cover"
        />
      )}
      {/* Badges */}
      <div className="absolute top-2 left-2 space-x-2">
        {product.tags?.includes("bestseller") && (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200">Best Seller</Badge>
        )}
        {product.tags?.includes("new") && (
          <Badge className="bg-green-100 text-green-800 border-green-200">New</Badge>
        )}
      </div>
      {/* Action buttons - pass isWishlisted */}
      <div className="absolute top-2 right-2 flex space-x-1">
        <WishlistSelectionPopoverButton
          product={{
            id: productId,
            name: product.title || product.name || "",
            image: product.image || "",
            price: product.price,
            brand: product.brand || "",
          }}
          triggerClassName={`rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-all duration-200 p-2 ${isHeartAnimating ? "scale-125" : ""}`}
          onAdded={reloadWishlists}
          isWishlisted={isWishlisted}
        />
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full bg-white/80 backdrop-blur-sm hover:bg-white"
          onClick={onShare}
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ProductDetailsImageSection;
