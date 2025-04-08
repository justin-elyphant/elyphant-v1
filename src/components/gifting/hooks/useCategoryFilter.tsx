
import { useState, useEffect } from "react";
import { Product } from "@/contexts/ProductContext";

export const useCategoryFilter = (products: Product[]) => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  // Add special occasion categories that might not be in the products data
  const occasionCategories = ["birthday", "wedding", "anniversary", "graduation", "baby_shower"];
  
  // Extract unique categories from products
  const productCategories = Array.from(new Set(products.map(p => p.category)));
  
  // Combine and ensure "all" is the first option
  const categories = ["all", ...occasionCategories, ...productCategories.filter(
    cat => !occasionCategories.includes(cat.toLowerCase())
  )];
  
  return {
    categories,
    selectedCategory,
    setSelectedCategory
  };
};
