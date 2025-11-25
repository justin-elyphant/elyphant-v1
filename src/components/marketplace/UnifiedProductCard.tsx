import React from "react";
import { Product } from "@/types/product";
import AirbnbStyleProductCard from "./AirbnbStyleProductCard";

// Union type for all possible product card props interfaces
type UnifiedProductCardProps = 
  // AirbnbStyleProductCard interface (already supported)
  | {
      cardType?: "airbnb";
      product: Product;
      onProductClick: () => void;
      statusBadge?: { badge: string; color: string } | null;
      isLocal?: boolean;
      vendorInfo?: { name: string; location: string; };
      onAddToCart?: (product: Product) => void;
      onShare?: (product: Product) => void;
      viewMode?: "grid" | "list" | "modern";
      isFavorited?: boolean;
      onToggleFavorite?: (e: React.MouseEvent) => void;
      onClick?: () => void;
      onWishlistClick?: () => void;
      isWishlisted?: boolean;
      isGifteeView?: boolean;
      onToggleWishlist?: () => void;
    }
  // ModernProductCard interface
  | {
      cardType: "modern";
      product: Product;
      isFavorited: boolean;
      onToggleFavorite: (e: React.MouseEvent) => void;
      onAddToCart: (e: React.MouseEvent) => void;
      onClick: () => void;
      statusBadge?: { badge: string; color: string } | null;
    }
  // MobileProductCard interface
  | {
      cardType: "mobile";
      product: Product;
      onProductClick: (productId: string) => void;
      onWishlistClick?: () => void;
      statusBadge?: { badge: string; color: string } | null;
    }
  // ProductCard (gifting) interface
  | {
      cardType: "gifting";
      product: any;
      isWishlisted?: boolean;
      isGifteeView?: boolean;
      onToggleWishlist?: () => void;
      onClick?: () => void;
      onAddToCart?: (product: Product) => void;
      context?: 'marketplace' | 'wishlist';
      hideTopRightAction?: boolean;
    }
  // General ProductCard interface
  | {
      cardType: "general";
      product: Product;
      onClick?: () => void;
      statusBadge?: { badge: string; color: string } | null;
      onAddToCart?: (product: Product) => void;
      onShare?: (product: Product) => void;
      isInCategorySection?: boolean;
    };

/**
 * UnifiedProductCard - A wrapper component that provides backward compatibility
 * for all existing product card interfaces while using the enhanced AirbnbStyleProductCard
 * as the underlying implementation.
 * 
 * This component maps different legacy prop interfaces to the unified interface,
 * enabling a smooth transition to the new unified card system.
 */
const UnifiedProductCard: React.FC<UnifiedProductCardProps> = (props) => {
  const { cardType = "airbnb", ...otherProps } = props;

  // Map different card types to unified AirbnbStyleProductCard props
  switch (cardType) {
    case "modern": {
      const modernProps = props as Extract<UnifiedProductCardProps, { cardType: "modern" }>;
      return (
        <AirbnbStyleProductCard
          product={modernProps.product}
          onProductClick={modernProps.onClick}
          statusBadge={modernProps.statusBadge}
          onAddToCart={(product) => modernProps.onAddToCart({} as React.MouseEvent)}
          isFavorited={modernProps.isFavorited}
          onToggleFavorite={modernProps.onToggleFavorite}
          viewMode="modern"
        />
      );
    }

    case "mobile": {
      const mobileProps = props as Extract<UnifiedProductCardProps, { cardType: "mobile" }>;
      const productId = String(mobileProps.product.product_id || mobileProps.product.id);
      return (
        <AirbnbStyleProductCard
          product={mobileProps.product}
          onProductClick={() => mobileProps.onProductClick(productId)}
          onWishlistClick={mobileProps.onWishlistClick}
          statusBadge={mobileProps.statusBadge}
          viewMode="grid"
        />
      );
    }

    case "gifting": {
      const giftingProps = props as Extract<UnifiedProductCardProps, { cardType: "gifting" }>;
      return (
        <AirbnbStyleProductCard
          product={giftingProps.product}
          onProductClick={giftingProps.onClick || (() => {})}
          isWishlisted={giftingProps.isWishlisted}
          isGifteeView={giftingProps.isGifteeView}
          onToggleWishlist={giftingProps.onToggleWishlist}
          onAddToCart={giftingProps.onAddToCart}
          viewMode="grid"
          context={giftingProps.context}
          hideTopRightAction={giftingProps.hideTopRightAction}
        />
      );
    }

    case "general": {
      const generalProps = props as Extract<UnifiedProductCardProps, { cardType: "general" }>;
      return (
        <AirbnbStyleProductCard
          product={generalProps.product}
          onProductClick={generalProps.onClick || (() => {})}
          statusBadge={generalProps.statusBadge}
          onAddToCart={generalProps.onAddToCart}
          onShare={generalProps.onShare}
          viewMode="grid"
          isInCategorySection={generalProps.isInCategorySection}
        />
      );
    }

    default: {
      // Default to airbnb style (direct pass-through)
      const airbnbProps = props as Extract<UnifiedProductCardProps, { cardType?: "airbnb" }>;
      return <AirbnbStyleProductCard {...airbnbProps} />;
    }
  }
};

export default UnifiedProductCard;