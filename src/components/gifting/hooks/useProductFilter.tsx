
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Product } from "@/types/product";
import { useSearchFilter } from "./useSearchFilter";
import { useCategoryFilter } from "./useCategoryFilter";
import { usePriceFilter } from "./usePriceFilter";
import { useFilterVisibility } from "./useFilterVisibility";
import { useFilteredProducts } from "./useFilteredProducts";

export const useProductFilter = (products: Product[]) => {
  const { searchTerm, setSearchTerm } = useSearchFilter();
  const { categories, occasionCategories, matchesOccasionCategory } = useCategoryFilter(products);
  const { priceRange, setPriceRange } = usePriceFilter();
  const { filtersVisible, setFiltersVisible } = useFilterVisibility();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  // Log the incoming products
  console.log(`useProductFilter: received ${products?.length || 0} products`);
  
  // Initialize filters from URL params
  useEffect(() => {
    const searchParam = searchParams.get("search");
    const categoryParam = searchParams.get("category");
    const priceParam = searchParams.get("price");
    
    if (searchParam) {
      console.log(`useProductFilter: Setting search from URL param: ${searchParam}`);
      setSearchTerm(searchParam);
    }
    
    if (categoryParam) {
      console.log(`useProductFilter: Setting category from URL param: ${categoryParam}`);
      setSelectedCategory(categoryParam);
    }
    
    if (priceParam) {
      console.log(`useProductFilter: Setting price from URL param: ${priceParam}`);
      setPriceRange(priceParam);
    }
    
    console.log(`URL params - category: ${categoryParam}, search: ${searchParam}, price: ${priceParam}`);
  }, [searchParams, setSearchTerm, setPriceRange]);
  
  // Update URL when filters change
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    
    if (searchTerm) {
      newParams.set("search", searchTerm);
    } else {
      newParams.delete("search");
    }
    
    if (selectedCategory && selectedCategory !== "all") {
      newParams.set("category", selectedCategory);
    } else {
      newParams.delete("category");
    }
    
    if (priceRange && priceRange !== "all") {
      newParams.set("price", priceRange);
    } else {
      newParams.delete("price");
    }
    
    // Preserve the tab parameter
    const tabParam = searchParams.get("tab");
    if (tabParam) {
      newParams.set("tab", tabParam);
    } else if ((selectedCategory && selectedCategory !== "all") || searchTerm) {
      // If we have a category filter or search but no tab, set tab to products
      newParams.set("tab", "products");
    }
    
    setSearchParams(newParams, { replace: true });
  }, [searchTerm, selectedCategory, priceRange, searchParams, setSearchParams]);
  
  const filteredProducts = useFilteredProducts(products || [], searchTerm, selectedCategory, priceRange);
  
  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedCategory("all");
    setPriceRange("all");
    
    // Clear filter params from URL
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("search");
    newParams.delete("category");
    newParams.delete("price");
    
    const tabParam = searchParams.get("tab");
    if (tabParam) {
      newParams.set("tab", tabParam);
    }
    
    setSearchParams(newParams, { replace: true });
  }, [setSearchTerm, setSelectedCategory, setPriceRange, searchParams, setSearchParams]);

  return {
    filteredProducts,
    categories,
    occasionCategories,
    searchTerm,
    setSearchTerm,
    priceRange,
    setPriceRange,
    selectedCategory,
    setSelectedCategory,
    filtersVisible,
    setFiltersVisible,
    clearFilters
  };
};
