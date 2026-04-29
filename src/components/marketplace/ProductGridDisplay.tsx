
import React from "react";
import { useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { Product } from "@/types/product";
import ProductCard from "./ProductCard";
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

const LoadMoreTile: React.FC<{ onClick: () => void; className?: string }> = ({ onClick, className }) => (
  <button
    type="button"
    onClick={onClick}
    className={`group flex flex-col items-center justify-center w-full h-full min-h-[280px] rounded-lg border-2 border-dashed border-border bg-muted/30 hover:bg-muted/60 hover:border-foreground/40 transition-colors text-center p-6 touch-target-44 ${className ?? ""}`}
    aria-label="Show more gifts"
  >
    <div className="w-12 h-12 rounded-full bg-foreground/5 group-hover:bg-foreground/10 flex items-center justify-center mb-3 transition-colors">
      <Plus className="h-6 w-6 text-foreground" />
    </div>
    <span className="text-sm font-semibold text-foreground">Show More Gifts</span>
    <span className="text-xs text-muted-foreground mt-1">Browse the full marketplace</span>
  </button>
);

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
  const [searchParams, setSearchParams] = useSearchParams();
  const isGiftsInAHurry = searchParams.get('category') === 'gifts-in-a-hurry';

  if (products.length === 0) {
    return (
      <div className="text-center py-12 safe-area-inset">
        <div className="max-w-sm mx-auto">
          <div className="w-24 h-24 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
            <div className="w-12 h-12 bg-muted rounded-lg"></div>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No products found</h3>
          <p className="text-muted-foreground leading-relaxed">Try adjusting your search or filters to find what you're looking for.</p>
        </div>
      </div>
    );
  }

  const handleWishlistUpdate = async () => {
    await loadWishlists();
  };

  const handleShowMore = () => {
    // Clear the category filter to show the full marketplace
    const next = new URLSearchParams(searchParams);
    next.delete('category');
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Mobile
  if (isMobile) {
    return (
      <div className="safe-area-inset ios-scroll" role="region" aria-label="Product grid">
        <div className="grid grid-cols-2 gap-3 p-4 items-stretch mobile-grid-optimized">
          {products.map((product, index) => {
            const productId = String(product.product_id || product.id);
            const statusBadge = getProductStatus(product);
            return (
              <div key={productId} className="flex" style={{ contentVisibility: index > 10 ? 'auto' : 'visible' }}>
                <ProductCard
                  product={product}
                  viewMode="grid"
                  onProductClick={() => handleProductClick(productId)}
                  onWishlistClick={handleWishlistUpdate}
                  statusBadge={statusBadge}
                />
              </div>
            );
          })}
          {isGiftsInAHurry && (
            <div className="flex">
              <LoadMoreTile onClick={handleShowMore} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop
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
            <ProductCard
              product={product}
              viewMode={viewMode}
              onProductClick={() => handleProductClick(productId)}
              onWishlistClick={handleWishlistUpdate}
              statusBadge={statusBadge}
            />
          </div>
        );
      })}
      {isGiftsInAHurry && viewMode !== "list" && (
        <div className="intersection-target">
          <LoadMoreTile onClick={handleShowMore} />
        </div>
      )}
    </div>
  );
};

export default ProductGridDisplay;
