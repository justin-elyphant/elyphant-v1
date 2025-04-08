
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
      const matchesSearch = 
        searchTerm === "" || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Updated category matching logic to handle specific occasion categories
      const matchesCategory = 
        selectedCategory === "all" || 
        (product.category && product.category.toLowerCase() === selectedCategory.toLowerCase()) ||
        (selectedCategory === "birthday" && product.category && product.category.toLowerCase().includes("birthday")) ||
        (selectedCategory === "wedding" && product.category && product.category.toLowerCase().includes("wedding")) ||
        (selectedCategory === "anniversary" && product.category && product.category.toLowerCase().includes("anniversary")) ||
        (selectedCategory === "graduation" && product.category && product.category.toLowerCase().includes("graduation")) ||
        (selectedCategory === "baby_shower" && product.category && (
          product.category.toLowerCase().includes("baby") || 
          product.category.toLowerCase().includes("shower")
        ));
      
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
