
import React from "react";
import { Product } from "@/types/product";
import AirbnbStyleProductCard from "./AirbnbStyleProductCard";
import MobileProductGrid from "./mobile/MobileProductGrid";
import { useUnifiedWishlistSystem } from "@/hooks/useUnifiedWishlistSystem";

interface ProductGridDisplayProps {
  products: Product[];
  viewMode: "grid" | "list" | "modern";
  getProductStatus: (product: Product) => { badge: string; color: string } | null;
  handleProductClick: (productId: string) => void;
  toggleWishlist: (e: React.MouseEvent, productInfo: any) => void;
  isFavorited: (productId: string) => boolean;
  isMobile: boolean;
}

const ProductGridDisplay: React.FC<ProductGridDisplayProps> = ({
  products,
  viewMode,
  getProductStatus,
  handleProductClick,
  toggleWishlist,
  isFavorited,
  isMobile
}) => {
  const { isProductWishlisted, loadWishlists } = useUnifiedWishlistSystem();

  if (products.length === 0) {
    return (
      <div className="text-center py-12 safe-area-inset">
        <div className="max-w-sm mx-auto">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-500 leading-relaxed">Try adjusting your search or filters to find what you're looking for.</p>
        </div>
      </div>
    );
  }

  const handleWishlistUpdate = async () => {
    // Refresh wishlist state when items are added/removed
    await loadWishlists();
  };

  // Use mobile-optimized grid for mobile devices
  if (isMobile) {
    return (
      <div className="safe-area-inset ios-scroll" role="region" aria-label="Product grid">
        <div className="grid grid-cols-2 gap-3 p-4 items-stretch mobile-grid-optimized">
          {products.map((product, index) => {
            const productId = String(product.product_id || product.id);
            const statusBadge = getProductStatus(product);
            
            return (
              <div key={productId} className="flex" style={{ contentVisibility: index > 10 ? 'auto' : 'visible' }}>
                <AirbnbStyleProductCard
                  product={product}
                  viewMode="grid"
                  onProductClick={() => handleProductClick(productId)}
                  onWishlistClick={handleWishlistUpdate}
                  statusBadge={statusBadge}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Desktop grid layout with enhanced spacing and performance optimizations
  const getGridClasses = () => {
    return viewMode === "list" 
      ? "grid grid-cols-1 gap-4 intersection-target will-change-scroll items-stretch" 
      : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 intersection-target will-change-scroll items-stretch";
  };

  return (
    <div className={getGridClasses()}>
      {products.map((product) => {
        const productId = String(product.product_id || product.id);
        const statusBadge = getProductStatus(product);
        
        return (
          <div key={productId} className="intersection-target">
            <AirbnbStyleProductCard
              product={product}
              viewMode={viewMode}
              onProductClick={() => handleProductClick(productId)}
              onWishlistClick={handleWishlistUpdate}
              statusBadge={statusBadge}
            />
          </div>
        );
      })}
    </div>
  );
};

export default ProductGridDisplay;
