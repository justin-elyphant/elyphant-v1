
import React from "react";
import { Product } from "@/types/product";
import ProductItemBase from "./ProductItemBase";

interface ProductItemProps {
  product: Product;
  viewMode: "grid" | "list" | "modern";
  onProductClick: (productId: string) => void;
  onWishlistClick: (e: React.MouseEvent) => void;
  isFavorited: boolean;
  statusBadge?: { badge: string; color: string } | null;
}

const ProductItem = ({
  product,
  viewMode,
  onProductClick,
  onWishlistClick,
  isFavorited,
  statusBadge
}: ProductItemProps) => {
  // Get the discount percentage if available
  const getDiscountPercent = () => {
    if ((product as any).original_price && (product as any).original_price > product.price) {
      const discount = ((product as any).original_price - product.price) / (product as any).original_price * 100;
      return Math.round(discount);
    }
    return null;
  };

  // Fallback for modern view, use grid
  const resolvedView = viewMode === "modern" ? "grid" : viewMode;
  const discountPercent = getDiscountPercent();

  return (
    <ProductItemBase
      product={product}
      viewMode={resolvedView}
      onProductClick={onProductClick}
      onWishlistClick={onWishlistClick}
      isFavorited={isFavorited}
      statusBadge={statusBadge}
      discountPercent={discountPercent}
    />
  );
};

export default ProductItem;

