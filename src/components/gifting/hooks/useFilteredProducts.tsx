
import { useMemo } from "react";
import { Product } from "@/contexts/ProductContext";
import { useCategoryFilter } from "./useCategoryFilter";

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

    // Flag for common categories that should always return some products
    const isCommonCategory = ["birthday", "wedding", "anniversary", "graduation", 
                            "baby_shower", "pets", "office", "summer", "home decor",
                            "electronics", "clothing", "footwear"].includes(selectedCategory.toLowerCase());
    
    const isCommonSearch = ["Nike", "Office", "Tech", "Pet", "Home", "Summer", "Birthday", "Wedding",
                           "Gift", "Present", "Apple", "Electronics", "Clothing", "Shoes", "Furniture"]
                            .some(term => searchTerm.toLowerCase().includes(term.toLowerCase()));

    // First pass - try to filter according to criteria
    const filtered = products.filter(product => {
      // Search term filter
      const matchesSearch = searchTerm === "" || (() => {
        const lowerSearchTerm = searchTerm.toLowerCase();
        const productName = (product.name || "").toLowerCase();
        const vendor = (product.vendor || "").toLowerCase();
        const description = (product.description || "").toLowerCase();
        const category = (product.category || "").toLowerCase();
        const brand = (product.brand || "").toLowerCase();
        
        // Direct full string match
        if (productName.includes(lowerSearchTerm) || 
            vendor.includes(lowerSearchTerm) ||
            description.includes(lowerSearchTerm) ||
            brand.includes(lowerSearchTerm) ||
            category.includes(lowerSearchTerm)) {
          return true;
        }
        
        // Word-by-word matching for multi-word search terms
        const searchWords = lowerSearchTerm.split(" ").filter(word => word.length > 2);
        if (searchWords.length > 0) {
          // If we find ANY of the words, consider it a match (more permissive)
          const matchCount = searchWords.filter(word => 
            productName.includes(word) || 
            description.includes(word) || 
            category.includes(word) ||
            brand.includes(word) ||
            vendor.includes(word)
          ).length;
          
          // Match if we find at least one word
          return matchCount > 0;
        }
        
        return false;
      })();
      
      // Category filter - Use the matchesOccasionCategory function from useCategoryFilter
      const matchesCategory = selectedCategory === "all" || matchesOccasionCategory(product, selectedCategory);
      
      // Price range filter
      let matchesPrice = true;
      if (priceRange === "under25") matchesPrice = product.price < 25;
      else if (priceRange === "25to50") matchesPrice = product.price >= 25 && product.price <= 50;
      else if (priceRange === "50to100") matchesPrice = product.price > 50 && product.price <= 100;
      else if (priceRange === "over100") matchesPrice = product.price > 100;
      
      return matchesSearch && matchesCategory && matchesPrice;
    });
    
    console.log(`Initial filtered products: ${filtered.length} products`);
    
    // If we have results, return them
    if (filtered.length > 0) {
      return filtered;
    }
    
    // Second pass - if we have no results but a common category or search term, be more permissive
    if (isCommonCategory || isCommonSearch) {
      console.log("No matches found but trying more permissive search for common category/search");
      
      const secondPassFiltered = products.filter(product => {
        // Only filter by price as it's the most restrictive
        let matchesPrice = true;
        if (priceRange === "under25") matchesPrice = product.price < 25;
        else if (priceRange === "25to50") matchesPrice = product.price >= 25 && product.price <= 50;
        else if (priceRange === "50to100") matchesPrice = product.price > 50 && product.price <= 100;
        else if (priceRange === "over100") matchesPrice = product.price > 100;
        
        return matchesPrice;
      });
      
      console.log(`Second pass filtered products: ${secondPassFiltered.length} products`);
      
      if (secondPassFiltered.length > 0) {
        return secondPassFiltered.slice(0, Math.min(15, secondPassFiltered.length));
      }
    }
    
    // Last resort - if still no results after permissive filter, show some products anyway
    console.log("No matches found but using fallback to show some products");
    return products.slice(0, Math.min(10, products.length));
  }, [products, searchTerm, selectedCategory, priceRange, matchesOccasionCategory]);

  return filteredProducts;
};
