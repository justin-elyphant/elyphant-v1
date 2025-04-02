
import { useState } from "react";
import { Product } from "@/contexts/ProductContext";

export const useCategoryFilter = (products: Product[]) => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  const categories = ["all", ...Array.from(new Set(products.map(p => p.category)))];
  
  return {
    categories,
    selectedCategory,
    setSelectedCategory
  };
};
