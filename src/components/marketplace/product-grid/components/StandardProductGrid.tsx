
import React from "react";
import { Product } from "@/contexts/ProductContext";

interface StandardProductGridProps {
  products: Product[];
  viewMode: "grid" | "list" | "modern";
  renderProductCard: (product: Product) => React.ReactNode;
}

const StandardProductGrid: React.FC<StandardProductGridProps> = ({
  products,
  viewMode,
  renderProductCard
}) => {
  const getGridClassNames = () => {
    return viewMode === 'modern' 
      ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6' 
      : viewMode === 'grid' 
        ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6' 
        : 'space-y-4';
  };

  return (
    <div className={getGridClassNames()}>
      {products.map(renderProductCard)}
    </div>
  );
};

export default StandardProductGrid;
