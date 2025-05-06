import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import MarketplaceFilters from "./MarketplaceFilters";
import ProductGrid from "./ProductGrid";
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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortOption, setSortOption] = useState("relevance");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    if (products.length > 0) {
      setFilteredProducts(sortProducts(products, sortOption));
      // setFilteredProducts(products);
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
  
  useEffect(() => {
    if (products.length === 0 && !isLoading) {
      return;
    }
    let result = [...products];
    
    result = sortProducts(result, sortOption);
    
    setFilteredProducts(result);
  }, [products, activeFilters, sortOption, isLoading, searchTerm]);
  
  const handleFilterChange = (filters: Record<string, any>) => {
    setActiveFilters(filters);
  };
  
  const handleSortChange = (option: string) => {
    setSortOption(option);
  };

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
            isLoading ? (
              <div>
                <Spinner />
              </div>
          ) : 
            filteredProducts.length > 0 ? (
              <ProductGrid 
                products={filteredProducts} 
                viewMode={viewMode}
                sortOption={sortOption}
              />
            ) : (
              <div className="text-center py-12 border rounded-md">
                <p className="text-lg font-medium">No products found</p>
                <p className="text-muted-foreground">Try adjusting your filters or search terms</p>
              </div>
            )
          }
        </div>
      </div>
      
      {filteredProducts.length > 0 && (
        <FeaturedProducts />
      )}
    </div>
  );
};

export default MarketplaceContent;
