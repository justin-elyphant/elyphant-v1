
import { useState, useEffect, useMemo } from "react";
import { Product } from "@/types/product";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";

interface PersonalizedRecommendationsOptions {
  limit?: number;
  includeViewedProducts?: boolean;
  preferredCategories?: string[];
  strategy?: 'balanced' | 'personalized' | 'popular';
}

export function usePersonalizedRecommendations(
  allProducts: Product[], 
  options: PersonalizedRecommendationsOptions = {}
) {
  const { 
    limit = 6, 
    includeViewedProducts = false, 
    preferredCategories = [],
    strategy = 'balanced'
  } = options;
  
  const { user } = useAuth();
  const { profile } = useProfile();
  const { recentlyViewed } = useRecentlyViewed();
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Extract user interests once rather than on each render
  const userInterests = useMemo(() => {
    return profile?.interests || [];
  }, [profile]);
  
  // Get recently viewed product IDs as a Set for efficient lookups
  const recentlyViewedIds = useMemo(() => {
    return new Set(recentlyViewed.map(item => item.id));
  }, [recentlyViewed]);

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
        
        // Filter out recently viewed products if specified
        if (!includeViewedProducts) {
          productPool = productPool.filter(
            product => !recentlyViewedIds.has(product.id || product.product_id)
          );
        } else {
          // If we're including viewed products, mark them
          productPool = productPool.map(product => {
            // Fixed: Check if the product id is in recentlyViewedIds
            const productId = product.id || product.product_id;
            if (productId && recentlyViewedIds.has(productId)) {
              return { ...product, isRecentlyViewed: true };
            }
            return product;
          });
        }
        
        // Combine user interests with preferred categories
        const relevantCategories = [
          ...new Set([...userInterests, ...preferredCategories])
        ];
        
        // Score products based on relevance factors
        const scoredProducts = productPool.map(product => {
          let score = 0;
          
          // Base score from rating (0-10 points)
          score += (product.rating || product.stars || 0) * 2;
          
          // Bonus for best sellers (10 points)
          if (product.isBestSeller) score += 10;
          
          // Bonus for free shipping (5 points)
          if (product.prime || (product as any).free_shipping) score += 5;
          
          // Bonus for items on sale (7 points)
          if ((product as any).sale_price && (product as any).sale_price < product.price) {
            score += 7;
          }
          
          // Category match bonus (15 points per match)
          const productCategories = [
            product.category,
            product.category_name,
            ...(product.tags || [])
          ].filter(Boolean);
          
          relevantCategories.forEach(category => {
            if (category && productCategories.some(pc => 
              pc && pc.toLowerCase().includes(category.toLowerCase())
            )) {
              score += 15;
            }
            
            // Also check product title for matches (5 points per match)
            const productTitle = product.title || product.name || '';
            if (category && productTitle.toLowerCase().includes(category.toLowerCase())) {
              score += 5;
            }
          });
          
          // Small penalty for recently viewed products if they're included (-3 points)
          if ((product as any).isRecentlyViewed) {
            score -= 3;
          }
          
          return { product, score };
        });
        
        // Apply different sorting strategies
        let finalRecommendations: Product[] = [];
        
        switch (strategy) {
          case 'personalized':
            // Heavily weight interests and browsing history
            finalRecommendations = scoredProducts
              .sort((a, b) => b.score - a.score)
              .slice(0, limit)
              .map(item => item.product);
            break;
            
          case 'popular':
            // Prioritize bestsellers and highly rated items
            finalRecommendations = scoredProducts
              .sort((a, b) => {
                const bPopularity = (b.product.isBestSeller ? 10 : 0) + 
                                  (b.product.rating || b.product.stars || 0) * 2;
                const aPopularity = (a.product.isBestSeller ? 10 : 0) + 
                                  (a.product.rating || a.product.stars || 0) * 2;
                return bPopularity - aPopularity;
              })
              .slice(0, limit)
              .map(item => item.product);
            break;
            
          case 'balanced':
          default:
            // Mix of relevance and diversity
            // First get some highly relevant items
            const highlyRelevant = scoredProducts
              .sort((a, b) => b.score - a.score)
              .slice(0, Math.ceil(limit * 0.6))
              .map(item => item.product);
              
            // Then get some popular items that weren't already included
            const highlyRelevantIds = new Set(highlyRelevant.map(p => p.id || p.product_id));
            const popularItems = scoredProducts
              .filter(item => !highlyRelevantIds.has(item.product.id || item.product.product_id))
              .sort((a, b) => {
                const bRating = b.product.rating || b.product.stars || 0;
                const aRating = a.product.rating || a.product.stars || 0;
                return bRating - aRating;
              })
              .slice(0, limit - highlyRelevant.length)
              .map(item => item.product);
              
            // Combine both lists
            finalRecommendations = [...highlyRelevant, ...popularItems];
        }
        
        setRecommendations(finalRecommendations);
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
  }, [allProducts, includeViewedProducts, limit, preferredCategories, userInterests, recentlyViewedIds, strategy]);

  return {
    recommendations,
    isLoading
  };
}
