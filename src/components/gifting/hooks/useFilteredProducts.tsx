
import { useMemo } from "react";
import { Product } from "@/contexts/ProductContext";

export const useFilteredProducts = (
  products: Product[],
  searchTerm: string,
  selectedCategory: string,
  priceRange: string
) => {
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
      
      // Category filter - special handling for occasion categories
      let matchesCategory = selectedCategory === "all";
      
      if (!matchesCategory && product.category) {
        const productCategoryLower = product.category.toLowerCase();
        const selectedCategoryLower = selectedCategory.toLowerCase();
        
        // Check direct match
        if (productCategoryLower === selectedCategoryLower) {
          matchesCategory = true;
        } 
        // Check for birthday occasion
        else if (selectedCategoryLower === "birthday" && (
          productCategoryLower.includes("birthday") || 
          productCategoryLower.includes("celebration") ||
          product.name?.toLowerCase().includes("birthday")
        )) {
          matchesCategory = true;
        } 
        // Check for wedding occasion
        else if (selectedCategoryLower === "wedding" && (
          productCategoryLower.includes("wedding") || 
          productCategoryLower.includes("bride") || 
          productCategoryLower.includes("groom") ||
          product.name?.toLowerCase().includes("wedding")
        )) {
          matchesCategory = true;
        } 
        // Check for anniversary occasion
        else if (selectedCategoryLower === "anniversary" && (
          productCategoryLower.includes("anniversary") ||
          product.name?.toLowerCase().includes("anniversary") ||
          productCategoryLower.includes("couple")
        )) {
          matchesCategory = true;
        } 
        // Check for graduation occasion
        else if (selectedCategoryLower === "graduation" && (
          productCategoryLower.includes("graduation") || 
          productCategoryLower.includes("graduate") ||
          product.name?.toLowerCase().includes("graduation") ||
          productCategoryLower.includes("academic")
        )) {
          matchesCategory = true;
        } 
        // Check for baby shower occasion
        else if (selectedCategoryLower === "baby_shower" && (
          productCategoryLower.includes("baby") || 
          productCategoryLower.includes("shower") ||
          product.name?.toLowerCase().includes("baby") ||
          productCategoryLower.includes("infant") ||
          productCategoryLower.includes("newborn")
        )) {
          matchesCategory = true;
        }
      }

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
  }, [products, searchTerm, selectedCategory, priceRange]);

  return filteredProducts;
};
