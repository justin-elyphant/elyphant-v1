
import React from "react";
import { Product } from "@/contexts/ProductContext";
import StandardProductGrid from "./components/StandardProductGrid";
import GroupedProductSection from "./components/GroupedProductSection";
import { useProductDisplay } from "./hooks/useProductDisplay";
import { formatPrice } from "@/lib/utils";

interface ProductGridProps {
  products: Product[];
  sortOption?: string;
  viewMode?: "grid" | "list" | "modern";
  renderProductCard?: (product: Product) => React.ReactNode;
  showGroupedSections?: boolean;
  onProductView?: (productId: string) => void;
  sectionTitles?: { wishlist?: string; preferences?: string; regular?: string };
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  sortOption = "default",
  viewMode = "grid",
  renderProductCard,
  showGroupedSections = true,
  onProductView,
  sectionTitles
}) => {
  const { sortedProducts, groupedProducts } = useProductDisplay(products, sortOption);
  
  // Default product card renderer if none provided
  const defaultRenderProductCard = (product: Product) => (
    <div key={product.id || product.product_id} className="bg-white p-4 rounded-lg shadow">
      <div>{product.title || product.name}</div>
      <div>{formatPrice(product.price)}</div>
    </div>
  );
  
  const productCardRenderer = renderProductCard || defaultRenderProductCard;

  // Use grouped sections if enabled and we have grouping data
  if (showGroupedSections && groupedProducts.hasGrouping) {
    return (
      <GroupedProductSection
        groupedProducts={groupedProducts}
        viewMode={viewMode}
        renderProductCard={productCardRenderer}
        onProductView={onProductView}
        sectionTitles={sectionTitles}
      />
    );
  }

  // Otherwise use standard grid with all sorted products
  return (
    <StandardProductGrid
      products={sortedProducts}
      viewMode={viewMode}
      renderProductCard={productCardRenderer}
      onProductView={onProductView}
    />
  );
};

export default ProductGrid;
