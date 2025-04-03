
import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useProducts } from "@/contexts/ProductContext";
import { categories } from "@/components/home/components/CategoriesDropdown";
import MarketplaceFilters from "@/components/marketplace/MarketplaceFilters";
import FiltersSidebar from "@/components/marketplace/FiltersSidebar";
import ProductGrid from "@/components/marketplace/ProductGrid";
import { searchProducts } from "@/components/marketplace/zinc/zincService";
import { toast } from "@/hooks/use-toast";

const Marketplace = () => {
  const location = useLocation();
  const { products, setProducts } = useProducts();
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const toastShownRef = useRef(false);

  // Reset toast shown flag when component unmounts or after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      toastShownRef.current = false;
    }, 3000);
    
    return () => {
      clearTimeout(timer);
      toastShownRef.current = false;
    };
  }, [location.search]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryParam = params.get("category");
    const searchParam = params.get("search");
    
    setCurrentCategory(categoryParam);
    
    // If there's a search term in the URL, search for products using Zinc API
    if (searchParam) {
      const searchZincProducts = async () => {
        setIsLoading(true);
        try {
          const results = await searchProducts(searchParam);
          
          if (results.length > 0) {
            // Convert to Product format
            const amazonProducts = results.map((product, index) => ({
              id: 1000 + index,
              name: product.title,
              price: product.price,
              category: product.category || "Electronics",
              image: product.image || "/placeholder.svg",
              vendor: "Amazon via Zinc",
              description: product.description || ""
            }));
            
            // Update products in context
            setProducts(prevProducts => {
              // Filter out any existing Amazon products
              const nonAmazonProducts = prevProducts.filter(p => p.vendor !== "Amazon via Zinc");
              // Add the new Amazon products
              return [...nonAmazonProducts, ...amazonProducts];
            });
            
            // Set filtered products to include amazonProducts and any matching store products
            const storeProducts = products.filter(product => 
              product.vendor !== "Amazon via Zinc" && 
              (product.name.toLowerCase().includes(searchParam.toLowerCase()) || 
              (product.description && product.description.toLowerCase().includes(searchParam.toLowerCase())))
            );
            
            setFilteredProducts([...amazonProducts, ...storeProducts]);
            
            // Show only ONE toast notification with a summary
            if (!toastShownRef.current) {
              toastShownRef.current = true;
              toast({
                title: "Search Complete",
                description: `Found ${amazonProducts.length} products matching "${searchParam}"`,
                id: "search-complete" // Use consistent ID
              });
            }
          } else {
            // If no Amazon products, just filter store products
            const storeProducts = products.filter(product => 
              product.name.toLowerCase().includes(searchParam.toLowerCase()) || 
              (product.description && product.description.toLowerCase().includes(searchParam.toLowerCase()))
            );
            
            setFilteredProducts(storeProducts);
            
            // Only show toast if we have no results at all and haven't shown one yet
            if (storeProducts.length === 0 && !toastShownRef.current) {
              toastShownRef.current = true;
              toast({
                title: "No Results Found",
                description: `No products found for "${searchParam}"`,
                variant: "destructive",
                id: "no-results-found" // Use consistent ID
              });
            }
          }
        } catch (error) {
          console.error("Error searching for products:", error);
          
          // Only show error toast once
          if (!toastShownRef.current) {
            toastShownRef.current = true;
            toast({
              title: "Search Error",
              description: "Error searching for Amazon products",
              variant: "destructive",
              id: "search-error" // Use consistent ID
            });
          }
          
          // Fall back to local product search
          const filteredStoreProducts = products.filter(product => 
            product.name.toLowerCase().includes(searchParam.toLowerCase()) || 
            (product.description && product.description.toLowerCase().includes(searchParam.toLowerCase()))
          );
          
          setFilteredProducts(filteredStoreProducts);
        } finally {
          setIsLoading(false);
        }
      };
      
      searchZincProducts();
    } else if (categoryParam) {
      // Filter by category if no search term
      const filtered = products.filter(product => product.category === categoryParam);
      setFilteredProducts(filtered.length ? filtered : products);
    } else {
      // No search term or category, show all products
      setFilteredProducts(products);
    }
  }, [location.search, products, setProducts]);

  const params = new URLSearchParams(location.search);
  const searchParam = params.get("search");
  const categoryName = categories.find(c => c.url === currentCategory)?.name || "All Products";
  const pageTitle = searchParam ? `Search results for "${searchParam}"` : categoryName;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{pageTitle}</h1>
        <p className="text-muted-foreground">
          {searchParam 
            ? `Found ${filteredProducts.length} items matching your search`
            : `Browse our collection of ${currentCategory ? categoryName.toLowerCase() : "products"} from trusted vendors`
          }
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
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <p className="text-muted-foreground">Searching products...</p>
            </div>
          ) : (
            <ProductGrid 
              products={filteredProducts} 
              viewMode={viewMode} 
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
