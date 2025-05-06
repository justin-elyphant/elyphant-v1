
import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import MarketplaceFilters from "./MarketplaceFilters";
import ProductGridOptimized from "./ProductGridOptimized";
import FeaturedProducts from "./FeaturedProducts";
import FiltersSidebar from "./FiltersSidebar";
import { sortProducts } from "./hooks/utils/categoryUtils";
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
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Memoize filtered and sorted products to prevent unnecessary recalculations
  const processedProducts = useMemo(() => {
    if (products.length === 0 || isLoading) {
      return [];
    }
    
    // Apply active filters
    let result = [...products];
    
    // Brand filter
    const brandParam = activeFilters.brand || searchParams.get("brand");
    if (brandParam) {
      result = result.filter(p => 
        (p.brand && p.brand.toLowerCase().includes(brandParam.toLowerCase())) ||
        (p.vendor && p.vendor.toLowerCase().includes(brandParam.toLowerCase()))
      );
    }
    
    // Sort the results
    return sortProducts(result, sortOption);
  }, [products, activeFilters, sortOption, searchParams]);
  
  // Update filteredProducts when processedProducts changes
  useEffect(() => {
    setFilteredProducts(processedProducts);
    
    // After initial data is loaded and processed, mark initial load as complete
    if (processedProducts.length > 0 && isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [processedProducts, isInitialLoad]);
  
  // Handle brand parameter from URL
  useEffect(() => {
    const brandParam = searchParams.get("brand");
    
    if (brandParam) {
      setActiveFilters(prev => ({
        ...prev,
        brand: brandParam
      }));
    }
  }, [searchParams]);
  
  const handleFilterChange = (filters: Record<string, any>) => {
    setActiveFilters(filters);
  };
  
  const handleSortChange = (option: string) => {
    setSortOption(option);
  };

  // Show loading only on initial load, not on subsequent filter/sort changes
  const showLoading = isLoading && isInitialLoad;

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
          {
            showLoading ? (
              <div className="flex justify-center items-center py-12">
                <Spinner className="h-10 w-10 text-purple-600" />
                <span className="ml-3 text-muted-foreground">Loading products...</span>
              </div>
            ) : 
            filteredProducts.length > 0 ? (
              <ProductGridOptimized 
                products={filteredProducts} 
                viewMode={viewMode}
                sortOption={sortOption}
                isLoading={false} // Always pass false here to prevent flickering
              />
            ) : (
              <div className="text-center py-12 border rounded-md bg-white">
                <p className="text-lg font-medium">No products found</p>
                <p className="text-muted-foreground">Try adjusting your filters or search terms</p>
              </div>
            )
          }
        </div>
      </div>
      
      {filteredProducts.length > 0 && !showLoading && (
        <FeaturedProducts />
      )}
    </div>
  );
};

export default MarketplaceContent;
