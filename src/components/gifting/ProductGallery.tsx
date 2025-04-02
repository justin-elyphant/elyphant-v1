
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/contexts/ProductContext";
import { toast } from "sonner";

import ProductCard from "./ProductCard";
import ProductFilters from "./ProductFilters";
import ProductLoading from "./ProductLoading";
import ProductEmpty from "./ProductEmpty";
import ProductNoResults from "./ProductNoResults";
import { useProductManagement } from "./useProductManagement";

interface ProductGalleryProps {
  initialProducts?: Product[];
  isGifteeView?: boolean; // Determines if this is for the giftee or giftor track
  onProductSelect?: (product: Product) => void;
}

const ProductGallery = ({ 
  initialProducts = [], 
  isGifteeView = true,
  onProductSelect 
}: ProductGalleryProps) => {
  const {
    isLoading,
    filteredProducts,
    categories,
    searchTerm,
    setSearchTerm,
    priceRange,
    setPriceRange,
    selectedCategory,
    setSelectedCategory,
    filtersVisible,
    setFiltersVisible,
    wishlistedProducts,
    handleWishlistToggle,
    clearFilters
  } = useProductManagement(initialProducts);
  
  if (isLoading) {
    return <ProductLoading />;
  }
  
  if (filteredProducts.length === 0 && searchTerm === "" && selectedCategory === "all" && priceRange === "all") {
    return <ProductEmpty />;
  }
  
  return (
    <div className="space-y-4">
      {filteredProducts.length > 0 && filteredProducts[0].vendor === "Shopify" && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm flex items-center">
          <Badge className="bg-green-500 mr-2">Shopify</Badge>
          <span>Showing products from your connected Shopify store</span>
        </div>
      )}
      
      <ProductFilters
        searchTerm={searchTerm}
        selectedCategory={selectedCategory}
        priceRange={priceRange}
        filtersVisible={filtersVisible}
        categories={categories}
        setSearchTerm={setSearchTerm}
        setSelectedCategory={setSelectedCategory}
        setPriceRange={setPriceRange}
        setFiltersVisible={setFiltersVisible}
        clearFilters={clearFilters}
      />
      
      <div className="text-sm text-muted-foreground">
        {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isWishlisted={wishlistedProducts.includes(product.id)}
            isGifteeView={isGifteeView}
            onToggleWishlist={handleWishlistToggle}
            onClick={() => onProductSelect && onProductSelect(product)}
          />
        ))}
      </div>
      
      {filteredProducts.length === 0 && (
        <ProductNoResults clearFilters={clearFilters} />
      )}
    </div>
  );
};

export default ProductGallery;
