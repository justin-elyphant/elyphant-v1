
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "@/components/home/Header";
import { useProducts } from "@/contexts/ProductContext";
import { categories } from "@/components/home/components/CategoriesDropdown";
import MarketplaceFilters from "@/components/marketplace/MarketplaceFilters";
import FiltersSidebar from "@/components/marketplace/FiltersSidebar";
import ProductGrid from "@/components/marketplace/ProductGrid";
import VendorPortalCard from "@/components/marketplace/VendorPortalCard";

const Marketplace = () => {
  const location = useLocation();
  const { products } = useProducts();
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryParam = params.get("category");
    setCurrentCategory(categoryParam);
    
    if (categoryParam) {
      const filtered = products.filter(product => 
        product.category === categoryParam
      );
      setFilteredProducts(filtered.length ? filtered : products);
    } else {
      setFilteredProducts(products);
    }
  }, [location.search, products]);

  const categoryName = categories.find(c => c.url === currentCategory)?.name || "All Products";

  return (
    <div>
      <Header />
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{categoryName}</h1>
          <p className="text-muted-foreground">
            Browse our collection of {currentCategory ? categoryName.toLowerCase() : "products"} from trusted vendors
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6">
          {showFilters && (
            <div className="w-full md:w-1/4 space-y-6">
              <FiltersSidebar />
            </div>
          )}
          
          <div className={`w-full ${showFilters ? 'md:w-3/4' : 'w-full'}`}>
            <MarketplaceFilters 
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              viewMode={viewMode}
              setViewMode={setViewMode}
              totalItems={filteredProducts.length}
            />
            
            <ProductGrid 
              products={filteredProducts} 
              viewMode={viewMode} 
            />
          </div>
        </div>
        
        <div className="mt-12">
          <VendorPortalCard />
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
