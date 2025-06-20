
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
  onRefresh?: () => void;
}

const MobileProductGrid = ({
  products,
  onProductClick,
  onWishlistClick,
  getProductStatus,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  onRefresh
}: MobileProductGridProps) => {
  const isMobile = useIsMobile();
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);
  const observer = useRef<IntersectionObserver>();
  const containerRef = useRef<HTMLDivElement>(null);

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
      if (entries[0].isIntersecting && displayedProducts.length < products.length) {
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
  }, [isLoading, page, products, displayedProducts.length, onLoadMore]);

  // Pull to refresh functionality
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

  const handleTouchEnd = async () => {
    if (pullDistance > 60 && onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
        }, 1000);
      }
    }
    setStartY(0);
    setPullDistance(0);
  };

  // Loading skeleton
  const renderSkeleton = () => (
    <div className="grid grid-cols-2 gap-3 px-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg border border-gray-100 overflow-hidden">
          <div className="aspect-[4/3] bg-gray-200 animate-pulse" />
          <div className="p-3 space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );

  if (isLoading && displayedProducts.length === 0) {
    return (
      <div className="py-4">
        {renderSkeleton()}
      </div>
    );
  }

  if (products.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12 px-4">
        <div className="max-w-sm mx-auto">
          <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-500 leading-relaxed">Try adjusting your search or filters to find what you're looking for.</p>
        </div>
      </div>
    );
  }

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
          className="absolute top-0 left-0 right-0 flex items-center justify-center py-4 text-sm text-gray-500 z-10 bg-white"
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

      {/* Product Grid */}
      <div className="grid grid-cols-2 gap-3 px-3 py-4">
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

      {/* Loading more indicator */}
      {isLoading && displayedProducts.length > 0 && (
        <div className="flex justify-center items-center py-8">
          <div className="flex items-center gap-2 text-gray-500">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            <span className="text-sm">Loading more products...</span>
          </div>
        </div>
      )}

      {/* End of results indicator */}
      {!isLoading && displayedProducts.length > 0 && displayedProducts.length >= products.length && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">You've reached the end!</p>
        </div>
      )}
    </div>
  );
};

export default MobileProductGrid;
