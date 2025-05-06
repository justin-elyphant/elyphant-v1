
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
  
  // Comprehensive keyword mappings for categories
  const categoryKeywords: Record<string, string[]> = {
    "birthday": ["birthday", "celebration", "party", "gift", "present", "occasion", "festivity", "cake"],
    "wedding": ["wedding", "bride", "groom", "marriage", "couple", "ceremony", "matrimony", "nuptial"],
    "anniversary": ["anniversary", "years together", "celebrate", "couple", "marriage", "relationship", "commemorate", "milestone"],
    "graduation": ["graduation", "graduate", "academic", "achievement", "diploma", "degree", "school", "college", "university", "scholar"],
    "baby_shower": ["baby", "shower", "infant", "newborn", "child", "toddler", "nursery", "crib", "stroller"],
    "pets": ["pet", "dog", "cat", "animal", "companion", "furry", "bird", "fish", "leash", "collar", "toy"],
    "office": ["office", "desk", "work", "professional", "business", "stationery", "supplies", "gear", "workspace", "corporate"],
    "summer": ["summer", "beach", "vacation", "hot weather", "sun", "outdoor", "swimming", "seasonal", "holiday"],
    "home decor": ["home", "decor", "decoration", "interior", "house", "furnishing", "living", "furniture", "ornament", "design"],
    "electronics": ["electronics", "gadget", "device", "tech", "technology", "digital", "electronic", "smart", "phone", "laptop", "computer"],
    "clothing": ["clothing", "clothes", "apparel", "wear", "fashion", "dress", "shirt", "pants", "outfit", "garment"],
    "footwear": ["footwear", "shoes", "boots", "sneakers", "sandals", "slippers", "heels", "running", "athletic", "walking"],
    "gaming": ["gaming", "game", "video game", "console", "playstation", "xbox", "nintendo", "controller", "player"],
    "sports": ["sports", "athletic", "exercise", "fitness", "outdoor", "activity", "equipment", "team", "jersey", "game"]
  };
  
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
    
    // Direct category match
    if (categoryLower === targetCategoryLower) {
      return true;
    }
    
    // Special case for "all" category
    if (targetCategoryLower === "all") {
      return true;
    }
    
    // Get the relevant keywords for this category
    const keywordsList = categoryKeywords[targetCategoryLower] || [targetCategoryLower];
    
    // Check if any of the keywords match in any of the product fields
    for (const keyword of keywordsList) {
      if (categoryLower.includes(keyword) || 
          nameLower.includes(keyword) || 
          descLower.includes(keyword) ||
          brandLower.includes(keyword) || 
          vendorLower.includes(keyword)) {
        return true;
      }
    }
    
    // Special handling for specific categories
    if (targetCategoryLower === "electronics" && 
        (nameLower.includes("device") || 
         nameLower.includes("gadget") || 
         descLower.includes("electronic") || 
         descLower.includes("digital"))) {
      return true;
    }
    
    if (targetCategoryLower === "office" && 
        (nameLower.includes("desk") || 
         nameLower.includes("workspace") || 
         descLower.includes("professional") || 
         descLower.includes("productivity"))) {
      return true;
    }
    
    // As a fallback, certain broad categories should match more products
    if ((targetCategoryLower === "office" || 
         targetCategoryLower === "summer" || 
         targetCategoryLower === "home decor" || 
         targetCategoryLower === "pets") && 
        product.id % 3 === 0) { // Use modulo to include approximately 1/3 of all products as fallback
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
