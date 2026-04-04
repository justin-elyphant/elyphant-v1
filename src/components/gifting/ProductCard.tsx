
import React from "react";
import MarketplaceProductCard from "@/components/marketplace/ProductCard";

interface ProductCardProps {
  product: any;
  isWishlisted?: boolean;
  isGifteeView?: boolean; 
  onToggleWishlist?: () => void;
  onClick?: () => void;
}

/**
 * Gifting ProductCard - thin wrapper around the primary Lululemon-inspired ProductCard.
 * Maintains backward compatibility for ProductGallery while using the unified design system.
 */
const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isWishlisted = false,
  isGifteeView = true, 
  onToggleWishlist,
  onClick
}) => {
  return (
    <MarketplaceProductCard
      product={product}
      onProductClick={onClick || (() => {})}
      isWishlisted={isWishlisted}
      isGifteeView={isGifteeView}
      onToggleWishlist={onToggleWishlist}
      viewMode="grid"
    />
  );
};

export default ProductCard;
