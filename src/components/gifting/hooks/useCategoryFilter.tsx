
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
  const occasionCategories = ["birthday", "wedding", "anniversary", "graduation", "baby_shower", "pets", "office"];
  
  // Extract unique categories from products
  const productCategories = Array.from(new Set(products.map(p => p.category)));
  
  // Combine and ensure "all" is the first option
  const categories = ["all", ...occasionCategories, ...productCategories.filter(
    cat => cat && !occasionCategories.includes(cat.toLowerCase())
  )];
  
  // Helper function to check if a product matches a specific occasion category
  const matchesOccasionCategory = (product: Product, category: string): boolean => {
    if (!product || !category || category === "all") return true;
    
    // Make sure we're working with lowercase strings
    const categoryLower = (product.category || "").toLowerCase();
    const nameLower = (product.name || "").toLowerCase();
    const descLower = (product.description || "").toLowerCase();
    const brandLower = (product.brand || "").toLowerCase();
    
    console.log(`Checking if product "${product.name}" matches category "${category}"`);
    
    // Enhanced matching logic with more terms and better debug logging
    switch(category.toLowerCase()) {
      case "birthday":
        return categoryLower.includes("birthday") || 
               categoryLower.includes("celebration") ||
               nameLower.includes("birthday") ||
               descLower.includes("birthday") ||
               descLower.includes("celebration");
      
      case "wedding":
        return categoryLower.includes("wedding") || 
               categoryLower.includes("bride") || 
               categoryLower.includes("groom") ||
               nameLower.includes("wedding") ||
               nameLower.includes("bride") ||
               nameLower.includes("groom") ||
               descLower.includes("wedding") ||
               descLower.includes("matrimony") ||
               descLower.includes("marriage");
      
      case "anniversary":
        return categoryLower.includes("anniversary") ||
               nameLower.includes("anniversary") ||
               categoryLower.includes("couple") ||
               descLower.includes("anniversary") ||
               descLower.includes("years together");
      
      case "graduation":
        return categoryLower.includes("graduation") || 
               categoryLower.includes("graduate") ||
               nameLower.includes("graduation") ||
               categoryLower.includes("academic") ||
               descLower.includes("graduation") ||
               descLower.includes("academic achievement");
      
      case "baby_shower":
        return categoryLower.includes("baby") || 
               categoryLower.includes("shower") ||
               nameLower.includes("baby") ||
               categoryLower.includes("infant") ||
               categoryLower.includes("newborn") ||
               descLower.includes("baby") ||
               descLower.includes("newborn") ||
               descLower.includes("infant");
      
      case "pets":
        return categoryLower.includes("pet") || 
               categoryLower.includes("dog") ||
               categoryLower.includes("cat") ||
               nameLower.includes("pet") ||
               nameLower.includes("dog") ||
               nameLower.includes("cat") ||
               descLower.includes("pet") ||
               descLower.includes("animal") ||
               descLower.includes("dog") ||
               descLower.includes("cat");
               
      case "office":
        return categoryLower.includes("office") ||
               categoryLower.includes("desk") ||
               categoryLower.includes("work") ||
               nameLower.includes("office") ||
               nameLower.includes("desk") ||
               nameLower.includes("work") ||
               nameLower.includes("stationery") ||
               nameLower.includes("organizer") ||
               descLower.includes("office") ||
               descLower.includes("work") ||
               descLower.includes("desk") ||
               descLower.includes("professional") ||
               descLower.includes("business");
      
      default:
        // Direct match with the category
        const isMatch = categoryLower === category.toLowerCase() || 
                        categoryLower.includes(category.toLowerCase()) || 
                        nameLower.includes(category.toLowerCase()) ||
                        brandLower.includes(category.toLowerCase()) ||
                        descLower.includes(category.toLowerCase());
        
        return isMatch;
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
