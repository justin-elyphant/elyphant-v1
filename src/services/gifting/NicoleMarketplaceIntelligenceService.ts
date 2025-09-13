/*
 * ========================================================================
 * 🤖 NICOLE MARKETPLACE INTELLIGENCE SERVICE - 80% TOOLING FOCUS 🤖
 * ========================================================================
 * 
 * This service enhances Nicole's GPT agent with marketplace intelligence
 * for auto-gifting product discovery and curation (80% tooling, 20% conversation)
 * 
 * Phase 2: Nicole GPT Agent Marketplace Enhancement
 * - Product intelligence and discovery tools
 * - Enhanced wishlist-interests-AI logic integration
 * - Marketplace conversational interface via AIEnhancedSearchBar
 * - Agent memory for improved curation over time
 * 
 * ⚠️ CRITICAL FEATURES:
 * - Intelligent product filtering based on recipient data
 * - Hierarchical gift selection (Wishlist → Interests → AI → Demographic)
 * - Conversation context preservation for better recommendations
 * - Integration with existing UnifiedMarketplaceService
 * 
 * 🔗 SYSTEM INTEGRATION:
 * - useUnifiedSearch hook for marketplace queries
 * - unifiedMarketplaceService for product operations
 * - AIEnhancedSearchBar for conversational interface
 * - Auto-gifting rules and recipient data
 * - Gift recommendation and intelligence systems
 * 
 * Last update: 2025-01-28 (MVP Auto-Gifting Implementation)
 * ========================================================================
 */

import { Product } from "@/types/product";
import { unifiedMarketplaceService } from "@/services/marketplace/UnifiedMarketplaceService";
import { supabase } from "@/integrations/supabase/client";

export interface NicoleProductContext {
  recipient_id?: string;
  recipient_name?: string;
  relationship?: string;
  occasion?: string;
  budget?: { min?: number; max?: number } | [number, number];
  interests?: string[];
  conversation_history?: string[];
  confidence_threshold?: number;
}

export interface NicoleProductRecommendation {
  product: Product;
  reasoning: string;
  confidence_score: number;
  source: 'wishlist' | 'interests' | 'ai_curated' | 'demographic';
  match_factors: string[];
}

export interface ProductIntelligenceResult {
  recommendations: NicoleProductRecommendation[];
  search_query_used: string;
  total_products_analyzed: number;
  intelligence_source: string;
  context_used: NicoleProductContext;
}

class NicoleMarketplaceIntelligenceService {

  /**
   * TIER 1: Get products from recipient's wishlist (highest priority)
   */
  private async getWishlistProducts(recipientId: string, budget?: { min?: number; max?: number }): Promise<NicoleProductRecommendation[]> {
    console.log(`🎯 [NICOLE INTELLIGENCE] Fetching wishlist products for recipient: ${recipientId}`);

    try {
      const { data: wishlistItems, error } = await supabase
        .from('wishlist_items')
        .select(`
          *,
          wishlists!inner (
            user_id,
            title,
            is_public
          )
        `)
        .eq('wishlists.user_id', recipientId)
        .eq('wishlists.is_public', true); // Only get public wishlists for gifting

      if (error) {
        console.error('Error fetching wishlist:', error);
        return [];
      }

      const recommendations: NicoleProductRecommendation[] = [];

      for (const item of wishlistItems || []) {
        // Parse product data from wishlist item
        const product: Product = {
          product_id: item.product_id || `wishlist_${item.id}`,
          name: item.name,
          title: item.name,
          price: item.price || 0,
          image: item.image_url,
          description: item.description,
          vendor: item.brand || 'Unknown',
          rating: 5.0, // Wishlist items are highly desired
          productSource: 'manual',
          isZincApiProduct: false
        };

        // Apply budget filter if specified
        if (budget && (budget.min || budget.max)) {
          const price = product.price;
          if (budget.min && price < budget.min) continue;
          if (budget.max && price > budget.max) continue;
        }

        recommendations.push({
          product,
          reasoning: `This item is on ${item.wishlists.title || 'their wishlist'}, indicating strong interest`,
          confidence_score: 0.95, // Very high confidence for wishlist items
          source: 'wishlist',
          match_factors: ['wishlist_item', 'high_interest', 'verified_desire']
        });
      }

      console.log(`✅ Found ${recommendations.length} wishlist products`);
      return recommendations;

    } catch (error) {
      console.error('Error in wishlist product fetch:', error);
      return [];
    }
  }

  /**
   * TIER 2: Get products based on recipient interests and profile data
   */
  private async getInterestBasedProducts(
    recipientId: string, 
    context: NicoleProductContext,
    maxResults: number = 10
  ): Promise<NicoleProductRecommendation[]> {
    console.log(`🎯 [NICOLE INTELLIGENCE] Getting interest-based products for recipient: ${recipientId}`);

    try {
      // Get recipient profile and interests
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', recipientId)
        .single();

      if (error || !profile) {
        console.log('No profile found, using context interests');
        return await this.searchProductsByKeywords(context.interests || [], context, maxResults);
      }

      // Extract interests from profile
      const profileInterests = Array.isArray(profile.interests) ? profile.interests : [];
      const contextInterests = Array.isArray(context.interests) ? context.interests : [];
      const allInterests = [...new Set([...(profileInterests as any[]), ...(contextInterests as any[])])];

      if (!allInterests.length) {
        console.log('No interests found, falling back to demographic search');
        return await this.getDemographicProducts(context, maxResults);
      }

      // Search products based on interests
      return await this.searchProductsByKeywords(allInterests, context, maxResults);

    } catch (error) {
      console.error('Error in interest-based product search:', error);
      return [];
    }
  }

  /**
   * TIER 3: AI-curated recommendations using conversation context
   */
  private async getAICuratedProducts(
    context: NicoleProductContext,
    maxResults: number = 8
  ): Promise<NicoleProductRecommendation[]> {
    console.log(`🤖 [NICOLE INTELLIGENCE] Generating AI-curated recommendations`);

    try {
      // Generate search terms based on conversation context
      const aiSearchTerms = this.generateAISearchTerms(context);
      console.log(`🔍 AI generated search terms:`, aiSearchTerms);

      // Search for products using AI terms
      const recommendations = await this.searchProductsByKeywords(aiSearchTerms, context, maxResults);

      // Enhance recommendations with AI reasoning
      return recommendations.map(rec => ({
        ...rec,
        source: 'ai_curated' as const,
        reasoning: `AI analysis suggests this ${rec.product.name} matches the context: ${context.occasion || 'gift'} for ${context.relationship || 'someone special'}`,
        confidence_score: rec.confidence_score * 0.8, // Slightly lower confidence for AI curation
        match_factors: [...rec.match_factors, 'ai_analysis', 'context_matching']
      }));

    } catch (error) {
      console.error('Error in AI curation:', error);
      return [];
    }
  }

  /**
   * TIER 4: Demographic fallback products
   */
  private async getDemographicProducts(
    context: NicoleProductContext,
    maxResults: number = 6
  ): Promise<NicoleProductRecommendation[]> {
    console.log(`👥 [NICOLE INTELLIGENCE] Getting demographic fallback products`);

    try {
      // Use generic search terms based on occasion and relationship
      const demographicTerms = this.generateDemographicTerms(context);
      console.log(`🎯 Demographic search terms:`, demographicTerms);

      const recommendations = await this.searchProductsByKeywords(demographicTerms, context, maxResults);

      return recommendations.map(rec => ({
        ...rec,
        source: 'demographic' as const,
        reasoning: `Popular choice for ${context.occasion || 'gifts'} among ${context.relationship || 'friends'}`,
        confidence_score: rec.confidence_score * 0.6, // Lower confidence for demographic
        match_factors: [...rec.match_factors, 'demographic_popular', 'occasion_appropriate']
      }));

    } catch (error) {
      console.error('Error in demographic search:', error);
      return [];
    }
  }

  /**
   * Search products by keywords with enhanced intelligence
   */
  private async searchProductsByKeywords(
    keywords: string[],
    context: NicoleProductContext,
    maxResults: number
  ): Promise<NicoleProductRecommendation[]> {
    if (!keywords.length) return [];

    try {
      // Use the first keyword as primary search term
      const searchQuery = keywords[0];
      console.log(`🔍 Searching marketplace for: "${searchQuery}"`);

      // Search using UnifiedMarketplaceService
      const products = await unifiedMarketplaceService.searchProducts(searchQuery, {
        maxResults
      });

      console.log(`📦 Found ${products.length} products for "${searchQuery}"`);

      // Convert to recommendations with scoring
      const recommendations: NicoleProductRecommendation[] = products.map(product => {
        const matchFactors = this.calculateMatchFactors(product, keywords, context);
        const confidenceScore = this.calculateConfidenceScore(product, matchFactors, context);

        return {
          product,
          reasoning: this.generateReasoning(product, matchFactors, context),
          confidence_score: confidenceScore,
          source: 'interests' as const,
          match_factors: matchFactors
        };
      });

      // Sort by confidence score
      return recommendations.sort((a, b) => b.confidence_score - a.confidence_score);

    } catch (error) {
      console.error(`Error searching for keywords: ${keywords}`, error);
      return [];
    }
  }

  /**
   * Main intelligence method: Get curated products using hierarchical approach
   */
  async getCuratedProducts(context: NicoleProductContext): Promise<ProductIntelligenceResult> {
    console.log(`🧠 [NICOLE INTELLIGENCE] Starting hierarchical product curation`, context);

    const allRecommendations: NicoleProductRecommendation[] = [];
    let intelligenceSource = '';

    try {
      // TIER 1: Wishlist (if recipient ID available)
      if (context.recipient_id) {
        const budgetObj = Array.isArray(context.budget) ? 
          { min: context.budget[0], max: context.budget[1] } : 
          context.budget;
        const wishlistProducts = await this.getWishlistProducts(context.recipient_id, budgetObj);
        allRecommendations.push(...wishlistProducts);
        if (wishlistProducts.length > 0) {
          intelligenceSource += 'wishlist+';
        }
      }

      // TIER 2: Interest-based (if we have recipient or interests)
      if (context.recipient_id || context.interests?.length) {
        const interestProducts = await this.getInterestBasedProducts(
          context.recipient_id || '', 
          context, 
          8
        );
        allRecommendations.push(...interestProducts);
        if (interestProducts.length > 0) {
          intelligenceSource += 'interests+';
        }
      }

      // TIER 3: AI-curated (always run for conversation context)
      const aiProducts = await this.getAICuratedProducts(context, 6);
      allRecommendations.push(...aiProducts);
      if (aiProducts.length > 0) {
        intelligenceSource += 'ai_curated+';
      }

      // TIER 4: Demographic fallback (if other tiers didn't provide enough)
      if (allRecommendations.length < 5) {
        const demographicProducts = await this.getDemographicProducts(context, 4);
        allRecommendations.push(...demographicProducts);
        if (demographicProducts.length > 0) {
          intelligenceSource += 'demographic';
        }
      }

      // Remove duplicates and apply final filtering
      const uniqueRecommendations = this.deduplicateRecommendations(allRecommendations);
      
      // Apply confidence threshold
      const confidenceThreshold = context.confidence_threshold || 0.3;
      const filteredRecommendations = uniqueRecommendations.filter(
        rec => rec.confidence_score >= confidenceThreshold
      );

      // Limit final results to top 12
      const finalRecommendations = filteredRecommendations.slice(0, 12);

      console.log(`✅ [NICOLE INTELLIGENCE] Generated ${finalRecommendations.length} final recommendations`);

      return {
        recommendations: finalRecommendations,
        search_query_used: this.generateSearchQuery(context),
        total_products_analyzed: allRecommendations.length,
        intelligence_source: intelligenceSource.replace(/\+$/, ''),
        context_used: context
      };

    } catch (error) {
      console.error('Error in product curation:', error);
      return {
        recommendations: [],
        search_query_used: context.occasion || 'gifts',
        total_products_analyzed: 0,
        intelligence_source: 'error',
        context_used: context
      };
    }
  }

  /**
   * Generate AI search terms from conversation context
   */
  private generateAISearchTerms(context: NicoleProductContext): string[] {
    const terms: string[] = [];

    // Add occasion-based terms
    if (context.occasion) {
      const occasionTerms = {
        'birthday': ['birthday gift', 'celebration', 'party'],
        'anniversary': ['anniversary gift', 'romantic', 'meaningful'],
        'christmas': ['christmas gift', 'holiday', 'festive'],
        'graduation': ['graduation gift', 'achievement', 'milestone']
      };
      terms.push(...(occasionTerms[context.occasion as keyof typeof occasionTerms] || [context.occasion]));
    }

    // Add relationship-based terms
    if (context.relationship) {
      const relationshipTerms = {
        'friend': ['friendship', 'thoughtful', 'personal'],
        'family': ['family gift', 'loving', 'cherished'],
        'romantic': ['romantic gift', 'intimate', 'special'],
        'colleague': ['professional gift', 'appropriate', 'respectful']
      };
      terms.push(...(relationshipTerms[context.relationship as keyof typeof relationshipTerms] || [context.relationship]));
    }

    // Add conversation context terms
    if (context.conversation_history?.length) {
      // Extract keywords from recent conversation
      const conversationText = context.conversation_history.join(' ').toLowerCase();
      const keywords = conversationText.match(/\b[a-z]{3,}\b/g) || [];
      terms.push(...keywords.slice(0, 3)); // Limit to 3 conversation keywords
    }

    return [...new Set(terms)].slice(0, 5); // Dedupe and limit
  }

  /**
   * Generate demographic search terms
   */
  private generateDemographicTerms(context: NicoleProductContext): string[] {
    const terms: string[] = ['popular gifts', 'best sellers'];

    if (context.occasion) {
      terms.push(`popular ${context.occasion} gifts`);
    }

    if (context.relationship) {
      terms.push(`gifts for ${context.relationship}`);
    }

    return terms;
  }

  /**
   * Calculate match factors for a product
   */
  private calculateMatchFactors(product: Product, keywords: string[], context: NicoleProductContext): string[] {
    const factors: string[] = [];

    // Keyword matching
    const productText = `${product.name} ${product.title} ${product.description || ''}`.toLowerCase();
    keywords.forEach(keyword => {
      if (productText.includes(keyword.toLowerCase())) {
        factors.push(`keyword_match_${keyword}`);
      }
    });

    // Budget matching
    if (context.budget) {
      const price = product.price;
      const budget = Array.isArray(context.budget) ? 
        { min: context.budget[0], max: context.budget[1] } : 
        context.budget as { min?: number; max?: number };
      
      if (budget.min && budget.max && price >= budget.min && price <= budget.max) {
        factors.push('budget_perfect_match');
      } else if (budget.max && price <= budget.max) {
        factors.push('budget_under_limit');
      }
    }

    // Rating factor
    if (product.rating && product.rating >= 4.0) {
      factors.push('high_rating');
    }

    return factors;
  }

  /**
   * Calculate confidence score for a product
   */
  private calculateConfidenceScore(product: Product, matchFactors: string[], context: NicoleProductContext): number {
    let score = 0.5; // Base score

    // Keyword matches boost confidence
    const keywordMatches = matchFactors.filter(f => f.startsWith('keyword_match')).length;
    score += keywordMatches * 0.15;

    // Budget match boosts confidence
    if (matchFactors.includes('budget_perfect_match')) {
      score += 0.2;
    } else if (matchFactors.includes('budget_under_limit')) {
      score += 0.1;
    }

    // High rating boosts confidence
    if (matchFactors.includes('high_rating')) {
      score += 0.1;
    }

    // Product description quality
    if (product.description && product.description.length > 50) {
      score += 0.05;
    }

    return Math.min(score, 1.0); // Cap at 1.0
  }

  /**
   * Generate reasoning text for a recommendation
   */
  private generateReasoning(product: Product, matchFactors: string[], context: NicoleProductContext): string {
    const reasons: string[] = [];

    if (matchFactors.some(f => f.startsWith('keyword_match'))) {
      reasons.push('matches your interests');
    }

    if (matchFactors.includes('budget_perfect_match')) {
      reasons.push('fits perfectly within budget');
    }

    if (matchFactors.includes('high_rating')) {
      reasons.push('highly rated by customers');
    }

    if (context.occasion) {
      reasons.push(`appropriate for ${context.occasion}`);
    }

    return reasons.length > 0 ? 
      `This ${product.name} ${reasons.join(' and ')}.` :
      `This ${product.name} could be a great choice.`;
  }

  /**
   * Remove duplicate products from recommendations
   */
  private deduplicateRecommendations(recommendations: NicoleProductRecommendation[]): NicoleProductRecommendation[] {
    const seen = new Set<string>();
    return recommendations.filter(rec => {
      const key = rec.product.product_id || rec.product.name;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Generate search query for marketplace navigation
   */
  private generateSearchQuery(context: NicoleProductContext): string {
    const parts: string[] = [];

    if (context.interests?.length) {
      parts.push(context.interests[0]);
    }

    if (context.occasion) {
      parts.push(context.occasion);
    }

    if (parts.length === 0) {
      return 'gifts';
    }

    return parts.join(' ');
  }
}

// Export singleton instance
export const nicoleMarketplaceIntelligenceService = new NicoleMarketplaceIntelligenceService();