
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
      // Search term filter
      const matchesSearch = 
        searchTerm === "" || 
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()));
      
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

    console.log(`Filtered products result: ${filtered.length} products`);
    return filtered;
  }, [products, searchTerm, selectedCategory, priceRange, matchesOccasionCategory]);

  return filteredProducts;
};
