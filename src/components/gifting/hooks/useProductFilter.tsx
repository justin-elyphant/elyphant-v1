
import { useState } from "react";
import { Product } from "@/contexts/ProductContext";

export const useProductFilter = (products: Product[]) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [priceRange, setPriceRange] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [filtersVisible, setFiltersVisible] = useState(false);
  
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      searchTerm === "" || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    
    let matchesPrice = true;
    if (priceRange === "under25") matchesPrice = product.price < 25;
    else if (priceRange === "25to50") matchesPrice = product.price >= 25 && product.price <= 50;
    else if (priceRange === "50to100") matchesPrice = product.price > 50 && product.price <= 100;
    else if (priceRange === "over100") matchesPrice = product.price > 100;
    
    return matchesSearch && matchesCategory && matchesPrice;
  });

  const categories = ["all", ...Array.from(new Set(products.map(p => p.category)))];
  
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setPriceRange("all");
  };

  return {
    filteredProducts,
    categories,
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
