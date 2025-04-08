
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
  const occasionCategories = ["birthday", "wedding", "anniversary", "graduation", "baby_shower", "pets", "office", "summer", "home decor"];
  
  // Extract unique categories from products
  const productCategories = Array.from(new Set(products.map(p => p.category)));
  
  // Combine and ensure "all" is the first option
  const categories = ["all", ...occasionCategories, ...productCategories.filter(
    cat => cat && !occasionCategories.includes(cat.toLowerCase())
  )];
  
  // Helper function to check if a product matches a specific occasion category
  const matchesOccasionCategory = (product: Product, category: string): boolean => {
    if (!product || !category || category === "all") return true;
    
    // Make sure we're working with lowercase strings to avoid case-sensitivity issues
    const categoryLower = (product.category || "").toLowerCase();
    const nameLower = (product.name || "").toLowerCase();
    const descLower = (product.description || "").toLowerCase();
    const brandLower = (product.brand || "").toLowerCase();
    const vendorLower = (product.vendor || "").toLowerCase();
    const targetCategoryLower = category.toLowerCase();
    
    // Enhanced keywords matching for different categories
    const keywordMaps: Record<string, string[]> = {
      "birthday": ["birthday", "celebration", "party", "gift", "present", "occasion"],
      "wedding": ["wedding", "bride", "groom", "marriage", "couple", "ceremony", "matrimony"],
      "anniversary": ["anniversary", "years together", "celebrate", "couple", "marriage", "relationship"],
      "graduation": ["graduation", "graduate", "academic", "achievement", "diploma", "degree", "school", "college"],
      "baby_shower": ["baby", "shower", "infant", "newborn", "child", "toddler", "nursery"],
      "pets": ["pet", "dog", "cat", "animal", "companion", "furry", "bird", "fish"],
      "office": ["office", "desk", "work", "professional", "business", "stationery", "supplies"],
      "summer": ["summer", "beach", "vacation", "hot weather", "sun", "outdoor", "swimming"],
      "home decor": ["home", "decor", "decoration", "interior", "house", "furnishing", "living"]
    };
    
    // Get the relevant keywords for this category
    const categoryKeywords = keywordMaps[targetCategoryLower] || [targetCategoryLower];
    
    // Check if any of the keywords match in any of the product fields
    for (const keyword of categoryKeywords) {
      if (categoryLower.includes(keyword) || 
          nameLower.includes(keyword) || 
          descLower.includes(keyword) ||
          brandLower.includes(keyword) || 
          vendorLower.includes(keyword)) {
        return true;
      }
    }
    
    // If we have an exact category match in the product's category, that's a match too
    if (categoryLower === targetCategoryLower) {
      return true;
    }
    
    // Special case for "all" category
    if (targetCategoryLower === "all") {
      return true;
    }

    return false;
  };
  
  return {
    categories,
    selectedCategory,
    setSelectedCategory,
    occasionCategories,
    matchesOccasionCategory
  };
};
