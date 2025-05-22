
import React from "react";
import { Badge } from "@/components/ui/badge";
import QuickWishlistButton from "./QuickWishlistButton";
import { Product } from "@/types/product";
import { getPrimaryProductImage } from "./getPrimaryProductImage";
import { useLazyImage } from "@/hooks/useLazyImage";

interface ProductImageSectionProps {
  product: Product;
  viewMode: "grid" | "list";
  statusBadge?: { badge: string; color: string } | null;
  discountPercent?: number | null;
  isFavorited: boolean;
  onWishlistClick: (e: React.MouseEvent) => void;
}

const ProductImageSection: React.FC<ProductImageSectionProps> = ({
  product,
  viewMode,
  statusBadge,
  discountPercent,
  isFavorited,
  onWishlistClick
}) => {
  const productImage = getPrimaryProductImage(product);
  const { src: imageSrc } = useLazyImage(productImage);

  // Layout/size tweaks per view
  const aspectClass = viewMode === "list" ? "relative w-full xs:w-1/3 aspect-square" : "aspect-square overflow-hidden relative";

  return (
    <div className={aspectClass}>
      {statusBadge && (
        <div className="absolute top-2 left-2 z-10">
          <Badge className={statusBadge.color}>{statusBadge.badge}</Badge>
        </div>
      )}

      {viewMode === "grid" && (
        <div className="absolute top-2 right-2 z-10">
          <QuickWishlistButton
            productId={product.product_id || product.id || ""}
            isFavorited={isFavorited}
            onClick={onWishlistClick}
            size="md"
            variant="default"
          />
        </div>
      )}
      {discountPercent && (
        <div className={`absolute ${viewMode === "list" ? "top-2 right-2" : "bottom-2 left-2"} z-10`}>
          <Badge className="bg-red-100 text-red-800 border-red-200">
            {discountPercent}% OFF
          </Badge>
        </div>
      )}
      <img
        src={imageSrc}
        alt={product.title || product.name || ""}
        className={`w-full h-full object-cover ${viewMode === "grid" ? "transition-transform hover:scale-105 duration-300" : ""}`}
        loading="lazy"
      />
      {/* For list view, add small wishlist button under title (done in ProductInfoSection) */}
    </div>
  );
};

export default ProductImageSection;

