
import { useState, useEffect } from "react";
import { Product } from "@/types/product";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";

interface PersonalizedRecommendationsOptions {
  limit?: number;
  includeViewedProducts?: boolean;
  preferredCategories?: string[];
}

export function usePersonalizedRecommendations(
  allProducts: Product[], 
  options: PersonalizedRecommendationsOptions = {}
) {
  const { 
    limit = 6, 
    includeViewedProducts = false, 
    preferredCategories = [] 
  } = options;
  
  const { user } = useAuth();
  const { profile } = useProfile();
  const { recentlyViewed } = useRecentlyViewed();
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const generateRecommendations = () => {
      setIsLoading(true);
      
      try {
        if (!allProducts || allProducts.length === 0) {
          setRecommendations([]);
          return;
        }
        
        // Start with a deep copy of all products
        let productPool = [...allProducts];
        
        // Get IDs of recently viewed products
        const recentlyViewedIds = new Set(
          recentlyViewed.map(item => item.id)
        );
        
        // Filter out recently viewed products if specified
        if (!includeViewedProducts) {
          productPool = productPool.filter(
            product => !recentlyViewedIds.has(product.id || product.product_id)
          );
        }
        
        // Get user interests from profile
        const userInterests = profile?.interests || [];
        
        // Combine user interests with preferred categories
        const relevantCategories = [
          ...new Set([...userInterests, ...preferredCategories])
        ];
        
        // Score products based on relevance factors
        const scoredProducts = productPool.map(product => {
          let score = 0;
          
          // Base score from rating
          score += (product.rating || product.stars || 0) * 2;
          
          // Bonus for best sellers
          if (product.isBestSeller) score += 10;
          
          // Category match bonus
          const productCategories = [
            product.category,
            product.category_name,
            ...(product.tags || [])
          ].filter(Boolean);
          
          relevantCategories.forEach(category => {
            if (productCategories.some(pc => 
              pc && category && pc.toLowerCase().includes(category.toLowerCase())
            )) {
              score += 15;
            }
          });
          
          return { product, score };
        });
        
        // Sort by score (descending) and take top results
        const topRecommendations = scoredProducts
          .sort((a, b) => b.score - a.score)
          .slice(0, limit)
          .map(item => item.product);
        
        setRecommendations(topRecommendations);
      } catch (err) {
        console.error("Error generating personalized recommendations:", err);
        // Fallback to simple selection
        setRecommendations(
          allProducts
            .slice()
            .sort(() => Math.random() - 0.5)
            .slice(0, limit)
        );
      } finally {
        setIsLoading(false);
      }
    };
    
    generateRecommendations();
  }, [allProducts, includeViewedProducts, limit, preferredCategories, profile?.interests, recentlyViewed]);

  return {
    recommendations,
    isLoading
  };
}
