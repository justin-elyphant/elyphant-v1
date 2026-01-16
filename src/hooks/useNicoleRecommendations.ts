import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useUserSearchHistory } from "@/hooks/useUserSearchHistory";
import { useNicoleTagIntegration } from "@/hooks/useNicoleTagIntegration";

interface RecommendationProduct {
  product_id: string;
  title: string;
  price: number;
  image: string;
  main_image?: string;
  images?: string[];
  brand?: string;
  category?: string;
  retailer?: string;
  stars?: number;
  rating?: number;
  review_count?: number;
  num_reviews?: number;
  view_count?: number;
  isBestSeller?: boolean;
  badgeText?: string;
  matchReason?: string;
  score?: number;
  metadata?: any;
}

interface RecommendationSections {
  searchBased: RecommendationProduct[];
  viewedBased: RecommendationProduct[];
  tagBased: RecommendationProduct[];
  trending: RecommendationProduct[];
}

interface RecommendationStats {
  cacheHits: number;
  cacheMisses: number;
  totalCandidates: number;
  uniqueProducts: number;
}

interface NicoleRecommendationsResult {
  products: RecommendationProduct[];
  sections: RecommendationSections;
  isLoading: boolean;
  error: string | null;
  stats: RecommendationStats | null;
  lastFetchedAt: Date | null;
  refreshRecommendations: () => void;
}

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

// Local cache to avoid excessive API calls
let cachedResult: {
  products: RecommendationProduct[];
  sections: RecommendationSections;
  stats: RecommendationStats;
  timestamp: number;
  contextHash: string;
} | null = null;

// Create a hash of the user context to detect changes
function createContextHash(
  userId: string | undefined,
  searches: string[],
  viewedIds: string[],
  tags: string[]
): string {
  return `${userId || 'anon'}-${searches.slice(0, 3).join(',')}-${viewedIds.slice(0, 5).join(',')}-${tags.slice(0, 5).join(',')}`;
}

export function useNicoleRecommendations(): NicoleRecommendationsResult {
  const { user } = useAuth();
  const { recentlyViewed } = useRecentlyViewed();
  const { recentSearches } = useUserSearchHistory();
  const { getUserTagInsights } = useNicoleTagIntegration();

  const [products, setProducts] = useState<RecommendationProduct[]>([]);
  const [sections, setSections] = useState<RecommendationSections>({
    searchBased: [],
    viewedBased: [],
    tagBased: [],
    trending: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<RecommendationStats | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);

  // Extract wishlist tags from user insights
  const wishlistTags = useMemo(() => {
    const insights = getUserTagInsights;
    return [
      ...insights.commonTags.slice(0, 5).map((t: any) => t.tag),
      ...insights.preferredCategories.slice(0, 3).map((c: any) => c.category)
    ].filter(Boolean);
  }, [getUserTagInsights]);

  // Extract recently viewed product IDs
  const recentlyViewedIds = useMemo(() => {
    return recentlyViewed
      .map(item => item.id || item.product_id)
      .filter(Boolean)
      .slice(0, 10);
  }, [recentlyViewed]);

  // Current context hash
  const contextHash = useMemo(() => {
    return createContextHash(
      user?.id,
      recentSearches,
      recentlyViewedIds,
      wishlistTags
    );
  }, [user?.id, recentSearches, recentlyViewedIds, wishlistTags]);

  const fetchRecommendations = useCallback(async (forceRefresh = false) => {
    // Check cache first
    if (!forceRefresh && cachedResult) {
      const now = Date.now();
      const cacheAge = now - cachedResult.timestamp;
      
      // Use cache if it's fresh and context hasn't changed
      if (cacheAge < CACHE_TTL && cachedResult.contextHash === contextHash) {
        console.log('📦 Using cached Nicole recommendations');
        setProducts(cachedResult.products);
        setSections(cachedResult.sections);
        setStats(cachedResult.stats);
        setLastFetchedAt(new Date(cachedResult.timestamp));
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔄 Fetching Nicole recommendations...', {
        hasSearches: recentSearches.length > 0,
        hasViewed: recentlyViewedIds.length > 0,
        hasTags: wishlistTags.length > 0
      });

      const { data, error: invokeError } = await supabase.functions.invoke('nicole-recommendations', {
        body: {
          userId: user?.id,
          recentSearches: recentSearches.slice(0, 5),
          recentlyViewedIds: recentlyViewedIds,
          wishlistTags: wishlistTags,
          limit: 16
        }
      });

      if (invokeError) {
        throw new Error(invokeError.message || 'Failed to fetch recommendations');
      }

      if (data && data.success) {
        const fetchedProducts = data.products || [];
        const fetchedSections = data.sections || {
          searchBased: [],
          viewedBased: [],
          tagBased: [],
          trending: []
        };
        const fetchedStats = data.stats || null;

        // Update state
        setProducts(fetchedProducts);
        setSections(fetchedSections);
        setStats(fetchedStats);
        setLastFetchedAt(new Date());

        // Update cache
        cachedResult = {
          products: fetchedProducts,
          sections: fetchedSections,
          stats: fetchedStats,
          timestamp: Date.now(),
          contextHash
        };

        console.log('✅ Nicole recommendations loaded:', {
          total: fetchedProducts.length,
          sections: {
            searchBased: fetchedSections.searchBased.length,
            viewedBased: fetchedSections.viewedBased.length,
            tagBased: fetchedSections.tagBased.length,
            trending: fetchedSections.trending.length
          }
        });
      } else {
        throw new Error(data?.error || 'Unknown error');
      }
    } catch (err) {
      console.error('❌ Nicole recommendations error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load recommendations');
      
      // On error, try to use stale cache if available
      if (cachedResult) {
        console.log('📦 Using stale cache after error');
        setProducts(cachedResult.products);
        setSections(cachedResult.sections);
        setStats(cachedResult.stats);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, recentSearches, recentlyViewedIds, wishlistTags, contextHash]);

  // Initial fetch when context is ready
  useEffect(() => {
    // Wait a brief moment for context to stabilize
    const timeoutId = setTimeout(() => {
      fetchRecommendations();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [fetchRecommendations]);

  const refreshRecommendations = useCallback(() => {
    fetchRecommendations(true);
  }, [fetchRecommendations]);

  return {
    products,
    sections,
    isLoading,
    error,
    stats,
    lastFetchedAt,
    refreshRecommendations
  };
}
