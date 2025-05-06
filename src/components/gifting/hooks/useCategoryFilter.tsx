
import { useState, useEffect } from "react";
import { Product } from "@/contexts/ProductContext";
import { useSearchParams } from "react-router-dom";

export const useCategoryFilter = (products: Product[]) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<Record<string, number>>({});
  const [searchParams] = useSearchParams();

  // Update categories when products change
  useEffect(() => {
    if (!products || products.length === 0) {
      setCategories({});
      return;
    }

    const categoryMap: Record<string, number> = { "all": products.length };
    
    products.forEach(product => {
      // Use the category_name or category field
      const category = product.category_name || product.category;
      
      if (category) {
        if (categoryMap[category]) {
          categoryMap[category] += 1;
        } else {
          categoryMap[category] = 1;
        }
      }
    });
    
    setCategories(categoryMap);
  }, [products]);

  // Update selected category from URL parameters
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams]);

  // Group products by occasions for special filtering
  const occasionCategories = {
    "Birthday": ["birthday", "celebration"],
    "Anniversary": ["anniversary", "wedding"],
    "Holiday": ["christmas", "holiday", "halloween", "thanksgiving"],
    "Graduation": ["graduation", "school", "college"],
    "Baby Shower": ["baby", "newborn", "shower"],
    "Wedding": ["wedding", "marriage", "bridal"],
    "Housewarming": ["home", "house", "apartment"],
    "Thank You": ["thank you", "appreciation", "gratitude"],
    "Get Well": ["health", "recovery", "wellness"]
  };

  // Function to check if a product matches a specific occasion category
  const matchesOccasionCategory = (product: Product, category: string): boolean => {
    if (category === "all") return true;
    
    // Direct category match
    if ((product.category_name || product.category || "").toLowerCase() === category.toLowerCase()) {
      return true;
    }
    
    // Check against occasion categories
    for (const [occasion, keywords] of Object.entries(occasionCategories)) {
      if (occasion.toLowerCase() === category.toLowerCase()) {
        // Check if any of the keywords match in product fields
        for (const keyword of keywords) {
          if ((product.title || "").toLowerCase().includes(keyword) ||
              (product.description || "").toLowerCase().includes(keyword) ||
              (product.category || "").toLowerCase().includes(keyword) ||
              (product.category_name || "").toLowerCase().includes(keyword)) {
            return true;
          }
        }
      }
    }
    
    return false;
  };

  return {
    selectedCategory,
    setSelectedCategory,
    categories,
    occasionCategories,
    matchesOccasionCategory
  };
};
