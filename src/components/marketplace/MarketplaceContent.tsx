
import React, { useState, useEffect } from "react";
import { Product } from "@/contexts/ProductContext";
import MarketplaceLoading from "./MarketplaceLoading";
import MarketplaceFilters from "./MarketplaceFilters";
import ProductGrid from "./ProductGrid";
import FeaturedProducts from "./FeaturedProducts";
import FiltersSidebar from "./FiltersSidebar";
import { sortProducts } from "./hooks/utils/categoryUtils";
import { useLocation, useSearchParams } from "react-router-dom";
import { useProducts } from "@/contexts/ProductContext";

interface MarketplaceContentProps {
  products: Product[];
  isLoading: boolean;
}

const MarketplaceContent = ({ products, isLoading }: MarketplaceContentProps) => {
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortOption, setSortOption] = useState("relevance");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [searchParams] = useSearchParams();
  const { products: contextProducts } = useProducts();
  
  // Log initial state for debugging
  useEffect(() => {
    console.log(`MarketplaceContent mounted: ${products.length} products, isLoading: ${isLoading}`);
  }, []);
  
  // Set filtered products when products change
  useEffect(() => {
    if (products.length > 0) {
      console.log(`Setting filtered products: ${products.length} products available`);
      setFilteredProducts(sortProducts(products, sortOption));
    }
  }, [products, sortOption]);
  
  // Extract brand from URL for UI feedback
  useEffect(() => {
    const brandParam = searchParams.get("brand");
    
    if (brandParam) {
      console.log(`MarketplaceContent: URL contains brand parameter: ${brandParam}, context products: ${contextProducts.length}`);
      
      // Update active filters with brand
      setActiveFilters(prev => ({
        ...prev,
        brand: brandParam
      }));
    }
  }, [searchParams, contextProducts]);
  
  // Process filtered products based on active filters
  useEffect(() => {
    if (products.length === 0 && !isLoading) {
      console.log("No products to filter");
      return;
    }

    console.log(`Applying filters: ${Object.keys(activeFilters).length} active filters`);
    let result = [...products];
    
    // Apply filters
    if (activeFilters.brand && activeFilters.brand !== 'all') {
      const brandName = activeFilters.brand.toLowerCase();
      console.log(`Filtering for brand: ${brandName}`);
      
      result = result.filter(product => 
        (product.name && product.name.toLowerCase().includes(brandName)) ||
        (product.vendor && product.vendor.toLowerCase().includes(brandName)) ||
        (product.description && product.description.toLowerCase().includes(brandName))
      );
      
      console.log(`Found ${result.length} products for brand ${activeFilters.brand}`);
    }
    
    // Apply price filter
    if (activeFilters.price && typeof activeFilters.price === 'object') {
      const { min, max } = activeFilters.price;
      result = result.filter(product => 
        product.price >= min && product.price <= max
      );
    }
    
    // Apply rating filter
    if (activeFilters.rating && activeFilters.rating !== 'all') {
      const minRating = parseInt(activeFilters.rating.replace('up', ''));
      result = result.filter(product => 
        (product.rating || 0) >= minRating
      );
    }
    
    // Apply sorting
    result = sortProducts(result, sortOption);
    console.log(`Filter result: ${result.length} products after filtering`);
    
    setFilteredProducts(result);
  }, [products, activeFilters, sortOption, isLoading]);
  
  const handleFilterChange = (filters: Record<string, any>) => {
    setActiveFilters(filters);
  };
  
  const handleSortChange = (option: string) => {
    setSortOption(option);
  };

  // Show loading state if we're loading products
  if (isLoading) {
    return <MarketplaceLoading />;
  }

  return (
    <div className="space-y-6">
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
          {filteredProducts.length > 0 ? (
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
          )}
        </div>
      </div>
      
      {/* Show featured products if we have search results */}
      {filteredProducts.length > 0 && (
        <FeaturedProducts />
      )}
    </div>
  );
};

export default MarketplaceContent;
