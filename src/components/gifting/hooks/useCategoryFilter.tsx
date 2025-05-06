
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

  return {
    selectedCategory,
    setSelectedCategory,
    categories,
    occasionCategories
  };
};
