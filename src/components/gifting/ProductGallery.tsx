
import React, { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types/product";

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
  
  useEffect(() => {
    console.log("ProductGallery render:", { 
      isLoading, 
      filteredProductsLength: filteredProducts?.length || 0,
      initialProductsLength: initialProducts?.length || 0,
      searchTerm,
      selectedCategory,
      priceRange
    });
  }, [isLoading, filteredProducts, initialProducts, searchTerm, selectedCategory, priceRange]);
  
  if (isLoading) {
    return <ProductLoading />;
  }
  
  // Debugging check for filteredProducts
  if (!filteredProducts) {
    console.error("filteredProducts is undefined or null");
    return <div>Error loading products. Please try refreshing the page.</div>;
  }
  
  // Special case: if we have search/category but no products, show a message
  const hasActiveFilters = searchTerm !== "" || selectedCategory !== "all" || priceRange !== "all";
  
  if (filteredProducts.length === 0 && !hasActiveFilters) {
    return <ProductEmpty />;
  }
  
  // Check if we have any Shopify products
  const hasShopifyProducts = filteredProducts.some(product => product.vendor === "Shopify");
  
  return (
    <div className="space-y-4">
      {hasShopifyProducts && (
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
      
      {filteredProducts.length > 0 ? (
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
      ) : (
        <ProductNoResults clearFilters={clearFilters} />
      )}
    </div>
  );
};

export default ProductGallery;
