
import { useState, useEffect, useMemo } from "react";
import { Product } from "@/types/product";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import marketplaceProvider from "@/services/marketplace/marketplaceConnector";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";

export const useProductRecommendations = (productId?: string) => {
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { recentlyViewed } = useRecentlyViewed();
  const { user } = useAuth();
  const { profile } = useProfile();
  
  // Get the user's interests from their profile
  const userInterests = useMemo(() => {
    return profile?.interests || [];
  }, [profile]);
  
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
        else if (recentlyViewed && recentlyViewed.length > 0) {
          // Use most recently viewed item for recommendations
          const mostRecentItem = recentlyViewed[0];
          recommendedProducts = await marketplaceProvider.getProductRecommendations(mostRecentItem.id);
          
          // If we have multiple recently viewed items, get a blend of recommendations
          if (recentlyViewed.length > 1) {
            // Get recommendations for the second most recent item
            const secondMostRecentItem = recentlyViewed[1];
            const additionalRecs = await marketplaceProvider.getProductRecommendations(secondMostRecentItem.id);
            
            // Combine recommendations with no duplicates
            const existingIds = new Set(recommendedProducts.map(p => p.product_id || p.id));
            for (const product of additionalRecs) {
              if (!existingIds.has(product.product_id || product.id)) {
                recommendedProducts.push(product);
                existingIds.add(product.product_id || product.id);
              }
            }
          }
        }
        
        // Filter out products the user has already viewed
        const viewedIds = new Set(recentlyViewed.map(item => item.id));
        recommendedProducts = recommendedProducts.filter(
          product => !viewedIds.has(product.product_id || product.id)
        );
        
        // Score and sort products based on user interests
        if (userInterests.length > 0) {
          recommendedProducts = sortByUserInterests(recommendedProducts, userInterests);
        }
        
        setRecommendations(recommendedProducts);
      } catch (error) {
        console.error("Error fetching product recommendations:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRecommendations();
  }, [productId, recentlyViewed, userInterests]);
  
  // Helper function to sort products based on user interests
  const sortByUserInterests = (products: Product[], interests: string[]) => {
    return products.sort((a, b) => {
      const aScore = getInterestMatchScore(a, interests);
      const bScore = getInterestMatchScore(b, interests);
      
      // First sort by interest match score
      if (bScore !== aScore) {
        return bScore - aScore;
      }
      
      // Then sort by rating if available
      const aRating = a.rating || a.stars || 0;
      const bRating = b.rating || b.stars || 0;
      
      if (bRating !== aRating) {
        return bRating - aRating;
      }
      
      // If all else is equal, sort bestsellers first
      return (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0);
    });
  };
  
  // Calculate how well a product matches user interests
  const getInterestMatchScore = (product: Product, interests: string[]) => {
    let score = 0;
    
    // Check product category
    const category = product.category || product.category_name || "";
    
    // Check product tags
    const tags = product.tags || [];
    
    // Check product title/name
    const title = product.title || product.name || "";
    
    // Score based on matches in different product fields
    for (const interest of interests) {
      // Category match (highest value)
      if (category.toLowerCase().includes(interest.toLowerCase())) {
        score += 3;
      }
      
      // Tag match (good value)
      if (tags.some(tag => tag.toLowerCase().includes(interest.toLowerCase()))) {
        score += 2;
      }
      
      // Title match (some value)
      if (title.toLowerCase().includes(interest.toLowerCase())) {
        score += 1;
      }
    }
    
    return score;
  };
  
  return { recommendations, isLoading };
};
