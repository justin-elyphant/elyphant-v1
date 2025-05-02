
import { useCallback, useMemo } from "react";
import { Product } from "@/types/product";

export const useCategoryFilter = (products: Product[] = []) => {
  // Extract unique categories from products
  const categories = useMemo(() => {
    if (!products || products.length === 0) return [];
    
    const uniqueCategories = [...new Set(products
      .filter(p => p.category)
      .map(p => p.category)
    )].filter(Boolean) as string[];
    
    return ["all", ...uniqueCategories];
  }, [products]);
  
  // Special occasion categories for gifting context
  const occasionCategories = [
    "all",
    "birthday",
    "anniversary",
    "wedding",
    "graduation",
    "baby_shower",
    "christmas",
    "valentines",
    "mothers_day",
    "fathers_day"
  ];
  
  // Utility function to match a product against an occasion category
  const matchesOccasionCategory = useCallback((product: Product, category: string) => {
    if (category === "all") return true;
    
    // Direct category match
    if (product.category?.toLowerCase() === category.toLowerCase()) {
      return true;
    }
    
    // Name, description and other field matching
    const productName = ((product.name || product.title) || "").toLowerCase();
    const description = ((product.description || product.product_description) || "").toLowerCase();
    const categoryLower = category.toLowerCase();
    const vendor = (product.vendor || "").toLowerCase();
    
    // Check for category keywords in product fields
    const categoryKeywords = getCategoryKeywords(category);
    
    // Check if any keywords match in product fields
    return categoryKeywords.some(keyword => 
      productName.includes(keyword) || 
      description.includes(keyword) ||
      (product.category && product.category.toLowerCase().includes(keyword))
    );
  }, []);
  
  // Get keywords associated with a category
  const getCategoryKeywords = (category: string): string[] => {
    const keywords: Record<string, string[]> = {
      birthday: ["birthday", "celebration", "party", "gift", "surprise"],
      anniversary: ["anniversary", "years", "celebration", "romantic"],
      wedding: ["wedding", "bride", "groom", "marriage", "couple"],
      graduation: ["graduation", "graduate", "college", "university", "academic"],
      baby_shower: ["baby", "shower", "newborn", "infant", "nursery", "crib"],
      christmas: ["christmas", "holiday", "santa", "xmas", "festive"],
      valentines: ["valentine", "love", "romantic", "heart", "couple"],
      mothers_day: ["mother", "mom", "mama", "maternal"],
      fathers_day: ["father", "dad", "papa", "paternal"],
      electronics: ["electronics", "gadget", "tech", "digital", "electronic"],
      home_decor: ["home", "decor", "decoration", "interior", "house", "living"],
      clothing: ["clothing", "clothes", "apparel", "wear", "fashion"],
      jewelry: ["jewelry", "jewel", "necklace", "ring", "bracelet"],
      books: ["book", "read", "novel", "author", "story"],
      sports: ["sport", "athletic", "fitness", "exercise", "workout"],
      office: ["office", "work", "professional", "desk", "business"],
      pets: ["pet", "dog", "cat", "animal", "companion"],
      kids: ["kid", "child", "children", "toy", "young"],
      travel: ["travel", "journey", "trip", "adventure", "luggage"],
      outdoor: ["outdoor", "nature", "outside", "garden", "patio"],
      summer: ["summer", "beach", "vacation", "seasonal", "sun"]
    };
    
    return keywords[category.toLowerCase()] || [category.toLowerCase()];
  };

  return {
    categories,
    occasionCategories,
    matchesOccasionCategory
  };
};
