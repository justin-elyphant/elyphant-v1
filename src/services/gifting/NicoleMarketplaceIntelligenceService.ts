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
 * Architecture: Database-First Product Catalog (Phase 2 Consolidation)
 * - Uses ProductCatalogService for all product operations
 * - Database (products table) is the cache layer
 * - Zinc API fallback via Edge Functions
 * 
 * ⚠️ CRITICAL FEATURES:
 * - Intelligent product filtering based on recipient data
 * - Hierarchical gift selection (Wishlist → Interests → AI → Demographic)
 * - Conversation context preservation for better recommendations
 * - Integration with ProductCatalogService (consolidated marketplace service)
 * 
 * 🔗 SYSTEM INTEGRATION:
 * - ProductCatalogService for marketplace queries
 * - useMarketplace hook for URL-driven state (UI layer)
 * - AIEnhancedSearchBar for conversational interface
 * - Auto-gifting rules and recipient data
 * - Gift recommendation and intelligence systems
 * 
 * Last update: 2025-12-05 (Phase 2.7 Documentation Sync)
 * ========================================================================
 */

import { Product } from "@/types/product";
import { productCatalogService } from "@/services/ProductCatalogService";
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
    

    try {
      let wishlistItems: any[] | null = null;

      // 0) Preferred path: RLS-safe RPC that enforces privacy internally
      try {
        const { data: rpcItems, error: rpcError } = await supabase
          .rpc('get_accessible_wishlist_items', { p_recipient_id: recipientId });

        

        if (rpcItems && rpcItems.length > 0) {
          wishlistItems = rpcItems.map((it: any) => ({
            ...it,
            wishlists: {
              title: it.wishlist_title,
              user_id: recipientId,
              is_public: !!it.is_public
            }
          }));
        }
      } catch (rpcCatch) {
        console.warn('⚠️ [WISHLIST RPC] Failed, will fall back to direct queries:', rpcCatch);
      }

      // 1) Fallback: public wishlists
      if (!wishlistItems || wishlistItems.length === 0) {
        // Two-step approach with RLS-friendly queries
        // 1) Fetch public wishlists for recipient
        const { data: publicWishlists, error: publicWlError } = await supabase
          .from('wishlists')
          .select('id, title, user_id, is_public')
          .eq('user_id', recipientId)
          .eq('is_public', true);

        // Fetch items for public wishlists if any
        if (publicWishlists && publicWishlists.length > 0) {
          const wlIds = publicWishlists.map(w => w.id);
          console.log(`🔍 [WISHLIST] Found ${publicWishlists.length} public wishlists, fetching items for:`, wlIds);
          const { data: items, error: itemsError } = await supabase
            .from('wishlist_items')
            .select('*')
            .in('wishlist_id', wlIds);
          console.log(`🔍 [WISHLIST] Public wishlist items query result:`, { itemsCount: items?.length || 0, error: itemsError?.message || 'none' });
          const titleMap: Record<string, string> = {};
          for (const w of publicWishlists) titleMap[w.id] = w.title || '';
          wishlistItems = (items || []).map(it => ({
            ...it,
            wishlists: { title: titleMap[it.wishlist_id], user_id: recipientId, is_public: true }
          }));
        } else if (publicWlError) {
          console.warn('Public wishlist fetch error (continuing):', publicWlError);
        }
      }

      // 2) Fallback: viewer has access rights (self, demo recipient, or accepted connection)
      if (!wishlistItems || wishlistItems.length === 0) {
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
              console.log(`🎁 [WISHLIST] Fetching items for ${wlIds.length} Dua Lipa wishlists:`, wlIds);
              const { data: items, error: itemsError } = await supabase
                .from('wishlist_items')
                .select('*')
                .in('wishlist_id', wlIds);
              console.log(`🎁 [WISHLIST] Dua Lipa wishlist items query result:`, { 
                itemsCount: items?.length || 0, 
                error: itemsError?.message || 'none',
                firstItem: items?.[0] ? { id: items[0].id, title: items[0].title || items[0].name, wishlist_id: items[0].wishlist_id } : null
              });
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
            console.log(`🎁 [WISHLIST] Final processed wishlist items for Dua Lipa:`, {
              count: wishlistItems?.length || 0,
              sampleItems: wishlistItems?.slice(0, 2).map(item => ({
                title: item.title || item.name,
                price: item.price,
                wishlist: item.wishlists?.title
              })) || []
            });
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

      const recommendations: NicoleProductRecommendation[] = [];

      console.log(`🔍 [WISHLIST] Processing ${wishlistItems?.length || 0} wishlist items into products...`);

      for (const item of wishlistItems || []) {
        console.log(`🔍 [WISHLIST] Processing item:`, {
          id: item.id,
          title: item.title || item.name,
          price: item.price,
          wishlist: item.wishlists?.title
        });

        // Parse product data from wishlist item
        const product: Product = {
          product_id: item.product_id || `wishlist_${item.id}`,
          name: item.title || item.name || 'Wishlist Item',
          title: item.title || item.name || 'Wishlist Item',
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
          if (budget.min && price < budget.min) {
            console.log(`💰 [WISHLIST] Skipping item due to min budget: ${price} < ${budget.min}`);
            continue;
          }
          if (budget.max && price > budget.max) {
            console.log(`💰 [WISHLIST] Skipping item due to max budget: ${price} > ${budget.max}`);
            continue;
          }
        }

        const recommendation = {
          product,
          reasoning: `This item is on ${item.wishlists?.title || 'their wishlist'}, indicating strong interest` ,
          confidence_score: 0.95, // Very high confidence for wishlist items
          source: 'wishlist' as const,
          match_factors: ['wishlist_item', 'high_interest', 'verified_desire']
        };

        recommendations.push(recommendation);
        console.log(`✅ [WISHLIST] Added recommendation:`, { title: product.title, price: product.price, confidence: recommendation.confidence_score });
      }

      console.log(`✅ [WISHLIST] Final wishlist recommendations:`, { count: recommendations.length, totalProcessed: wishlistItems?.length || 0 });
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

      

      // Search products with diversification across all interests
      return await this.searchDiverseInterestProducts(allInterests, context, maxResults);

    } catch (error) {
      console.error('Error in interest-based product search:', error);
      return [];
    }
  }

  /**
   * TIER 3: AI-curated recommendations using diverse, generic terms (NOT based on recipient interests)
   */
  private async getAICuratedProducts(
    context: NicoleProductContext,
    maxResults: number = 16
  ): Promise<NicoleProductRecommendation[]> {
    

    try {
      // Use DIVERSE, GENERIC search terms instead of interest-based ones
      // This ensures AI picks are different from interest-based recommendations
      const diverseSearchTerms = [
        'trending gifts',
        'popular items',
        'bestsellers',
        'gift ideas',
        'unique products',
        'premium gifts',
        'innovative gadgets',
        'lifestyle products'
      ];
      
      // Select random terms to ensure variety across different sessions
      const selectedTerms = diverseSearchTerms
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      
      

      // Search for products using diverse terms
      const recommendations = await this.searchProductsByKeywords(selectedTerms, context, maxResults);

      // Enhance recommendations with AI reasoning
      return recommendations.map(rec => ({
        ...rec,
        source: 'ai_curated' as const,
        reasoning: `AI curated trending gift perfect for ${context.relationship || 'someone special'}`,
        confidence_score: rec.confidence_score * 0.75, // Slightly lower confidence for diverse AI curation
        match_factors: [...rec.match_factors, 'ai_trending', 'diverse_selection', 'popular_choice']
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
    

    try {
      // Use generic search terms based on occasion and relationship
      const demographicTerms = context.occasion || 'gifts';
      

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

    try {
      const allRecommendations: NicoleProductRecommendation[] = [];
      const productsPerInterest = Math.max(8, Math.ceil((maxResults * 3) / Math.max(1, interests.length)));

      // Search each interest separately to ensure diversity
      for (const interest of interests) {
        try {
          const response = await productCatalogService.searchProducts(interest, {
            limit: 20
          });
          const products = response.products;

          const interestRecommendations = products.map(product => ({
            product,
            reasoning: `Matches interest: ${interest}`,
            confidence_score: 0.75,
            source: 'interests' as const,
            match_factors: ['interest_match', 'diverse_coverage', interest.toLowerCase().replace(/\s+/g, '_')]
          }));

          allRecommendations.push(...interestRecommendations);
        } catch (error) {
          console.warn(`Failed to search interest "${interest}":`, error);
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

      
      
      const searchQuery = this.generateSearchQuery(context);
      const response = await productCatalogService.searchProducts(searchQuery, {
        category,
        limit: 10,
        filters: {
          minPrice: Array.isArray(context.budget) ? context.budget[0] : context.budget?.min,
          maxPrice: Array.isArray(context.budget) ? context.budget[1] : context.budget?.max
        }
      });

      return response.products.map(product => ({
        product,
        reasoning: `Enhanced category match for ${category}`,
        confidence_score: 0.75,
        source: 'ai_curated' as const,
        match_factors: ['category_match', 'price_match', 'context_relevance']
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

      // TIER 2: Interest-based (if we have recipient or interests) - increased for 15+ products
      if (context.recipient_id || context.interests?.length) {
        const interestProducts = await this.getInterestBasedProducts(
          context.recipient_id || '', 
          context, 
          18 // Significantly increased to ensure 15+ products for interests section
        );
        allRecommendations.push(...interestProducts);
        if (interestProducts.length > 0) {
          intelligenceSource += 'interests+';
        }
      }

      // TIER 3: AI-curated recommendations - diverse, non-interest based  
      const aiProducts = await this.getAICuratedProducts(context, 18); // Increased to ensure 15+ AI picks
      allRecommendations.push(...aiProducts);
      if (aiProducts.length > 0) {
        intelligenceSource += 'ai-curated+';
        
      }

      // TIER 4: Enhanced Category Search (if applicable context)
      if (allRecommendations.length < 30) {
        const categoryBasedProducts = await this.getCategoryBasedProducts(context);
        if (categoryBasedProducts.length > 0) {
          allRecommendations.push(...categoryBasedProducts);
          intelligenceSource += 'enhanced-category+';
          
        }
      }

      // TIER 5: Marketplace Search (semantic keyword matching)
      if (allRecommendations.length < 40) {
        const marketplaceProducts = await this.getMarketplaceProducts(context);
        if (marketplaceProducts.length > 0) {
          allRecommendations.push(...marketplaceProducts);
          intelligenceSource += 'marketplace+';
          
        }
      }

      // Deduplicate and score (increase cap to surface more diverse products for 45+ total items)
      const finalRecommendations = this.deduplicateAndScore(allRecommendations, 50);

      

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
      const response = await productCatalogService.searchProducts(searchQuery, {
        limit: 16
      });

      return response.products.map(product => ({
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
