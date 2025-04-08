
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Product } from "@/contexts/ProductContext";

export const useCategoryFilter = (products: Product[]) => {
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get("category");
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || "all");
  
  // Update selected category when URL params change
  useEffect(() => {
    if (categoryParam) {
      console.log("Category parameter detected:", categoryParam);
      setSelectedCategory(categoryParam);
    } else {
      setSelectedCategory("all"); // Reset to all if no category in URL
    }
  }, [categoryParam]);
  
  // Define special occasion categories
  const occasionCategories = ["birthday", "wedding", "anniversary", "graduation", "baby_shower", "pets"];
  
  // Extract unique categories from products
  const productCategories = Array.from(new Set(products.map(p => p.category)));
  
  // Combine and ensure "all" is the first option
  const categories = ["all", ...occasionCategories, ...productCategories.filter(
    cat => !occasionCategories.includes(cat.toLowerCase())
  )];
  
  return {
    categories,
    selectedCategory,
    setSelectedCategory,
    occasionCategories
  };
};
