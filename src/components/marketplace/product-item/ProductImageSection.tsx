
import React from "react";
import { Badge } from "@/components/ui/badge";
import WishlistSelectionPopoverButton from "@/components/gifting/wishlist/WishlistSelectionPopoverButton";
import { Product } from "@/types/product";
import { getPrimaryProductImage } from "./getPrimaryProductImage";
import { useLazyImage } from "@/hooks/useLazyImage";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();

  // Layout/size tweaks per view
  const aspectClass = viewMode === "list" ? "relative w-full xs:w-1/3 aspect-square" : "aspect-square overflow-hidden relative";

  return (
    <div className={aspectClass}>
      {statusBadge && (
        <div className="absolute top-2 left-2 z-10">
          <Badge className={statusBadge.color}>{statusBadge.badge}</Badge>
        </div>
      )}

      {/* On grid view, always show the popover-based wishlist button */}
      {viewMode === "grid" && (
        <div
          className="absolute top-2 right-2 z-10"
          onClick={e => e.stopPropagation()}
        >
          <WishlistSelectionPopoverButton
            variant="icon"
            product={{
              id: String(product.product_id || product.id),
              name: product.title || product.name || "",
              image: productImage,
              price: product.price,
              brand: product.brand || "",
            }}
            triggerClassName={`p-1.5 rounded-full transition-colors ${
              isFavorited 
                ? "bg-pink-100 text-pink-500 hover:bg-pink-200"
                : "bg-white/80 text-gray-400 hover:text-pink-500 hover:bg-white"
            }`}
            onAdded={undefined} // for now, no callback on tile
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
      {/* List view hearted handled in ProductInfoSection */}
    </div>
  );
};

export default ProductImageSection;
