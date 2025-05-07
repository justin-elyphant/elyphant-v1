
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import MarketplaceFilters from "./MarketplaceFilters";
import ProductGridOptimized from "./ProductGridOptimized";
import FeaturedProducts from "./FeaturedProducts";
import FiltersSidebar from "./FiltersSidebar";
import { sortProducts } from "./hooks/utils/category/productSorting";
import { Product } from "@/contexts/ProductContext";
import { Spinner } from '@/components/ui/spinner';

interface MarketplaceContentProps {
  products: Product[];
  isLoading: boolean;
  searchTerm?: string;
}

const MarketplaceContent = ({ products, isLoading, searchTerm = "" }: MarketplaceContentProps) => {
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list" | "modern">("modern");
  const [sortOption, setSortOption] = useState("relevance");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [searchParams] = useSearchParams();
  
  // Ensure we update filtered products when products change or loading finishes
  useEffect(() => {
    // Only process products if we have them and they're not empty
    if (products && products.length > 0) {
      console.log(`MarketplaceContent: Processing ${products.length} products with sort option ${sortOption}`);
      setFilteredProducts(sortProducts(products, sortOption));
    } else {
      setFilteredProducts([]);
    }
  }, [products, sortOption]);
  
  useEffect(() => {
    const brandParam = searchParams.get("brand");
    
    if (brandParam) {
      setActiveFilters(prev => ({
        ...prev,
        brand: brandParam
      }));
    }
  }, [searchParams]);
  
  // Apply filters when they change
  useEffect(() => {
    if (!products || products.length === 0) {
      return;
    }
    
    let result = [...products];
    result = sortProducts(result, sortOption);
    setFilteredProducts(result);
  }, [products, activeFilters, sortOption, searchTerm]);
  
  const handleFilterChange = (filters: Record<string, any>) => {
    setActiveFilters(filters);
  };
  
  const handleSortChange = (option: string) => {
    setSortOption(option);
  };

  // Rendering logic that properly handles loading states
  return (
    <div className="space-y-8">
      <MarketplaceFilters 
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        viewMode={viewMode}
        setViewMode={setViewMode}
        totalItems={filteredProducts.length}
        sortOption={sortOption}
        onSortChange={handleSortChange}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {showFilters && (
          <div className="md:col-span-1">
            <FiltersSidebar onFilterChange={handleFilterChange} activeFilters={activeFilters} />
          </div>
        )}
        
        <div className={showFilters ? "md:col-span-3" : "md:col-span-4"}>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Spinner className="h-10 w-10 text-purple-600" />
              <span className="ml-3 text-muted-foreground">Loading products...</span>
            </div>
          ) : filteredProducts && filteredProducts.length > 0 ? (
            <ProductGridOptimized 
              products={filteredProducts} 
              viewMode={viewMode}
              sortOption={sortOption}
              isLoading={false} // We're handling the loading state here, so pass false to the grid
            />
          ) : (
            <div className="text-center py-12 border rounded-md bg-white">
              <p className="text-lg font-medium">No products found</p>
              <p className="text-muted-foreground">Try adjusting your filters or search terms</p>
            </div>
          )}
        </div>
      </div>
      
      {filteredProducts && filteredProducts.length > 0 && !isLoading && (
        <FeaturedProducts />
      )}
    </div>
  );
};

export default MarketplaceContent;
