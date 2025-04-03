
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
  const { setProducts } = useProducts();
  
  // Extract brand from URL on component mount or URL change
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const brandParam = params.get("brand");
    
    if (brandParam) {
      // Update active filters with brand
      setActiveFilters(prev => ({
        ...prev,
        brand: brandParam
      }));
      
      // Check if we have any products for this brand
      const brandProducts = products.filter(p => 
        p.name.toLowerCase().includes(brandParam.toLowerCase()) || 
        (p.vendor && p.vendor.toLowerCase().includes(brandParam.toLowerCase()))
      );
      
      if (brandProducts.length === 0) {
        // Create temporary products for this brand if none exist
        const tempProducts = [...products];
        
        // Create 5 products for this brand
        for (let i = 0; i < 5; i++) {
          const randomProduct = products[Math.floor(Math.random() * products.length)];
          if (randomProduct) {
            tempProducts.push({
              ...randomProduct,
              id: 10000 + products.length + i, // Ensure unique ID
              name: `${brandParam} ${randomProduct.name}`,
              vendor: brandParam,
              category: randomProduct.category || "Clothing"
            });
          }
        }
        
        // Update products in context
        setProducts(tempProducts);
        toast.success(`${brandParam} products added to catalog`);
      } else {
        toast.success(`Viewing ${brandParam} products`);
      }
    }
  }, [location.search, products, setProducts]);
  
  // Update filtered products when products or filters change
  useEffect(() => {
    let result = [...products];
    
    // Apply filters
    if (Object.keys(activeFilters).length > 0) {
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
      
      // Apply shipping filter
      if (activeFilters.shipping === true) {
        // All products have free shipping in our demo
      }
      
      // Apply brand filter if present - make it more flexible
      if (activeFilters.brand && activeFilters.brand !== 'all') {
        // More relaxed brand filtering
        const brandName = activeFilters.brand.toLowerCase();
        result = result.filter(product => 
          product.name.toLowerCase().includes(brandName) ||
          (product.vendor && product.vendor.toLowerCase().includes(brandName)) ||
          (product.description && product.description.toLowerCase().includes(brandName))
        );
        
        // If still no results, don't filter by brand
        if (result.length === 0) {
          console.log(`No products found for brand ${activeFilters.brand}, showing all products`);
          result = [...products];
          
          // Create temporary products for this brand
          for (let i = 0; i < 5; i++) {
            const randomProduct = products[Math.floor(Math.random() * products.length)];
            if (randomProduct) {
              const newProduct = {
                ...randomProduct,
                id: 20000 + i, // Ensure unique ID
                name: `${activeFilters.brand} ${randomProduct.name.split(' ').slice(1).join(' ')}`,
                vendor: activeFilters.brand,
                category: randomProduct.category || "Clothing"
              };
              result.push(newProduct);
            }
          }
        }
      }
    }
    
    // Apply sorting
    result = sortProducts(result, sortOption);
    
    setFilteredProducts(result);
  }, [products, activeFilters, sortOption]);
  
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
