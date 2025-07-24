import { useEffect, useCallback } from "react";
import { customerAnalyticsService } from "@/services/analytics/customerAnalyticsService";
import { Product } from "@/types/product";
import { useAuth } from "@/contexts/auth";

/**
 * Custom hook for customer analytics integration
 * Provides easy access to analytics tracking methods
 */
export const useCustomerAnalytics = () => {
  const { user } = useAuth();

  // Initialize analytics session when user changes
  useEffect(() => {
    if (user) {
      // Track session start
      customerAnalyticsService.trackUserInteraction({
        event_type: 'session_start',
        event_data: {
          user_id: user.id,
          timestamp: new Date().toISOString()
        }
      });
    }
  }, [user?.id]);

  // Track product view with error handling
  const trackProductView = useCallback(async (product: Product) => {
    try {
      await customerAnalyticsService.trackProductView(product);
    } catch (error) {
      console.error('Analytics: Failed to track product view:', error);
    }
  }, []);

  // Track search with results
  const trackSearch = useCallback(async (searchTerm: string, resultCount: number, filters?: Record<string, any>) => {
    try {
      await customerAnalyticsService.trackSearch(searchTerm, resultCount, filters);
    } catch (error) {
      console.error('Analytics: Failed to track search:', error);
    }
  }, []);

  // Track product click/interaction
  const trackProductClick = useCallback(async (product: Product, source = 'product_card') => {
    try {
      await customerAnalyticsService.trackProductEvent({
        product_id: product.product_id || product.id || '',
        event_type: 'click',
        event_data: {
          source,
          title: product.title || product.name,
          price: product.price,
          category: product.category || product.category_name
        }
      });
    } catch (error) {
      console.error('Analytics: Failed to track product click:', error);
    }
  }, []);

  // Track add to cart
  const trackAddToCart = useCallback(async (product: Product, quantity = 1) => {
    try {
      await customerAnalyticsService.trackProductEvent({
        product_id: product.product_id || product.id || '',
        event_type: 'add_to_cart',
        event_data: {
          quantity,
          title: product.title || product.name,
          price: product.price,
          total_value: product.price * quantity
        }
      });
    } catch (error) {
      console.error('Analytics: Failed to track add to cart:', error);
    }
  }, []);

  // Track wishlist addition
  const trackWishlistAdd = useCallback(async (product: Product) => {
    try {
      await customerAnalyticsService.trackProductEvent({
        product_id: product.product_id || product.id || '',
        event_type: 'wishlist',
        event_data: {
          title: product.title || product.name,
          price: product.price
        }
      });
    } catch (error) {
      console.error('Analytics: Failed to track wishlist add:', error);
    }
  }, []);

  // Track purchase completion
  const trackPurchase = useCallback(async (
    productId: string,
    quantity: number,
    unitPrice: number,
    totalPrice: number,
    orderId?: string,
    source: 'direct' | 'wishlist' | 'recommendation' = 'direct'
  ) => {
    try {
      await customerAnalyticsService.trackPurchase(productId, quantity, unitPrice, totalPrice, orderId, source);
    } catch (error) {
      console.error('Analytics: Failed to track purchase:', error);
    }
  }, []);

  // Track page view
  const trackPageView = useCallback(async (pageUrl: string, eventData?: Record<string, any>) => {
    try {
      await customerAnalyticsService.trackUserInteraction({
        event_type: 'page_view',
        event_data: {
          page_url: pageUrl,
          timestamp: new Date().toISOString(),
          ...eventData
        },
        page_url: pageUrl
      });
    } catch (error) {
      console.error('Analytics: Failed to track page view:', error);
    }
  }, []);

  // Get hybrid badge data for a product
  const getHybridBadgeData = useCallback(async (product: Product) => {
    try {
      return await customerAnalyticsService.getHybridBadgeData(product);
    } catch (error) {
      console.error('Analytics: Failed to get hybrid badge data:', error);
      return {
        isBestSeller: product.isBestSeller || false,
        isPopular: false,
        isTrending: false,
        popularityScore: 0
      };
    }
  }, []);

  // Update Zinc scores for products (for when new product data is fetched)
  const updateZincScores = useCallback(async (products: Product[]) => {
    try {
      await customerAnalyticsService.updateZincScores(products);
    } catch (error) {
      console.error('Analytics: Failed to update Zinc scores:', error);
    }
  }, []);

  // Get analytics summary (for admin/dashboard use)
  const getAnalyticsSummary = useCallback(async (timeframe: 'day' | 'week' | 'month' = 'week') => {
    try {
      return await customerAnalyticsService.getAnalyticsSummary(timeframe);
    } catch (error) {
      console.error('Analytics: Failed to get analytics summary:', error);
      return {
        totalViews: 0,
        totalSearches: 0,
        totalPurchases: 0,
        totalRevenue: 0,
        timeframe
      };
    }
  }, []);

  return {
    trackProductView,
    trackSearch,
    trackProductClick,
    trackAddToCart,
    trackWishlistAdd,
    trackPurchase,
    trackPageView,
    getHybridBadgeData,
    updateZincScores,
    getAnalyticsSummary,
    isAnalyticsEnabled: !!user
  };
};