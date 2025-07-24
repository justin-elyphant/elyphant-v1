import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";

export interface ProductAnalyticsEvent {
  product_id: string;
  event_type: 'view' | 'click' | 'add_to_cart' | 'purchase' | 'wishlist';
  event_data?: Record<string, any>;
  source?: string;
  session_id?: string;
}

export interface UserInteractionEvent {
  event_type: 'search' | 'filter' | 'sort' | 'page_view' | 'session_start';
  event_data: Record<string, any>;
  page_url?: string;
  referrer?: string;
  session_id?: string;
}

export interface PopularityScore {
  product_id: string;
  zinc_score: number;
  customer_score: number;
  engagement_score: number;
  purchase_score: number;
  trending_score: number;
  final_score: number;
}

/**
 * Customer Analytics Service
 * Integrates with existing unified systems to track user behavior and product popularity
 */
class CustomerAnalyticsService {
  private sessionId: string;
  private userId: string | null = null;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeAuth();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async initializeAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    this.userId = user?.id || null;
  }

  /**
   * Track product analytics events
   */
  async trackProductEvent(event: ProductAnalyticsEvent): Promise<boolean> {
    try {
      if (!this.userId) {
        console.log('Analytics: User not authenticated, skipping product event tracking');
        return false;
      }

      const { error } = await supabase
        .from('product_analytics')
        .insert({
          user_id: this.userId,
          product_id: event.product_id,
          event_type: event.event_type,
          event_data: event.event_data || {},
          source: event.source || 'web',
          session_id: event.session_id || this.sessionId
        });

      if (error) {
        console.error('Analytics: Failed to track product event:', error);
        return false;
      }

      console.log(`Analytics: Tracked ${event.event_type} for product ${event.product_id}`);
      return true;
    } catch (error) {
      console.error('Analytics: Error tracking product event:', error);
      return false;
    }
  }

  /**
   * Track user interaction events
   */
  async trackUserInteraction(event: UserInteractionEvent): Promise<boolean> {
    try {
      if (!this.userId) {
        console.log('Analytics: User not authenticated, skipping interaction tracking');
        return false;
      }

      const { error } = await supabase
        .from('user_interaction_events')
        .insert({
          user_id: this.userId,
          event_type: event.event_type,
          event_data: event.event_data,
          page_url: event.page_url || window.location.href,
          referrer: event.referrer || document.referrer,
          user_agent: navigator.userAgent,
          session_id: event.session_id || this.sessionId
        });

      if (error) {
        console.error('Analytics: Failed to track user interaction:', error);
        return false;
      }

      console.log(`Analytics: Tracked ${event.event_type} interaction`);
      return true;
    } catch (error) {
      console.error('Analytics: Error tracking user interaction:', error);
      return false;
    }
  }

  /**
   * Track product view (integrates with existing useRecentlyViewed)
   */
  async trackProductView(product: Product): Promise<boolean> {
    return this.trackProductEvent({
      product_id: product.product_id || product.id || '',
      event_type: 'view',
      event_data: {
        title: product.title || product.name,
        price: product.price,
        category: product.category || product.category_name,
        brand: product.brand,
        image: product.image
      }
    });
  }

  /**
   * Track search behavior (integrates with existing search services)
   */
  async trackSearch(searchTerm: string, resultCount: number, filters?: Record<string, any>): Promise<boolean> {
    return this.trackUserInteraction({
      event_type: 'search',
      event_data: {
        search_term: searchTerm,
        result_count: resultCount,
        filters: filters || {},
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Track purchase completion (integrates with payment service)
   */
  async trackPurchase(
    productId: string, 
    quantity: number, 
    unitPrice: number, 
    totalPrice: number,
    orderId?: string,
    source: 'direct' | 'wishlist' | 'recommendation' = 'direct'
  ): Promise<boolean> {
    try {
      if (!this.userId) {
        console.log('Analytics: User not authenticated, skipping purchase tracking');
        return false;
      }

      // Track both product event and purchase analytics
      await Promise.all([
        this.trackProductEvent({
          product_id: productId,
          event_type: 'purchase',
          event_data: {
            quantity,
            unit_price: unitPrice,
            total_price: totalPrice,
            order_id: orderId,
            source
          }
        }),
        supabase.from('purchase_analytics').insert({
          user_id: this.userId,
          product_id: productId,
          order_id: orderId,
          quantity,
          unit_price: unitPrice,
          total_price: totalPrice,
          purchase_source: source,
          conversion_path: {
            session_id: this.sessionId,
            timestamp: new Date().toISOString()
          }
        })
      ]);

      console.log(`Analytics: Tracked purchase for product ${productId}`);
      return true;
    } catch (error) {
      console.error('Analytics: Error tracking purchase:', error);
      return false;
    }
  }

  /**
   * Get popularity scores for products
   */
  async getPopularityScores(productIds: string[]): Promise<Record<string, PopularityScore>> {
    try {
      const { data, error } = await supabase
        .from('popularity_scores')
        .select('*')
        .in('product_id', productIds);

      if (error) {
        console.error('Analytics: Failed to get popularity scores:', error);
        return {};
      }

      const scores: Record<string, PopularityScore> = {};
      data?.forEach(score => {
        scores[score.product_id] = score;
      });

      return scores;
    } catch (error) {
      console.error('Analytics: Error getting popularity scores:', error);
      return {};
    }
  }

  /**
   * Calculate hybrid badge data combining Zinc API + customer data
   */
  async getHybridBadgeData(product: Product): Promise<{
    isBestSeller: boolean;
    isPopular: boolean;
    isTrending: boolean;
    popularityScore: number;
    badgeText?: string;
  }> {
    try {
      const productId = product.product_id || product.id || '';
      const scores = await this.getPopularityScores([productId]);
      const productScore = scores[productId];

      // Combine Zinc API data with customer analytics
      const zincBestSeller = product.isBestSeller || 
        product.bestSellerType === 'best_seller' || 
        product.bestSellerType === 'amazon_choice';

      const customerPopular = productScore?.final_score > 50; // Threshold for "popular"
      const trending = productScore?.trending_score > 10; // Threshold for "trending"

      return {
        isBestSeller: zincBestSeller || (productScore?.final_score > 70),
        isPopular: customerPopular,
        isTrending: trending,
        popularityScore: productScore?.final_score || 0,
        badgeText: this.determineBadgeText(product, productScore)
      };
    } catch (error) {
      console.error('Analytics: Error calculating hybrid badge data:', error);
      return {
        isBestSeller: product.isBestSeller || false,
        isPopular: false,
        isTrending: false,
        popularityScore: 0
      };
    }
  }

  private determineBadgeText(product: Product, score?: PopularityScore): string | undefined {
    // Prioritize Zinc API badges
    if (product.badgeText) return product.badgeText;
    
    // Use customer analytics for dynamic badges
    if (score?.final_score > 80) return "Most Popular";
    if (score?.trending_score > 15) return "Trending Now";
    if (score?.customer_score > 30) return "Customer Favorite";
    
    // Fallback to Zinc API indicators
    if (product.bestSellerType === 'amazon_choice') return "Amazon's Choice";
    if (product.bestSellerType === 'best_seller') return "Best Seller";
    if (product.isBestSeller) return "Best Seller";
    
    return undefined;
  }

  /**
   * Update Zinc scores for products (called when new Zinc data is fetched)
   */
  async updateZincScores(products: Product[]): Promise<void> {
    try {
      const updates = products.map(product => {
        const productId = product.product_id || product.id || '';
        let zincScore = 0;

        // Calculate Zinc score based on Amazon indicators
        if (product.bestSellerType === 'amazon_choice') zincScore += 30;
        if (product.bestSellerType === 'best_seller') zincScore += 25;
        if (product.isBestSeller) zincScore += 20;
        if (product.prime) zincScore += 5;
        if (product.rating && product.rating > 4) zincScore += 10;
        if (product.num_reviews && product.num_reviews > 100) zincScore += 10;

        return {
          product_id: productId,
          zinc_score: zincScore,
          last_calculated: new Date().toISOString()
        };
      });

      // Batch upsert popularity scores
      const { error } = await supabase
        .from('popularity_scores')
        .upsert(updates, { onConflict: 'product_id' });

      if (error) {
        console.error('Analytics: Failed to update Zinc scores:', error);
      } else {
        console.log(`Analytics: Updated Zinc scores for ${updates.length} products`);
      }
    } catch (error) {
      console.error('Analytics: Error updating Zinc scores:', error);
    }
  }

  /**
   * Get analytics summary for admin dashboard
   */
  async getAnalyticsSummary(timeframe: 'day' | 'week' | 'month' = 'week') {
    try {
      const timeAgo = new Date();
      switch (timeframe) {
        case 'day':
          timeAgo.setDate(timeAgo.getDate() - 1);
          break;
        case 'week':
          timeAgo.setDate(timeAgo.getDate() - 7);
          break;
        case 'month':
          timeAgo.setMonth(timeAgo.getMonth() - 1);
          break;
      }

      const [
        { data: productViews },
        { data: searches },
        { data: purchases }
      ] = await Promise.all([
        supabase
          .from('product_analytics')
          .select('*')
          .eq('event_type', 'view')
          .gte('created_at', timeAgo.toISOString()),
        supabase
          .from('user_interaction_events')
          .select('*')
          .eq('event_type', 'search')
          .gte('created_at', timeAgo.toISOString()),
        supabase
          .from('purchase_analytics')
          .select('*')
          .gte('created_at', timeAgo.toISOString())
      ]);

      return {
        totalViews: productViews?.length || 0,
        totalSearches: searches?.length || 0,
        totalPurchases: purchases?.length || 0,
        totalRevenue: purchases?.reduce((sum, p) => sum + (p.total_price || 0), 0) || 0,
        timeframe
      };
    } catch (error) {
      console.error('Analytics: Error getting analytics summary:', error);
      return {
        totalViews: 0,
        totalSearches: 0,
        totalPurchases: 0,
        totalRevenue: 0,
        timeframe
      };
    }
  }
}

// Export singleton instance
export const customerAnalyticsService = new CustomerAnalyticsService();