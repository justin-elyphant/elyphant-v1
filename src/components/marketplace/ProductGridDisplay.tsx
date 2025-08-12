
import React from "react";
import { Product } from "@/types/product";
import ProductItem from "./product-item/ProductItem";
import MobileProductGrid from "./mobile/MobileProductGrid";
import { useUnifiedWishlist } from "@/hooks/useUnifiedWishlist";

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
  const { isProductWishlisted, loadWishlists } = useUnifiedWishlist();

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
      <MobileProductGrid
        products={products}
        onProductClick={handleProductClick}
        getProductStatus={getProductStatus}
        isLoading={false}
        hasMore={false}
      />
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
            <ProductItem
              product={product}
              viewMode={viewMode}
              onProductClick={() => handleProductClick(productId)}
              onWishlistClick={handleWishlistUpdate}
              isFavorited={isProductWishlisted(productId)}
              statusBadge={statusBadge}
            />
          </div>
        );
      })}
    </div>
  );
};

export default ProductGridDisplay;
