
import React from "react";
import { Product } from "@/types/product";
import ProductItemBase from "./ProductItemBase";
import { useCart } from "@/contexts/CartContext";

interface ProductItemProps {
  product: Product;
  viewMode: "grid" | "list" | "modern";
  onProductClick: (productId: string) => void;
  onWishlistClick?: () => void;
  isFavorited: boolean;
  statusBadge?: { badge: string; color: string } | null;
}

const ProductItem: React.FC<ProductItemProps> = ({
  product,
  viewMode,
  onProductClick,
  onWishlistClick,
  isFavorited,
  statusBadge
}) => {
  const { addToCart } = useCart();

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onWishlistClick) {
      onWishlistClick();
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product);
  };

  // Calculate discount percentage if applicable
  const discountPercent = product.sale_price && product.price > product.sale_price
    ? Math.round(((product.price - product.sale_price) / product.price) * 100)
    : null;

  return (
    <ProductItemBase
      product={product}
      viewMode={viewMode}
      onProductClick={onProductClick}
      onWishlistClick={handleWishlistClick}
      isFavorited={isFavorited}
      statusBadge={statusBadge}
      discountPercent={discountPercent}
    />
  );
};

export default ProductItem;
