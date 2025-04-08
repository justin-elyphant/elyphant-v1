
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
        if (searchWords.length > 1) {
          // If we find most of the words, consider it a match
          const matchCount = searchWords.filter(word => 
            productName.includes(word) || 
            description.includes(word) || 
            category.includes(word) ||
            brand.includes(word)
          ).length;
          
          // Match if we find at least 70% of the words or at least 2 words
          return matchCount >= Math.max(1, Math.floor(searchWords.length * 0.5));
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
    return filtered;
  }, [products, searchTerm, selectedCategory, priceRange, matchesOccasionCategory]);

  return filteredProducts;
};
