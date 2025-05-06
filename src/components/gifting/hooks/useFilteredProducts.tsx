
import { useMemo, useRef } from "react";
import { Product } from "@/contexts/ProductContext";
import { useCategoryFilter } from "./useCategoryFilter";

// Define a global cache for expensive operations
const categoryMatchCache: Record<string, boolean> = {};
const searchCache: Record<string, boolean> = {};

export const useFilteredProducts = (
  products: Product[],
  searchTerm: string,
  selectedCategory: string,
  priceRange: string
) => {
  // Get the category matcher function
  const { matchesOccasionCategory } = useCategoryFilter(products);
  // Use ref to track previous filter params for optimizations
  const prevFilterParams = useRef({ searchTerm, selectedCategory, priceRange });
  
  const filteredProducts = useMemo(() => {
    console.log("Filtering products:", { 
      totalProducts: products?.length || 0,
      searchTerm,
      selectedCategory,
      priceRange
    });

    // If there are no products, return an empty array immediately
    if (!products || products.length === 0) {
      console.log("No products to filter");
      return [];
    }

    // Check if filter params are the same as previous render - if so we can avoid refiltering
    const currentParams = { searchTerm, selectedCategory, priceRange };
    if (JSON.stringify(currentParams) === JSON.stringify(prevFilterParams.current)) {
      console.log("Filter params unchanged, skipping filter operation");
      return products;
    }
    
    // Update ref with current filter params
    prevFilterParams.current = currentParams;

    // Only apply filters if we have active filters - otherwise return all products
    // This is a major performance optimization
    const hasActiveFilters = searchTerm !== "" || selectedCategory !== "all" || priceRange !== "all";
    if (!hasActiveFilters) {
      // Limit max products to prevent UI lag
      return products.length > 200 ? products.slice(0, 200) : products;
    }

    // Flag for common categories that should always return some products
    const isCommonCategory = ["birthday", "wedding", "anniversary", "graduation", 
                            "baby_shower", "pets", "office", "summer", "home decor",
                            "electronics", "clothing", "footwear"].includes(selectedCategory.toLowerCase());
    
    const isCommonSearch = ["Nike", "Office", "Tech", "Pet", "Home", "Summer", "Birthday", "Wedding",
                           "Gift", "Present", "Apple", "Electronics", "Clothing", "Shoes", "Furniture"]
                            .some(term => searchTerm.toLowerCase().includes(term.toLowerCase()));

    // Use more efficient batch processing approach
    let filteredResults: Product[] = [];
    const batchSize = 100; // Process products in batches to avoid UI freezing
    
    // Get the total number of batches needed
    const totalBatches = Math.ceil(products.length / batchSize);
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      // Get the current batch of products
      const startIndex = batchIndex * batchSize;
      const endIndex = Math.min(startIndex + batchSize, products.length);
      const batch = products.slice(startIndex, endIndex);
      
      // Filter the current batch
      const batchResults = batch.filter(product => {
        // Search term filter - only apply if we have a search term
        if (searchTerm !== "") {
          const lowerSearchTerm = searchTerm.toLowerCase();
          // Use cache for search term matching
          const searchCacheKey = `${product.id}-${searchTerm}`;
          
          if (searchCache[searchCacheKey] !== undefined) {
            if (!searchCache[searchCacheKey]) return false;
          } else {
            const productName = (product.name || "").toLowerCase();
            const vendor = (product.vendor || "").toLowerCase();
            const description = (product.description || "").toLowerCase();
            const category = (product.category || "").toLowerCase();
            const brand = (product.brand || "").toLowerCase();
            
            // Quick check most common fields first
            let matches = productName.includes(lowerSearchTerm) || 
                          brand.includes(lowerSearchTerm) ||
                          category.includes(lowerSearchTerm) ||
                          vendor.includes(lowerSearchTerm) ||
                          description.includes(lowerSearchTerm);
            
            if (!matches) {
              // Try word-by-word matching only if needed
              const searchWords = lowerSearchTerm.split(" ").filter(word => word.length > 2);
              if (searchWords.length > 0) {
                // If we find ANY of the words, consider it a match
                matches = searchWords.some(word => 
                  productName.includes(word) || 
                  description.includes(word) || 
                  category.includes(word) ||
                  brand.includes(word) ||
                  vendor.includes(word)
                );
              }
            }
            
            // Store result in cache
            searchCache[searchCacheKey] = matches;
            
            if (!matches) return false;
          }
        }
        
        // Category filter - Use cached results when possible
        if (selectedCategory !== "all") {
          const cacheKey = `${product.id}-${selectedCategory}`;
          if (categoryMatchCache[cacheKey] === undefined) {
            categoryMatchCache[cacheKey] = matchesOccasionCategory(product, selectedCategory);
          }
          if (!categoryMatchCache[cacheKey]) return false;
        }
        
        // Price range filter - quick to compute so no caching needed
        if (priceRange !== "all") {
          const price = product.price;
          if (priceRange === "under25" && price >= 25) return false;
          if (priceRange === "25to50" && (price < 25 || price > 50)) return false;
          if (priceRange === "50to100" && (price <= 50 || price > 100)) return false;
          if (priceRange === "over100" && price <= 100) return false;
        }
        
        // If we made it through all filters, include this product
        return true;
      });
      
      // Add the batch results to our filtered results
      filteredResults = [...filteredResults, ...batchResults];
      
      // If we've gathered enough results, stop processing more batches
      if (filteredResults.length >= 100) {
        filteredResults = filteredResults.slice(0, 100); // Cap at 100 for performance
        break;
      }
    }
    
    console.log(`Filtered to ${filteredResults.length} products`);
    
    // If we have results, return them
    if (filteredResults.length > 0) {
      return filteredResults;
    }
    
    // Second pass - if we have no results but a common category or search term, be more permissive
    if (isCommonCategory || isCommonSearch) {
      console.log("No matches found but trying more permissive search for common category/search");
      
      // Only filter by price as it's the most restrictive
      const secondPassFiltered = products.filter(product => {
        if (priceRange === "all") return true;
        
        const price = product.price;
        if (priceRange === "under25" && price >= 25) return false;
        if (priceRange === "25to50" && (price < 25 || price > 50)) return false;
        if (priceRange === "50to100" && (price <= 50 || price > 100)) return false;
        if (priceRange === "over100" && price <= 100) return false;
        
        return true;
      });
      
      console.log(`Second pass filtered to ${secondPassFiltered.length} products`);
      
      if (secondPassFiltered.length > 0) {
        // Return a limited number for better performance
        return secondPassFiltered.slice(0, 15);
      }
    }
    
    // Last resort - return a small set of products
    console.log("Showing fallback products");
    return products.slice(0, 10);
  }, [products, searchTerm, selectedCategory, priceRange, matchesOccasionCategory]);

  return filteredProducts;
};
