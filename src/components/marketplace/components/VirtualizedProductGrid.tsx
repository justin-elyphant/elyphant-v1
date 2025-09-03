import React, { memo, useMemo, useCallback, useRef, useEffect, useState } from "react";
import { Product } from "@/contexts/ProductContext";
import { useIsMobile } from "@/hooks/use-mobile";
import AirbnbStyleProductCard from "../AirbnbStyleProductCard";
import { calculateVisibleRange } from "@/utils/performanceOptimization";

interface VirtualizedProductGridProps {
  products: Product[];
  viewMode: "grid" | "list" | "modern";
  onProductClick: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onShare: (product: Product) => void;
  getProductStatus?: (product: Product) => { badge: string; color: string } | null;
  className?: string;
  itemHeight?: number;
  containerHeight?: number;
  overscan?: number;
}

const VirtualizedProductGrid: React.FC<VirtualizedProductGridProps> = memo(({
  products,
  viewMode,
  onProductClick,
  onAddToCart,
  onShare,
  getProductStatus,
  className = "",
  itemHeight = 400,
  containerHeight = 600,
  overscan = 5
}) => {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  
  // Calculate columns based on view mode and screen size
  const columns = useMemo(() => {
    if (viewMode === "list") return 1;
    // Default to grid layout for "grid", "modern", or any other viewMode
    return isMobile ? 2 : 4;
  }, [viewMode, isMobile]);

  // Memoized grid classes
  const gridClasses = useMemo(() => {
    if (viewMode === "list") {
      return "space-y-4";
    }
    // Default to grid layout for "grid", "modern", or any other viewMode
    return isMobile
      ? "grid grid-cols-2 gap-3 sm:gap-4"
      : "grid grid-cols-4 gap-4";
  }, [viewMode, isMobile]);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const totalRows = Math.ceil(products.length / columns);
    return calculateVisibleRange(scrollTop, containerHeight, itemHeight, totalRows);
  }, [scrollTop, containerHeight, itemHeight, products.length, columns]);

  // Get visible products with overscan
  const visibleProducts = useMemo(() => {
    const startIndex = Math.max(0, (visibleRange.startIndex - overscan) * columns);
    const endIndex = Math.min(products.length, (visibleRange.endIndex + overscan) * columns);
    return products.slice(startIndex, endIndex).map((product, index) => ({
      product,
      index: startIndex + index
    }));
  }, [products, visibleRange, columns, overscan]);

  // Scroll handler
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  // Memoized product click handlers
  const createProductClickHandler = useCallback((product: Product) => {
    return () => onProductClick(product);
  }, [onProductClick]);

  const createAddToCartHandler = useCallback((product: Product) => {
    return () => onAddToCart(product);
  }, [onAddToCart]);

  const createShareHandler = useCallback((product: Product) => {
    return () => onShare(product);
  }, [onShare]);

  // Calculate total height
  const totalHeight = Math.ceil(products.length / columns) * itemHeight;

  // Calculate offset for visible items
  const offsetY = Math.max(0, (visibleRange.startIndex - overscan)) * itemHeight;

  return (
    <div 
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      {/* Total height container */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Visible items container */}
        <div 
          className={gridClasses}
          style={{ 
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleProducts.map(({ product, index }) => {
            const productId = product.product_id || product.id;
            if (!productId) {
              console.warn("Product missing ID:", product);
              return null;
            }

            return (
              <VirtualizedProductCard
                key={`${productId}-${index}`}
                product={product}
                onProductClick={createProductClickHandler(product)}
                onAddToCart={createAddToCartHandler(product)}
                onShare={createShareHandler(product)}
                statusBadge={getProductStatus?.(product)}
                style={{ height: itemHeight }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
});

// Memoized virtualized product card
const VirtualizedProductCard = memo<{
  product: Product;
  onProductClick: () => void;
  onAddToCart: () => void;
  onShare: () => void;
  statusBadge?: { badge: string; color: string } | null;
  style?: React.CSSProperties;
}>(({ product, onProductClick, onAddToCart, onShare, statusBadge, style }) => {
  return (
    <div style={style}>
      <AirbnbStyleProductCard
        product={product}
        onProductClick={onProductClick}
        statusBadge={statusBadge}
        onAddToCart={onAddToCart}
        onShare={onShare}
      />
    </div>
  );
});

VirtualizedProductGrid.displayName = "VirtualizedProductGrid";
VirtualizedProductCard.displayName = "VirtualizedProductCard";

export default VirtualizedProductGrid;