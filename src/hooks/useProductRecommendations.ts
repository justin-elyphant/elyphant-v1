import { useState, useEffect } from "react";
import { Product } from "@/types/product";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import marketplaceProvider from "@/services/marketplace/marketplaceConnector";

export const useProductRecommendations = (productId?: string) => {
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { recentlyViewedItems } = useRecentlyViewed();
  
  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsLoading(true);
      
      try {
        let recommendedProducts: Product[] = [];
        
        // If we have a specific product ID, get recommendations based on that
        if (productId) {
          recommendedProducts = await marketplaceProvider.getProductRecommendations(productId);
        } 
        // Otherwise, try to get recommendations based on recently viewed products
        else if (recentlyViewedItems && recentlyViewedItems.length > 0) {
          // Use most recently viewed item for recommendations
          const mostRecentItem = recentlyViewedItems[0];
          recommendedProducts = await marketplaceProvider.getProductRecommendations(mostRecentItem.id);
        }
        
        setRecommendations(recommendedProducts);
      } catch (error) {
        console.error("Error fetching product recommendations:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRecommendations();
  }, [productId, recentlyViewedItems]);
  
  return { recommendations, isLoading };
};
