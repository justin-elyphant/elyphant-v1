
import React, { useState, useEffect } from "react";
import { Product } from "@/contexts/ProductContext";
import MarketplaceLoading from "./MarketplaceLoading";
import MarketplaceFilters from "./MarketplaceFilters";
import ProductGrid from "./ProductGrid";
import FeaturedProducts from "./FeaturedProducts";
import FiltersSidebar from "./FiltersSidebar";
import { sortProducts } from "./hooks/utils/categoryUtils";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useProducts } from "@/contexts/ProductContext";
import { handleBrandProducts } from "@/utils/brandUtils";

interface MarketplaceContentProps {
  products: Product[];
  isLoading: boolean;
}

const MarketplaceContent = ({ products, isLoading }: MarketplaceContentProps) => {
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortOption, setSortOption] = useState("relevance");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const location = useLocation();
  const { setProducts: setContextProducts } = useProducts();
  
  // Log initial state for debugging
  useEffect(() => {
    console.log(`MarketplaceContent mounted: ${products.length} products, isLoading: ${isLoading}`);
  }, []);
  
  // Extract brand from URL on component mount or URL change
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const brandParam = params.get("brand");
    
    if (brandParam) {
      console.log(`URL contains brand parameter: ${brandParam}, products available: ${products.length}, isLoading: ${isLoading}`);
      
      // Update active filters with brand
      setActiveFilters(prev => ({
        ...prev,
        brand: brandParam
      }));
      
      // Only attempt to filter if we have products
      if (products.length > 0) {
        const brandProducts = handleBrandProducts(brandParam, products, setContextProducts);
        
        // If we have brand products, set them as filtered products
        if (brandProducts && brandProducts.length > 0) {
          console.log(`Setting ${brandProducts.length} brand products as filtered products`);
          setFilteredProducts(sortProducts(brandProducts, sortOption));
        }
      } else {
        console.log("Waiting for products to load before filtering by brand");
      }
    }
  }, [location.search, products, setContextProducts, sortOption]);
  
  // Update filtered products when products or filters change
  useEffect(() => {
    console.log(`Updating filtered products: ${products.length} products available, ${Object.keys(activeFilters).length} active filters`);
    
    if (products.length === 0) {
      console.log("No products available to filter");
      return;
    }
    
    if (Object.keys(activeFilters).length === 0) {
      // No filters, show all products
      setFilteredProducts(sortProducts(products, sortOption));
      return;
    }

    let result = [...products];
    
    // Apply filters
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
    
    // Apply shipping filter
    if (activeFilters.shipping === true) {
      // All products have free shipping in our demo
    }
    
    // Apply brand filter if present - make it case-insensitive and more flexible
    if (activeFilters.brand && activeFilters.brand !== 'all') {
      const brandName = activeFilters.brand.toLowerCase();
      
      // Use more relaxed brand filtering
      result = result.filter(product => 
        (product.name && product.name.toLowerCase().includes(brandName)) ||
        (product.vendor && product.vendor.toLowerCase().includes(brandName)) ||
        (product.description && product.description.toLowerCase().includes(brandName))
      );
      
      // If still no results after filtering, create temporary brand products
      if (result.length === 0) {
        console.log(`No filtered products found for brand ${activeFilters.brand}`);
        const brandProducts = handleBrandProducts(activeFilters.brand, products, setContextProducts);
        if (brandProducts.length > 0) {
          result = brandProducts;
        }
      }
    }
    
    // Apply sorting
    result = sortProducts(result, sortOption);
    console.log(`Filter result: ${result.length} products after filtering`);
    
    setFilteredProducts(result);
  }, [products, activeFilters, sortOption, setContextProducts]);
  
  const handleFilterChange = (filters: Record<string, any>) => {
    setActiveFilters(filters);
  };
  
  const handleSortChange = (option: string) => {
    setSortOption(option);
  };

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
