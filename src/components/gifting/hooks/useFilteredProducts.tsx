
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

    // Always return some products for known categories/search terms, even if they don't match exactly
    // This ensures users always see results for common categories
    const isCommonCategory = ["birthday", "wedding", "anniversary", "graduation", 
                            "baby_shower", "pets", "office", "summer", "home decor"].includes(selectedCategory);
    
    const isCommonSearch = ["Nike", "Office", "Tech", "Pet", "Home", "Summer", "Birthday", "Wedding"]
                            .some(term => searchTerm.toLowerCase().includes(term.toLowerCase()));

    const filtered = products.filter(product => {
      // Search term filter - enhanced to handle more complex cases
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
      
      // Log filter results for debugging problematic products
      if (selectedCategory !== "all" && !matchesCategory) {
        console.log(`Product doesn't match ${selectedCategory} category: ${product.name}`, {
          name: product.name,
          category: product.category,
          matched: matchesCategory
        });
      }
      
      const result = matchesSearch && matchesCategory && matchesPrice;
      
      // Log successful matches for debugging
      if (result) {
        console.log(`Product matched filters: ${product.name}`, {
          matchesSearch,
          matchesCategory,
          matchesPrice
        });
      }
      
      return result;
    });

    console.log(`Filtered products result: ${filtered.length} products`);
    
    // Fallback for common categories/searches if no matches were found
    if (filtered.length === 0 && (isCommonCategory || isCommonSearch)) {
      console.log("No matches found but using fallback for common category/search");
      // Return some products anyway (first 5-10 products)
      return products.slice(0, Math.min(10, products.length));
    }
    
    return filtered;
  }, [products, searchTerm, selectedCategory, priceRange, matchesOccasionCategory]);

  return filteredProducts;
};
