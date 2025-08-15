import { useMemo } from "react";
import { tagIntelligenceService } from "@/services/wishlist/TagIntelligenceService";
import { useUnifiedWishlistSystem } from "@/hooks/useUnifiedWishlistSystem";

interface NicoleTagContext {
  recipientProfile?: any;
  occasion?: string;
  relationship?: string;
  budget?: { min: number; max: number };
  userPreferences?: any;
}

/**
 * Hook to integrate wishlist tags with Nicole's AI recommendations
 */
export function useNicoleTagIntegration() {
  const { wishlists } = useUnifiedWishlistSystem();

  /**
   * Get contextual tags for Nicole's gift recommendations
   */
  const getContextualTags = (context: NicoleTagContext): string[] => {
    return tagIntelligenceService.getContextualTagsForNicole(
      context.recipientProfile,
      context.occasion,
      context.relationship
    );
  };

  /**
   * Analyze user's wishlist patterns for Nicole's learning
   */
  const getUserTagInsights = useMemo(() => {
    if (!wishlists || wishlists.length === 0) {
      return {
        preferredCategories: [],
        commonTags: [],
        seasonalPreferences: [],
        pricePatterns: []
      };
    }

    const analytics = tagIntelligenceService.analyzeUserTagPatterns(wishlists);
    
    return {
      preferredCategories: analytics.userPatterns.slice(0, 5),
      commonTags: analytics.popularTags.slice(0, 10),
      seasonalPreferences: wishlists.flatMap(w => w.tags || [])
        .filter(tag => ['spring', 'summer', 'fall', 'winter', 'holiday', 'christmas'].some(season => 
          tag.includes(season)
        )),
      pricePatterns: wishlists.flatMap(w => w.tags || [])
        .filter(tag => ['under-25', '25-50', '50-100', '100-200', '200-500', 'luxury'].includes(tag))
    };
  }, [wishlists]);

  /**
   * Generate personalized gift suggestions based on tags
   */
  const getPersonalizedGiftTags = (
    context: NicoleTagContext
  ): { tags: string[]; confidence: number; reasoning: string } => {
    const contextualTags = getContextualTags(context);
    const userInsights = getUserTagInsights;
    
    // Combine contextual tags with user preferences
    const personalizedTags = [
      ...contextualTags,
      ...userInsights.commonTags.slice(0, 5).map(t => t.tag),
      ...userInsights.preferredCategories.slice(0, 3).map(c => c.category)
    ];

    // Remove duplicates and filter relevant tags
    const uniqueTags = [...new Set(personalizedTags)];
    
    // Calculate confidence based on tag overlap and user history
    const confidence = Math.min(
      0.3 + (userInsights.commonTags.length * 0.1) + (contextualTags.length * 0.1),
      0.9
    );

    const reasoning = `Based on ${userInsights.commonTags.length} wishlist patterns, ` +
      `${contextualTags.length} contextual factors, and ${userInsights.preferredCategories.length} category preferences`;

    return {
      tags: uniqueTags,
      confidence,
      reasoning
    };
  };

  /**
   * Generate product auto-tags for Nicole's catalog understanding
   */
  const generateProductTags = (product: any): string[] => {
    return tagIntelligenceService.autoTagFromProduct(product);
  };

  /**
   * Get wishlist-specific recommendations for Nicole
   */
  const getWishlistRecommendations = (wishlistId: string) => {
    const wishlist = wishlists?.find(w => w.id === wishlistId);
    if (!wishlist) return [];

    const tags = wishlist.tags || [];
    const category = wishlist.category;
    
    // Generate recommendations based on existing tags
    const suggestions = tagIntelligenceService.generateTagSuggestions(
      wishlist.title,
      wishlist.description,
      category,
      tags
    );

    return {
      wishlist,
      tags,
      category,
      suggestions: suggestions.slice(0, 6),
      relatedCategories: suggestions.map(s => s.category).filter((v, i, a) => a.indexOf(v) === i)
    };
  };

  return {
    getContextualTags,
    getUserTagInsights,
    getPersonalizedGiftTags,
    generateProductTags,
    getWishlistRecommendations
  };
}