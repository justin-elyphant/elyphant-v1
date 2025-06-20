
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Product } from "@/types/product";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileProductCard from "./MobileProductCard";

interface MobileProductGridProps {
  products: Product[];
  onProductClick: (productId: string) => void;
  onWishlistClick?: () => void;
  getProductStatus: (product: Product) => { badge: string; color: string } | null;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

const MobileProductGrid = ({
  products,
  onProductClick,
  onWishlistClick,
  getProductStatus,
  isLoading = false,
  hasMore = false,
  onLoadMore
}: MobileProductGridProps) => {
  const isMobile = useIsMobile();
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const observer = useRef<IntersectionObserver>();
  const loadingRef = useRef<HTMLDivElement>(null);

  const PRODUCTS_PER_PAGE = 20;

  // Load initial products
  useEffect(() => {
    setDisplayedProducts(products.slice(0, PRODUCTS_PER_PAGE));
    setPage(1);
  }, [products]);

  // Infinite scroll callback
  const lastProductElementRef = useCallback((node: HTMLDivElement) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        const nextPage = page + 1;
        const nextProducts = products.slice(0, nextPage * PRODUCTS_PER_PAGE);
        setDisplayedProducts(nextProducts);
        setPage(nextPage);
        
        if (onLoadMore && nextProducts.length >= products.length) {
          onLoadMore();
        }
      }
    });
    
    if (node) observer.current.observe(node);
  }, [isLoading, hasMore, page, products, onLoadMore]);

  // Pull to refresh functionality
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY > 0 && containerRef.current?.scrollTop === 0) {
      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, (currentY - startY) / 3);
      setPullDistance(Math.min(distance, 80));
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 60) {
      setIsRefreshing(true);
      // Simulate refresh
      setTimeout(() => {
        setIsRefreshing(false);
        window.location.reload();
      }, 1500);
    }
    setStartY(0);
    setPullDistance(0);
  };

  const gridClasses = isMobile 
    ? "grid grid-cols-2 gap-3 px-3 mobile-grid-optimized safe-area-inset will-change-scroll"
    : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 intersection-target";

  return (
    <div 
      ref={containerRef}
      className="relative overflow-y-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ 
        transform: `translateY(${pullDistance}px)`,
        transition: pullDistance === 0 ? 'transform 0.3s ease' : 'none'
      }}
    >
      {/* Pull to refresh indicator */}
      {pullDistance > 0 && (
        <div 
          className="absolute top-0 left-0 right-0 flex items-center justify-center py-4 text-sm text-gray-500 z-10"
          style={{ transform: `translateY(-${Math.max(0, 80 - pullDistance)}px)` }}
        >
          {isRefreshing ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Refreshing...</span>
            </div>
          ) : pullDistance > 60 ? (
            <span>Release to refresh</span>
          ) : (
            <span>Pull to refresh</span>
          )}
        </div>
      )}

      <div className={gridClasses}>
        {displayedProducts.map((product, index) => {
          const productId = String(product.product_id || product.id);
          const statusBadge = getProductStatus(product);
          
          return (
            <div 
              key={productId}
              ref={index === displayedProducts.length - 3 ? lastProductElementRef : null}
              className="intersection-target"
            >
              <MobileProductCard
                product={product}
                onProductClick={onProductClick}
                onWishlistClick={onWishlistClick}
                statusBadge={statusBadge}
              />
            </div>
          );
        })}
      </div>

      {/* Loading indicator */}
      {(isLoading || hasMore) && (
        <div ref={loadingRef} className="flex justify-center items-center py-8">
          <div className="flex items-center gap-2 text-gray-500">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            <span className="text-sm">Loading more products...</span>
          </div>
        </div>
      )}

      {/* End of results indicator */}
      {!hasMore && displayedProducts.length > 0 && !isLoading && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">You've reached the end!</p>
        </div>
      )}
    </div>
  );
};

export default MobileProductGrid;
