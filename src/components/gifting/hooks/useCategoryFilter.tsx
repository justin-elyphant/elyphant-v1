
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
  
  // Helper function to check if a product matches a specific occasion category
  const matchesOccasionCategory = (product: Product, category: string): boolean => {
    if (!product || !category || category === "all") return true;
    
    const categoryLower = product.category?.toLowerCase() || "";
    const nameLower = product.name?.toLowerCase() || "";
    const descLower = product.description?.toLowerCase() || "";
    
    switch(category.toLowerCase()) {
      case "birthday":
        return categoryLower.includes("birthday") || 
               categoryLower.includes("celebration") ||
               nameLower.includes("birthday") ||
               descLower.includes("birthday celebration");
      
      case "wedding":
        return categoryLower.includes("wedding") || 
               categoryLower.includes("bride") || 
               categoryLower.includes("groom") ||
               nameLower.includes("wedding") ||
               descLower.includes("wedding");
      
      case "anniversary":
        return categoryLower.includes("anniversary") ||
               nameLower.includes("anniversary") ||
               categoryLower.includes("couple") ||
               descLower.includes("anniversary");
      
      case "graduation":
        return categoryLower.includes("graduation") || 
               categoryLower.includes("graduate") ||
               nameLower.includes("graduation") ||
               categoryLower.includes("academic") ||
               descLower.includes("graduation");
      
      case "baby_shower":
        return categoryLower.includes("baby") || 
               categoryLower.includes("shower") ||
               nameLower.includes("baby") ||
               categoryLower.includes("infant") ||
               categoryLower.includes("newborn") ||
               descLower.includes("baby");
      
      case "pets":
        return categoryLower.includes("pet") || 
               categoryLower.includes("dog") ||
               categoryLower.includes("cat") ||
               nameLower.includes("pet") ||
               nameLower.includes("dog") ||
               nameLower.includes("cat") ||
               descLower.includes("pet");
      
      default:
        // Direct match with the category
        return categoryLower === category.toLowerCase() || 
               categoryLower.includes(category.toLowerCase()) || 
               nameLower.includes(category.toLowerCase());
    }
  };
  
  return {
    categories,
    selectedCategory,
    setSelectedCategory,
    occasionCategories,
    matchesOccasionCategory
  };
};
