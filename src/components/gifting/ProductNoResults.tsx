
import React from "react";
import { Button } from "@/components/ui/button";

interface ProductNoResultsProps {
  clearFilters: () => void;
}

const ProductNoResults: React.FC<ProductNoResultsProps> = ({ clearFilters }) => {
  return (
    <div className="text-center py-8">
      <p className="text-muted-foreground">No products match your search criteria.</p>
      <Button variant="link" onClick={clearFilters}>Clear all filters</Button>
    </div>
  );
};

export default ProductNoResults;
