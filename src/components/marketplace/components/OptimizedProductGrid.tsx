import React, { memo, useMemo, useCallback } from "react";
import { Product } from "@/contexts/ProductContext";
import { useIsMobile } from "@/hooks/use-mobile";
import AirbnbStyleProductCard from "../AirbnbStyleProductCard";

interface OptimizedProductGridProps {
  products: Product[];
  viewMode: "grid" | "list" | "modern";
  onProductClick: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onShare: (product: Product) => void;
  getProductStatus?: (product: Product) => { badge: string; color: string } | null;
  className?: string;
}

const OptimizedProductGrid: React.FC<OptimizedProductGridProps> = memo(({
  products,
  viewMode,
  onProductClick,
  onAddToCart,
  onShare,
  getProductStatus,
  className = ""
}) => {
  const isMobile = useIsMobile();
  
  // Memoized grid classes to prevent recalculation
  const gridClasses = useMemo(() => {
    if (viewMode === "list") {
      return "space-y-4";
    }
    // Default to grid layout for "grid", "modern", or any other viewMode
    return isMobile
      ? "grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4 items-stretch"
      : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-stretch";
  }, [viewMode, isMobile]);

  // Memoized product click handlers to prevent recreation
  const createProductClickHandler = useCallback((product: Product) => {
    return () => onProductClick(product);
  }, [onProductClick]);

  const createAddToCartHandler = useCallback((product: Product) => {
    return () => onAddToCart(product);
  }, [onAddToCart]);

  const createShareHandler = useCallback((product: Product) => {
    return () => onShare(product);
  }, [onShare]);

  // Memoized product items to prevent unnecessary re-renders
  const productItems = useMemo(() => {
    return products.map((product) => {
      const productId = product.product_id || product.id;
      if (!productId) {
        console.warn("Product missing ID:", product);
        return null;
      }

      return (
        <MemoizedProductCard
          key={productId}
          product={product}
          onProductClick={createProductClickHandler(product)}
          onAddToCart={createAddToCartHandler(product)}
          onShare={createShareHandler(product)}
          statusBadge={getProductStatus?.(product)}
        />
      );
    }).filter(Boolean);
  }, [
    products, 
    createProductClickHandler, 
    createAddToCartHandler, 
    createShareHandler, 
    getProductStatus
  ]);

  return (
    <div className={`${gridClasses} ${className}`}>
      {productItems}
    </div>
  );
});

// Memoized product card to prevent unnecessary re-renders
const MemoizedProductCard = memo<{
  product: Product;
  onProductClick: () => void;
  onAddToCart: () => void;
  onShare: () => void;
  statusBadge?: { badge: string; color: string } | null;
}>(({ product, onProductClick, onAddToCart, onShare, statusBadge }) => {
  return (
    <AirbnbStyleProductCard
      product={product}
      onProductClick={onProductClick}
      statusBadge={statusBadge}
      onAddToCart={onAddToCart}
      onShare={onShare}
    />
  );
});

OptimizedProductGrid.displayName = "OptimizedProductGrid";
MemoizedProductCard.displayName = "MemoizedProductCard";

export default OptimizedProductGrid;