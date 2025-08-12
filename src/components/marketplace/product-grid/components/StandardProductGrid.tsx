
import React from "react";
import { Product } from "@/contexts/ProductContext";
import { useIsMobile } from "@/hooks/use-mobile";

interface StandardProductGridProps {
  products: Product[];
  viewMode: "grid" | "list" | "modern";
  renderProductCard: (product: Product) => React.ReactNode;
  onProductView?: (productId: string) => void;
}

const StandardProductGrid: React.FC<StandardProductGridProps> = ({
  products,
  viewMode,
  renderProductCard,
  onProductView
}) => {
  // Use mobile detection hook to apply mobile-specific styling
  const isMobile = useIsMobile();
  
  // Optional click handler to track product views
  const handleProductClick = (productId: string) => {
    if (onProductView) {
      onProductView(productId);
    }
  };

  return (
    <div
      className={`${
        viewMode === "grid"
          ? isMobile
            ? "grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4 items-stretch" // Mobile-optimized grid
            : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-stretch" // Keep desktop layout
          : "space-y-4"
      }`}
    >
      {products.map((product) => {
        const productId = product.product_id || product.id;
        if (!productId) {
          console.warn("Product missing ID:", product);
          return null;
        }
        
        // If onProductView exists, wrap the product card in a div with onClick handler
        if (onProductView) {
          return (
            <div 
              key={productId} 
              onClick={() => handleProductClick(productId)}
              className="cursor-pointer"
            >
              {renderProductCard(product)}
            </div>
          );
        }
        
        // Otherwise just render the product card
        return (
          <div key={productId}>
            {renderProductCard(product)}
          </div>
        );
      })}
    </div>
  );
};

export default StandardProductGrid;
