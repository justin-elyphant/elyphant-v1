
import { useMemo } from "react";
import { Product } from "@/contexts/ProductContext";
import { useCategoryFilter } from "./useCategoryFilter";

// Define a cache for expensive category matching operations
const categoryMatchCache: Record<string, boolean> = {};

export const useFilteredProducts = (
  products: Product[],
  searchTerm: string,
  selectedCategory: string,
  priceRange: string
) => {
  // Get the category matcher function
  const { matchesOccasionCategory } = useCategoryFilter(products);

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

    // Only apply filters if we have active filters - otherwise return all products
    // This is a major performance optimization
    const hasActiveFilters = searchTerm !== "" || selectedCategory !== "all" || priceRange !== "all";
    if (!hasActiveFilters) {
      return products;
    }

    // Flag for common categories that should always return some products
    const isCommonCategory = ["birthday", "wedding", "anniversary", "graduation", 
                            "baby_shower", "pets", "office", "summer", "home decor",
                            "electronics", "clothing", "footwear"].includes(selectedCategory.toLowerCase());
    
    const isCommonSearch = ["Nike", "Office", "Tech", "Pet", "Home", "Summer", "Birthday", "Wedding",
                           "Gift", "Present", "Apple", "Electronics", "Clothing", "Shoes", "Furniture"]
                            .some(term => searchTerm.toLowerCase().includes(term.toLowerCase()));

    // First pass - try to filter according to criteria
    // Use a more efficient filtering approach
    const filtered = products.filter(product => {
      // Search term filter - only apply if we have a search term
      if (searchTerm !== "") {
        const lowerSearchTerm = searchTerm.toLowerCase();
        const productName = (product.name || "").toLowerCase();
        const vendor = (product.vendor || "").toLowerCase();
        const description = (product.description || "").toLowerCase();
        const category = (product.category || "").toLowerCase();
        const brand = (product.brand || "").toLowerCase();
        
        // Check most likely fields first for early returns
        if (productName.includes(lowerSearchTerm)) return true;
        if (brand.includes(lowerSearchTerm)) return true;
        if (category.includes(lowerSearchTerm)) return true;
        if (vendor.includes(lowerSearchTerm)) return true;
        if (description.includes(lowerSearchTerm)) return true;
        
        // If we've reached here, no simple match was found
        // Try word-by-word matching for multi-word search terms as a last resort
        const searchWords = lowerSearchTerm.split(" ").filter(word => word.length > 2);
        if (searchWords.length > 0) {
          // If we find ANY of the words, consider it a match
          for (const word of searchWords) {
            if (productName.includes(word) || 
                description.includes(word) || 
                category.includes(word) ||
                brand.includes(word) ||
                vendor.includes(word)) {
              return true;
            }
          }
        }
        
        // If we got here, this product doesn't match the search
        return false;
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
    
    console.log(`Filtered to ${filtered.length} products`);
    
    // If we have results, return them
    if (filtered.length > 0) {
      // Limit to 100 products max for better rendering performance
      return filtered.length > 100 ? filtered.slice(0, 100) : filtered;
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
