
import { Product } from "@/types/product";
import { searchMockProducts } from "../../services/mockProductService";
import { addMockImagesToProducts } from "./productImageUtils";

/**
 * Load personalized products based on user profile interests
 */
export const loadPersonalizedProducts = (
  interests: string[], 
  setIsLoading: (isLoading: boolean) => void,
  setProducts: (products: Product[]) => void,
  productsLength: number
): void => {
  // Only show loading if we don't already have products
  if (productsLength === 0) {
    setIsLoading(true);
  }

  console.log("User interests for personalization:", interests);

  let personalizedProducts: Product[] = [];
  
  // If we have interests, use them for personalized results
  if (interests.length > 0) {
    // Use up to 3 interests to create a personalized mix of products
    const personalizedQuery = interests.slice(0, 3).join(" ");
    personalizedProducts = searchMockProducts(personalizedQuery, 10);
    
    // Tag these products as preference-based
    personalizedProducts.forEach(product => {
      product.tags = product.tags || [];
      product.tags.push("Based on your preferences");
      product.fromPreferences = true;
    });
    
    // Mix in some general products
    const generalProducts = searchMockProducts("gift ideas", 6);
    
    // Combine and shuffle to create a diverse but personalized selection
    personalizedProducts = [...personalizedProducts.slice(0, 10), ...generalProducts.slice(0, 6)]
      .sort(() => Math.random() - 0.5); // Simple shuffle
    
    console.log(`Generated ${personalizedProducts.length} personalized products based on interests`);
  } else {
    // Fallback to default products if no interests
    personalizedProducts = searchMockProducts("gift ideas", 16);
    console.log("No interests found, using default products");
  }
  
  // Add mock images to products
  personalizedProducts = addMockImagesToProducts(personalizedProducts);
  
  setProducts(personalizedProducts);
  setIsLoading(false);
};
