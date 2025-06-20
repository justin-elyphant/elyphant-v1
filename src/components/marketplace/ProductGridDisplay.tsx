
import React from "react";
import { Product } from "@/types/product";
import ProductItem from "./product-item/ProductItem";
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
        <p className="text-gray-500 leading-relaxed">No products found</p>
      </div>
    );
  }

  // Enhanced mobile grid layout for better visual impact and iOS optimization
  const getGridClasses = () => {
    if (isMobile) {
      // Mobile: Edge-to-edge with minimal gaps for maximum visual impact and iOS touch optimization
      return viewMode === "list" 
        ? "grid grid-cols-1 gap-3 mobile-grid-optimized safe-area-inset will-change-scroll" 
        : "grid grid-cols-2 gap-2 px-2 mobile-grid-optimized safe-area-inset will-change-scroll";
    }
    
    // Desktop: Standard responsive grid with performance optimizations
    return viewMode === "list" 
      ? "grid grid-cols-1 gap-4 intersection-target" 
      : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 intersection-target";
  };

  const handleWishlistUpdate = async () => {
    // Refresh wishlist state when items are added/removed
    await loadWishlists();
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
