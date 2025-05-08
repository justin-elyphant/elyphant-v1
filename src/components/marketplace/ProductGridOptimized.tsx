
import React from "react";
import ProductGrid from "./product-grid/ProductGrid";

// Re-export with the same interface for backward compatibility
const ProductGridOptimized = (props) => {
  return <ProductGrid {...props} />;
};

export default React.memo(ProductGridOptimized);
