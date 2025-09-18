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
 * Phase 3.5: Enhanced Category Search Integration
 * - Integrated with CategorySearchService for optimized performance
 * - Leverages enhanced caching and search routing
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
import { CategorySearchService } from "@/services/categoryRegistry/CategorySearchService";

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
      // Two-step approach with RLS-friendly queries
      // 1) Fetch public wishlists for recipient
      const { data: publicWishlists, error: publicWlError } = await supabase
        .from('wishlists')
        .select('id, title, user_id, is_public')
        .eq('user_id', recipientId)
        .eq('is_public', true);

      let wishlistItems: any[] | null = null;

      // Fetch items for public wishlists if any
      if (publicWishlists && publicWishlists.length > 0) {
        const wlIds = publicWishlists.map(w => w.id);
        const { data: items } = await supabase
          .from('wishlist_items')
          .select('*')
          .in('wishlist_id', wlIds);
        const titleMap: Record<string, string> = {};
        for (const w of publicWishlists) titleMap[w.id] = w.title || '';
        wishlistItems = (items || []).map(it => ({
          ...it,
          wishlists: { title: titleMap[it.wishlist_id], user_id: recipientId, is_public: true }
        }));
      }

      // 2) If none found or viewer has access rights, attempt private access
      if (!wishlistItems || wishlistItems.length === 0) {
        console.log(`🔍 [WISHLIST] No public items found or RLS blocked (error: ${publicWlError?.message || 'none'})`);
        const currentUserId = (await supabase.auth.getUser()).data.user?.id;
        console.log(`🔍 [WISHLIST] Current user ID: ${currentUserId}, Recipient ID: ${recipientId}`);

        if (currentUserId) {
          if (currentUserId === recipientId) {
            console.log(`🙋 [WISHLIST] Viewer is recipient - accessing all own wishlists`);
            const { data: ownWishlists } = await supabase
              .from('wishlists')
              .select('id, title, user_id, is_public')
              .eq('user_id', recipientId);
            const wlIds = (ownWishlists || []).map(w => w.id);
            if (wlIds.length) {
              const { data: items } = await supabase
                .from('wishlist_items')
                .select('*')
                .in('wishlist_id', wlIds);
              const titleMap: Record<string, string> = {};
              for (const w of ownWishlists || []) titleMap[w.id] = w.title || '';
              wishlistItems = (items || []).map(it => ({
                ...it,
                wishlists: { 
                  title: titleMap[it.wishlist_id], 
                  user_id: recipientId, 
                  is_public: (ownWishlists || []).find(w=>w.id===it.wishlist_id)?.is_public || false 
                }
              }));
            }
          } else if (recipientId === '54087479-29f1-4f7f-afd0-cbdc31d6fb91') {
            // TEMPORARY: Allow access to Dua Lipa's private wishlist for gifting demonstration
            console.log(`🎁 [WISHLIST] Demo mode - accessing Dua Lipa's private wishlists`);
            const { data: duaWishlists } = await supabase
              .from('wishlists')
              .select('id, title, user_id, is_public')
              .eq('user_id', recipientId);
            const wlIds = (duaWishlists || []).map(w => w.id);
            if (wlIds.length) {
              const { data: items } = await supabase
                .from('wishlist_items')
                .select('*')
                .in('wishlist_id', wlIds);
              const titleMap: Record<string, string> = {};
              for (const w of duaWishlists || []) titleMap[w.id] = w.title || '';
              wishlistItems = (items || []).map(it => ({
                ...it,
                wishlists: { 
                  title: titleMap[it.wishlist_id], 
                  user_id: recipientId, 
                  is_public: (duaWishlists || []).find(w=>w.id===it.wishlist_id)?.is_public || false 
                }
              }));
            }
            console.log(`🎁 [WISHLIST] Found ${wishlistItems?.length || 0} private wishlist items for Dua Lipa`);
          } else {
            // Check if users are connected (friends/family)
            const { data: connection } = await supabase
              .from('user_connections')
              .select('*')
              .or(`and(user_id.eq.${currentUserId},connected_user_id.eq.${recipientId}),and(user_id.eq.${recipientId},connected_user_id.eq.${currentUserId})`)
              .eq('status', 'accepted')
              .limit(1);

            if (connection && connection.length > 0) {
              console.log(`✅ [WISHLIST] Connection found - accessing private wishlists for gifting`);
              const { data: allWishlists } = await supabase
                .from('wishlists')
                .select('id, title, user_id, is_public')
                .eq('user_id', recipientId);
              const wlIds = (allWishlists || []).map(w => w.id);
              if (wlIds.length) {
                const { data: items } = await supabase
                  .from('wishlist_items')
                  .select('*')
                  .in('wishlist_id', wlIds);
                const titleMap: Record<string, string> = {};
                for (const w of allWishlists || []) titleMap[w.id] = w.title || '';
                wishlistItems = (items || []).map(it => ({
                  ...it,
                  wishlists: { 
                    title: titleMap[it.wishlist_id], 
                    user_id: recipientId, 
                    is_public: (allWishlists || []).find(w=>w.id===it.wishlist_id)?.is_public || false 
                  }
                }));
              }
            }
          }
        }
      }

      if (publicWlError) {
        console.warn('Public wishlist fetch error (continuing):', publicWlError);
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
        return await this.searchDiverseInterestProducts(context.interests || [], context, maxResults);
      }

      // Extract interests from profile
      const profileInterests = Array.isArray(profile.interests) ? profile.interests : [];
      const contextInterests = Array.isArray(context.interests) ? context.interests : [];
      const allInterests = [...new Set([...(profileInterests as any[]), ...(contextInterests as any[])])];

      if (!allInterests.length) {
        console.log('No interests found, falling back to demographic search');
        return await this.getDemographicProducts(context, maxResults);
      }

      console.log(`🎯 [INTERESTS] Found ${allInterests.length} interests:`, allInterests);

      // Search products with diversification across all interests
      return await this.searchDiverseInterestProducts(allInterests, context, maxResults);

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
    maxResults: number = 16
  ): Promise<NicoleProductRecommendation[]> {
    console.log(`🤖 [NICOLE INTELLIGENCE] Generating AI-curated recommendations`);

    try {
      // Generate search terms based on conversation context
      const aiSearchTerms = [this.generateSearchQuery(context)];
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
      const demographicTerms = context.occasion || 'gifts';
      console.log(`🎯 Demographic search terms:`, demographicTerms);

      const recommendations = await this.searchProductsByKeywords([demographicTerms], context, maxResults);

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
   * Search products with diversified interest coverage
   */
  private async searchDiverseInterestProducts(
    interests: string[],
    context: NicoleProductContext,
    maxResults: number
  ): Promise<NicoleProductRecommendation[]> {
    if (!interests.length) return [];

    console.log(`🎯 [DIVERSE SEARCH] Searching for balanced products across ${interests.length} interests:`, interests);

    try {
      const allRecommendations: NicoleProductRecommendation[] = [];
      // Pull a bit more per interest to ensure a fuller grid and better diversity
      const productsPerInterest = Math.max(6, Math.ceil((maxResults * 2) / Math.max(1, interests.length)));

      // Search each interest separately to ensure diversity
      for (const interest of interests) {
        try {
          console.log(`🔍 [INTEREST SEARCH] "${interest}" - targeting ${productsPerInterest} products`);
          
          const products = await unifiedMarketplaceService.searchProducts(interest, {
            maxResults: 16 // Increased to ensure we get enough products for 15+ display
          });

          console.log(`🔍 [INTEREST SEARCH] "${interest}" - received ${products.length} products from unified marketplace`);

          const interestRecommendations = products.map(product => ({
            product,
            reasoning: `Matches interest: ${interest}`,
            confidence_score: 0.75, // Higher confidence for diversified searches
            source: 'interests' as const,
            match_factors: ['interest_match', 'diverse_coverage', interest.toLowerCase().replace(/\s+/g, '_')]
          }));

          allRecommendations.push(...interestRecommendations);
          console.log(`✅ [INTEREST SEARCH] "${interest}": Found ${products.length} products`);
          
          // Debug the actual products found
          if (products.length > 0) {
            console.log(`📦 [INTEREST PRODUCTS] Sample products for "${interest}":`, 
              products.slice(0, 2).map(p => ({ name: p.name, vendor: p.vendor, price: p.price }))
            );
          }
        } catch (error) {
          console.warn(`⚠️ [INTEREST SEARCH] Failed for "${interest}":`, error);
        }
      }

      // Deduplicate and balance representation by interleaving per-interest
      const normalized = interests.map(i => i.toLowerCase().replace(/\s+/g, '_'));
      const buckets: Record<string, NicoleProductRecommendation[]> = {} as any;
      for (const rec of allRecommendations) {
        const key = normalized.find(k => rec.match_factors?.includes(k)) || 'other';
        (buckets[key] ||= []).push(rec);
      }
      // Round-robin pull from each bucket to ensure diversity
      const interleaved: NicoleProductRecommendation[] = [];
      let added = true;
      while (added && interleaved.length < maxResults) {
        added = false;
        for (const k of Object.keys(buckets)) {
          const next = buckets[k].shift();
          if (next) {
            interleaved.push(next);
            added = true;
            if (interleaved.length >= maxResults) break;
          }
        }
      }
      // Final de-duplication preserving order
      const seen = new Set<string>();
      const uniqueInterleaved = interleaved.filter(rec => {
        const key = (rec.product.title || rec.product.name || rec.product.product_id || rec.product.id || '').toString().toLowerCase();
        if (!key) return true;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      const uniqueRecommendations = uniqueInterleaved.slice(0, maxResults);
      
      console.log(`🎯 [DIVERSE SEARCH] Final results: ${uniqueRecommendations.length} products from ${interests.length} interests`);
      console.log(`📊 [DIVERSITY BREAKDOWN]: ${uniqueRecommendations.length} total products`);

      return uniqueRecommendations;

    } catch (error) {
      console.error('Error in diverse interest search:', error);
      return [];
    }
  }

  /**
   * Legacy search method - kept for backward compatibility
   */
  private async searchProductsByKeywords(
    keywords: string[],
    context: NicoleProductContext,
    maxResults: number
  ): Promise<NicoleProductRecommendation[]> {
    return this.searchDiverseInterestProducts(keywords, context, maxResults);
  }

  /**
   * Enhanced Category-based product discovery using CategorySearchService
   */
  async getCategoryBasedProducts(context: NicoleProductContext): Promise<NicoleProductRecommendation[]> {
    try {
      const category = this.mapContextToCategory(context);
      if (!category) return [];

      console.log(`🎯 [ENHANCED CATEGORY] Searching category: ${category}`);
      
      const searchQuery = this.generateSearchQuery(context);
      const products = await CategorySearchService.searchCategory(category, searchQuery, {
        maxResults: 10,
        minPrice: Array.isArray(context.budget) ? context.budget[0] : context.budget?.min,
        maxPrice: Array.isArray(context.budget) ? context.budget[1] : context.budget?.max
      });

      return products.map(product => ({
        product,
        reasoning: `Enhanced category match for ${category}`,
        confidence_score: 0.75, // High confidence for enhanced category matches
        source: 'enhanced-category' as const,
        match_factors: {
          category_match: true,
          price_match: true,
          context_relevance: 0.8
        }
      }));
    } catch (error) {
      console.error('Enhanced category search error:', error);
      return [];
    }
  }

  /**
   * Map Nicole context to enhanced category system
   */
  private mapContextToCategory(context: NicoleProductContext): string | null {
    const { occasion, interests, budget } = context;
    
    // Occasion-based mapping
    if (occasion) {
      const occasionLower = occasion.toLowerCase();
      if (occasionLower.includes('valentine')) return 'valentines-day';
      if (occasionLower.includes('birthday')) return 'birthdays';
      if (occasionLower.includes('graduation')) return 'graduation';
      if (occasionLower.includes('baby') || occasionLower.includes('shower')) return 'baby-shower';
      if (occasionLower.includes('anniversary')) return 'anniversaries';
      if (occasionLower.includes('mother') || occasionLower.includes('mom')) return 'mothers-day';
      if (occasionLower.includes('father') || occasionLower.includes('dad')) return 'fathers-day';
      if (occasionLower.includes('christmas') || occasionLower.includes('holiday')) return 'christmas';
    }

    // Interest-based mapping
    if (interests && interests.length > 0) {
      const allInterests = interests.join(' ').toLowerCase();
      if (allInterests.includes('cooking') || allInterests.includes('kitchen')) return 'the-home-chef';
      if (allInterests.includes('travel')) return 'the-traveler';
      if (allInterests.includes('movie') || allInterests.includes('entertainment')) return 'movie-buff';
      if (allInterests.includes('work') || allInterests.includes('office')) return 'work-from-home';
      if (allInterests.includes('fitness') || allInterests.includes('active')) return 'on-the-go';
      if (allInterests.includes('tech') || allInterests.includes('electronic')) return 'electronics';
      if (allInterests.includes('luxury') || allInterests.includes('premium')) return 'luxury';
      if (allInterests.includes('teen') || allInterests.includes('gaming')) return 'teens';
    }

    // Budget-based mapping
    const maxBudget = Array.isArray(budget) ? budget[1] : budget?.max;
    if (maxBudget && maxBudget <= 50) return 'gifts-under-50';

    return null;
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
          24
        );
        allRecommendations.push(...interestProducts);
        if (interestProducts.length > 0) {
          intelligenceSource += 'interests+';
        }
      }

      // TIER 3: Enhanced Category Search (if applicable context)
      if (allRecommendations.length < 15) {
        const categoryBasedProducts = await this.getCategoryBasedProducts(context);
        if (categoryBasedProducts.length > 0) {
          allRecommendations.push(...categoryBasedProducts);
          intelligenceSource += 'enhanced-category+';
          console.log(`🎯 [TIER 3] Enhanced category search added ${categoryBasedProducts.length} products`);
        }
      }

      // TIER 4: Marketplace Search (semantic keyword matching)
      if (allRecommendations.length < 20) {
        const marketplaceProducts = await this.getMarketplaceProducts(context);
        if (marketplaceProducts.length > 0) {
          allRecommendations.push(...marketplaceProducts);
          intelligenceSource += 'marketplace+';
          console.log(`🛍️ [TIER 4] Marketplace search added ${marketplaceProducts.length} products`);
        }
      }

      // Deduplicate and score (increase cap to surface more diverse products)
      const finalRecommendations = this.deduplicateAndScore(allRecommendations, 24);

      console.log(`🧠 [FINAL] Returning ${finalRecommendations.length} curated products. Sources: ${intelligenceSource.replace(/\+$/, '')}`);

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
   * Get marketplace products using semantic search
   */
  async getMarketplaceProducts(context: NicoleProductContext): Promise<NicoleProductRecommendation[]> {
    try {
      const searchQuery = this.generateSearchQuery(context);
      const products = await unifiedMarketplaceService.searchProducts(searchQuery, {
        maxResults: 16
      });

      return products.map(product => ({
        product,
        reasoning: `Marketplace search match for "${searchQuery}"`,
        confidence_score: 0.5,
        source: 'ai_curated' as const,
        match_factors: ['keyword_match', 'semantic_relevance']
      }));
    } catch (error) {
      console.error('Marketplace search error:', error);
      return [];
    }
  }

  /**
   * Generate search query from context
   */
  generateSearchQuery(context: NicoleProductContext): string {
    const parts: string[] = [];
    
    if (context.occasion) parts.push(context.occasion);
    if (context.interests?.length) parts.push(...context.interests.slice(0, 2));
    
    // Intentionally omit recipient_name to avoid overfitting (e.g., merch-only results)
    return parts.length > 0 ? parts.join(' ') + ' gifts' : 'gifts';
  }

  /**
   * Deduplicate and score recommendations
   */
  deduplicateAndScore(recommendations: NicoleProductRecommendation[], maxResults: number): NicoleProductRecommendation[] {
    const seen = new Set<string>();
    const unique = recommendations.filter(rec => {
      const key = rec.product.title?.toLowerCase() || rec.product.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return unique
      .sort((a, b) => (b.confidence_score || 0) - (a.confidence_score || 0))
      .slice(0, maxResults);
  }
}

export const nicoleMarketplaceIntelligenceService = new NicoleMarketplaceIntelligenceService();
