
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useZincProductSearch } from "./hooks/useZincProductSearch";
import { ZincSearchForm } from "./components/ZincSearchForm";
import { ZincProductResults } from "./components/ZincProductResults";
import { enhancedZincApiService } from "@/services/enhancedZincApiService";
import { useProducts } from "@/contexts/ProductContext";
import { normalizeProduct } from "@/contexts/ProductContext";
import { toast } from "sonner";

const ZincProductsTab = () => {
  const location = useLocation();
  const { products, setProducts } = useProducts();
  const [isLoading, setIsLoading] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Get search term from URL parameters
  const searchParams = new URLSearchParams(location.search);
  const urlSearchTerm = searchParams.get("search") || "";
  
  // Update local search term when URL changes
  useEffect(() => {
    if (urlSearchTerm && urlSearchTerm !== localSearchTerm) {
      setLocalSearchTerm(urlSearchTerm);
      handleSearch(urlSearchTerm);
    }
  }, [urlSearchTerm]);
  
  const marketplaceProducts = products.filter(p => p.vendor === "Amazon via Zinc");
  
  const handleSearch = async (term: string) => {
    if (!term.trim() || isLoading) return;
    
    setIsLoading(true);
    setSearchTerm(term);
    console.log(`ZincProductsTab: Searching for "${term}" via Enhanced Zinc API`);
    
    try {
      // Use Enhanced Zinc API System
      const response = await enhancedZincApiService.searchProducts(term, 1, 20);
      
      if (response.error && !response.cached) {
        throw new Error(response.error);
      }
      
      if (response.results && response.results.length > 0) {
        // Convert Enhanced Zinc API results to Product format
        const formattedProducts = response.results.map((product: any, index: number) => {
          // Fix the properties to match Product type
          return normalizeProduct({
            product_id: product.product_id || `zinc-${Date.now()}-${index}`,
            id: product.product_id || `zinc-${Date.now()}-${index}`,
            name: product.title,
            title: product.title,
            price: (product.price || 0) / 100, // Convert cents to dollars
            category: product.category || "General",
            image: product.image || product.main_image || "/placeholder.svg",
            vendor: "Amazon via Zinc",
            description: product.description || product.product_description || "",
            rating: product.rating || product.stars || 0,
            reviewCount: product.review_count || product.num_reviews || 0,
            isBestSeller: product.isBestSeller || false
            // Remove badgeText since it's causing TypeScript errors
          });
        });
        
        // Update products context - replace existing Zinc products
        setProducts(prevProducts => {
          const nonZincProducts = prevProducts.filter(p => p.vendor !== "Amazon via Zinc");
          return [...nonZincProducts, ...formattedProducts];
        });
        
        const cacheStatus = response.cached ? " (cached)" : "";
        toast.success("Search Complete", {
          description: `Found ${formattedProducts.length} products${cacheStatus}`
        });
        
        console.log(`Enhanced Zinc API: Found ${formattedProducts.length} products for "${term}"`);
      } else {
        toast.info("No Results", {
          description: `No products found for "${term}"`
        });
      }
    } catch (error) {
      console.error("Enhanced Zinc API search error:", error);
      toast.error("Search Error", {
        description: "Failed to search products. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearchTerm.trim()) {
      await handleSearch(localSearchTerm);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const syncProducts = async () => {
    setIsLoading(true);
    try {
      // Clear cache and show sync message
      enhancedZincApiService.clearCache();
      toast.success("Products Synced", {
        description: "Product cache cleared and ready for fresh searches."
      });
    } catch (error) {
      toast.error("Sync Failed", {
        description: "There was an error syncing products."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 py-4">
      <ZincSearchForm
        searchTerm={localSearchTerm}
        setSearchTerm={setLocalSearchTerm}
        handleSubmit={handleSubmit}
        handleKeyDown={handleKeyDown}
        syncProducts={syncProducts}
        isLoading={isLoading}
      />
      
      {searchTerm && (
        <p className="text-sm text-muted-foreground">
          Showing results for: "{searchTerm}"
        </p>
      )}
      
      <ZincProductResults
        products={marketplaceProducts as any[]}
        isLoading={isLoading}
        searchTerm={searchTerm}
      />
    </div>
  );
};

export default ZincProductsTab;
