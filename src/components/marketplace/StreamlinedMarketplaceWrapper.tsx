
import React, { useState, useEffect, memo, useCallback, useMemo } from "react";
import { useMarketplace } from "@/hooks/useMarketplace";
import { useIsMobile } from "@/hooks/use-mobile";
import MarketplaceHeader from "./MarketplaceHeader";
import PopularBrands from "./PopularBrands";
import MarketplaceLandingHero from "./landing/MarketplaceLandingHero";
import CuratedCollectionTiles, { TILES } from "./landing/CuratedCollectionTiles";
import CategoryLandingHeader from "./landing/CategoryLandingHeader";
import LifeEventLandingPage from "./landing/LifeEventLandingPage";
import ShopByOccasion from "./landing/ShopByOccasion";
import CategoryBrowseGrid from "./landing/CategoryBrowseGrid";
import TrendingProductsSection from "./landing/TrendingProductsSection";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw, Search } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { productCatalogService } from "@/services/ProductCatalogService";

import MarketplaceHeroBanner from "./MarketplaceHeroBanner";
import BrandHeroSection from "./BrandHeroSection";
import CategoryHeroSection from "./CategoryHeroSection";
// useOptimizedProducts removed - using server-side pagination
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { getCategoryByValue } from "@/constants/categories";
import OptimizedProductGrid from "./components/OptimizedProductGrid";
import VirtualizedProductGrid from "./components/VirtualizedProductGrid";
import { batchDOMUpdates } from "@/utils/performanceOptimizations";
import { usePerformanceMonitoring } from "@/hooks/usePerformanceMonitoring";
// useOptimizedTouchInteractions removed - was blocking iOS native scrolling
import { useOptimizedIntersectionObserver } from "@/hooks/useOptimizedIntersectionObserver";

import { Sparkles } from "lucide-react";
import ProductGrid from "./product-grid/ProductGrid";
import AirbnbStyleProductCard from "./AirbnbStyleProductCard";
import AdvancedFiltersDrawer from "./AdvancedFiltersDrawer";
import FilterPills from "./FilterPills";
import { getCategoryDisplayNameFromSearchTerm, getCategoryDisplayNameFromValue, isCategorySearchTerm } from "@/utils/categoryDisplayMapper";
import SubCategoryTabs from "./SubCategoryTabs";
import DynamicDesktopFilterSidebar from "./filters/DynamicDesktopFilterSidebar";
import FilterSortRow from "./filters/FilterSortRow";
import LululemonMobileFilters from "./filters/LululemonMobileFilters";
import DynamicMobileFilterDrawer from "./filters/DynamicMobileFilterDrawer";
import FeaturedProductHero from "./FeaturedProductHero";
import ZeroResultsState from "./ZeroResultsState";



const StreamlinedMarketplaceWrapper = memo(() => {
  const {
    products,
    isLoading,
    error,
    urlState,
    cacheStats,
    totalCount: marketplaceTotalCount,
    zeroResults,
    suggestedQueries,
    fallbackProducts,
    fromCache,
    serverHasMore,
    search,
    executeSearch,
  } = useMarketplace();

  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Derive legacy category flags from urlState and searchParams for backward compatibility
  const urlSearchTerm = urlState.query;
  const searchTerm = urlState.query;
  const luxuryCategories = urlState.category === 'luxury' || searchParams.get('luxuryCategories') === 'true';
  const giftsForHer = urlState.category === 'gifts-for-her' || searchParams.get('giftsForHer') === 'true';
  const giftsForHim = urlState.category === 'gifts-for-him' || searchParams.get('giftsForHim') === 'true';
  const giftsUnder50 = urlState.category === 'gifts-under-50' || searchParams.get('giftsUnder50') === 'true';
  const brandCategories = urlState.category?.startsWith('brand-') ? urlState.category.replace('brand-', '') : searchParams.get('brandCategories');
  const personId = searchParams.get('personId');
  const occasionType = searchParams.get('occasionType');

  // Check for personalized products from session storage
  const [personalizedProducts, setPersonalizedProducts] = useState<any[]>([]);
  const [personalizedContext, setPersonalizedContext] = useState<any>(null);
  
  useEffect(() => {
    try {
      const storedProducts = sessionStorage.getItem('personalized-products');
      const storedContext = sessionStorage.getItem('personalized-context');
      
      if (storedProducts && storedContext) {
        setPersonalizedProducts(JSON.parse(storedProducts));
        setPersonalizedContext(JSON.parse(storedContext));
        console.log('📦 [StreamlinedMarketplaceWrapper] Loaded personalized products from session:', JSON.parse(storedProducts).length);
      }
    } catch (error) {
      console.warn('Failed to load personalized products from session storage:', error);
    }
  }, []);

  // Use personalized products if available, otherwise use regular products
  const isPersonalizedActive = useMemo(() => {
    const routePath = typeof window !== 'undefined' ? window.location.pathname : '';
    const isPersonalizedRoute = routePath.includes('/marketplace/for/');
    return isPersonalizedRoute || Boolean(personalizedContext?.isPersonalized) || (personalizedProducts.length > 0);
  }, [personalizedProducts.length, personalizedContext]);
  const [extraProducts, setExtraProducts] = useState<any[]>([]);
  const displayProducts = useMemo(() => {
    const base = personalizedProducts.length > 0 ? personalizedProducts : products;
    if (extraProducts.length === 0) return base;
    // Deduplicate by product_id/asin
    const existingIds = new Set(base.map((p: any) => p.product_id || p.asin));
    const newOnes = extraProducts.filter((p: any) => !existingIds.has(p.product_id || p.asin));
    return [...base, ...newOnes];
  }, [personalizedProducts, products, extraProducts]);
  
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<"grid" | "list" | "modern">("grid");
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
  const [activeFilters, setActiveFilters] = useState<any>({ sortBy: 'relevance' });
  const [isFindingMore, setIsFindingMore] = useState(false);
  const { addToCart } = useCart();

  // Derive friendly category display name from URL param
  const categoryParam = searchParams.get('category');
  const categoryDisplayName = useMemo(() => {
    return categoryParam ? getCategoryDisplayNameFromValue(categoryParam) : '';
  }, [categoryParam]);

  // Clear appended products when search term changes
  useEffect(() => { setExtraProducts([]); }, [urlSearchTerm]);

  // Auto-backfill: when a category search returns sparse cache results, auto-fetch more
  const [hasAutoBackfilled, setHasAutoBackfilled] = useState(false);
  useEffect(() => { setHasAutoBackfilled(false); }, [urlSearchTerm]);
  useEffect(() => {
    if (
      categoryParam &&
      fromCache &&
      displayProducts.length > 0 &&
      displayProducts.length < 24 &&
      !isFindingMore &&
      !isLoading &&
      !hasAutoBackfilled
    ) {
      console.log(`🔄 Auto-backfill: category "${categoryParam}" has only ${displayProducts.length} cached products, fetching more...`);
      setHasAutoBackfilled(true);
      handleFindMoreResults();
    }
  }, [categoryParam, fromCache, displayProducts.length, isFindingMore, isLoading, hasAutoBackfilled]);

  // Performance monitoring
  const { 
    startTimer, 
    endTimer, 
    trackCacheEvent, 
    budgetViolations,
    getPerformanceReport 
  } = usePerformanceMonitoring();
  
  // Container ref for touch and intersection optimization
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  // Touch interactions hook removed - was blocking iOS native scrolling with pointer-events-none
  
  // Intersection observer for lazy loading optimization
  const { isVisible, ref: intersectionRef } = useOptimizedIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px'
  });

  // Memoized show search info calculation (include category param)
  const showSearchInfo = useMemo(() => {
    const categoryParam = searchParams.get('category');
    return !!(categoryParam || urlSearchTerm || luxuryCategories || giftsForHer || giftsForHim || giftsUnder50 || brandCategories || personId || occasionType);
  }, [searchParams, urlSearchTerm, luxuryCategories, giftsForHer, giftsForHim, giftsUnder50, brandCategories, personId, occasionType]);

  // Server-side load more function - simplified using ProductCatalogService
  const handleLoadMore = useCallback(async (page: number): Promise<any[]> => {
    try {
      console.log(`[handleLoadMore] Loading page ${page}`);
      
      // Get Nicole context from session storage for budget filtering
      let nicoleContext;
      try {
        const storedContext = sessionStorage.getItem('nicole-search-context');
        if (storedContext) {
          nicoleContext = JSON.parse(storedContext);
        }
      } catch (error) {
        console.warn('Failed to parse Nicole context:', error);
      }

      // Build search options from URL params
      const category = searchParams.get('category');
      const searchQuery = searchParams.get('search') || searchParams.get('brandCategories') || '';
      
      const result = await productCatalogService.searchProducts(searchQuery, {
        category: category || undefined,
        page,
        limit: 20,
        filters: {
          minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
          maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
          brands: searchParams.get('brand')?.split(','),
          gender: searchParams.get('gender')?.split(','),
          size: searchParams.get('size')?.split(','),
        },
      });
      
      console.log(`[handleLoadMore] Loaded ${result.products?.length || 0} products`);
      return result.products || [];
    } catch (error) {
      console.error('Failed to load more products:', error);
      throw error;
    }
  }, [searchParams]);

  // Server-side pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 24; // Divisible by 2, 3, and 4 to fill all grid layouts evenly
  const isPaginationLoading = false; // Server handles loading via isLoading
  
  // Calculate pagination from displayProducts (server returns sorted products)
  const paginatedProducts = useMemo(() => {
    return displayProducts?.slice(0, currentPage * pageSize) || [];
  }, [displayProducts, currentPage, pageSize]);
  
  const hasMore = displayProducts ? paginatedProducts.length < displayProducts.length : false;
  const totalCount = displayProducts?.length || marketplaceTotalCount || 0;
  
  const loadMore = useCallback(() => {
    if (hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasMore]);

  const refreshPagination = useCallback(() => {
    setCurrentPage(1);
    setExtraProducts([]);
  }, []);

  // "Find more results" handler - bypasses cache for fresh Zinc API results
  const handleFindMoreResults = useCallback(async () => {
    if (!urlSearchTerm || isFindingMore) return;
    setIsFindingMore(true);
    try {
      const result = await executeSearch(urlSearchTerm, { skipCache: true, limit: 20 });
      if (result.products && result.products.length > 0) {
        setExtraProducts(prev => [...prev, ...result.products]);
        toast.success(`Found ${result.products.length} more products`);
      } else {
        toast.info('No additional results found');
      }
    } catch (error) {
      console.error('Find more results failed:', error);
      toast.error('Failed to find more results');
    } finally {
      setIsFindingMore(false);
    }
  }, [urlSearchTerm, isFindingMore, executeSearch]);

  // Server-side sorting is now handled by get-products edge function
  // No client-side re-sorting needed - products arrive pre-sorted
  const filteredPaginatedProducts = paginatedProducts;

  // Determine if we should show a featured product hero
  // Show for searches with high-quality first result (cached with good data, best seller, or high rating)
  // Also validate brand match for brand-specific searches
  const { featuredProduct, gridProducts } = useMemo(() => {
    if (!showSearchInfo || isPersonalizedActive || filteredPaginatedProducts.length === 0) {
      return { featuredProduct: null, gridProducts: filteredPaginatedProducts };
    }
    
    const firstProduct = filteredPaginatedProducts[0];
    
    // Check if search contains a brand name
    const commonBrands = ['sony', 'apple', 'samsung', 'bose', 'nike', 'adidas', 'lg', 'microsoft', 'google', 'dell', 'hp', 'lenovo', 'asus', 'acer', 'canon', 'nikon', 'fuji', 'panasonic', 'jbl', 'beats', 'logitech', 'razer', 'corsair', 'anker', 'belkin'];
    const searchTerms = (urlSearchTerm || '').toLowerCase().split(/\s+/);
    const searchBrands = searchTerms.filter(term => commonBrands.includes(term));
    const hasBrandSearch = searchBrands.length > 0;
    
    // If searching for a specific brand, validate the featured product matches
    if (hasBrandSearch) {
      const productBrand = (firstProduct.brand || '').toLowerCase();
      const productTitle = (firstProduct.title || firstProduct.name || '').toLowerCase();
      const brandMatches = searchBrands.some(searchBrand => 
        productBrand.includes(searchBrand) || productTitle.includes(searchBrand)
      );
      
      // Don't show featured hero if brand doesn't match
      if (!brandMatches) {
        console.log(`🎯 Featured hero skipped: brand mismatch (search: ${searchBrands.join(',')}, product: ${productBrand})`);
        return { featuredProduct: null, gridProducts: filteredPaginatedProducts };
      }
    }
    
    const shouldShowFeatured = 
      (firstProduct as any).popularity_score > 50 ||
      (firstProduct as any).isBestSeller ||
      (firstProduct as any).bestSellerType ||
      ((firstProduct.stars || firstProduct.rating || 0) >= 4 && (firstProduct as any).is_cached);
    
    if (shouldShowFeatured) {
      // Skip first product in grid since it's shown as featured hero
      return { 
        featuredProduct: firstProduct, 
        gridProducts: filteredPaginatedProducts.slice(1) 
      };
    }
    
    return { featuredProduct: null, gridProducts: filteredPaginatedProducts };
  }, [showSearchInfo, isPersonalizedActive, filteredPaginatedProducts, urlSearchTerm]);

  // Listen for Nicole search events and trigger marketplace search
  useEffect(() => {
    const handleMarketplaceSearchUpdate = (event: CustomEvent) => {
      const { searchTerm, nicoleContext } = event.detail;
      if (searchTerm) {
        console.log('🎯 Marketplace search update received:', { searchTerm, nicoleContext });
        
        
        // Start performance timer
        startTimer('nicole-search');
        
        // Store Nicole context for the search
        if (nicoleContext) {
          sessionStorage.setItem('nicole-search-context', JSON.stringify(nicoleContext));
          console.log('💰 Stored Nicole context in session storage:', nicoleContext);
        }
        
        // Update URL without page reload
        const newSearchParams = new URLSearchParams(window.location.search);
        newSearchParams.set('search', searchTerm);
        window.history.pushState({}, '', `${window.location.pathname}?${newSearchParams.toString()}`);
        
        // Let the useUnifiedMarketplace hook handle the search automatically via URL change
        // No need to dispatch additional events that could cause loops
      }
    };

    window.addEventListener('marketplace-search-updated', handleMarketplaceSearchUpdate as EventListener);
    return () => {
      window.removeEventListener('marketplace-search-updated', handleMarketplaceSearchUpdate as EventListener);
    };
  }, [startTimer]);

  // Enhanced search trigger function - uses React Router's setSearchParams for proper reactivity
  const triggerEnhancedSearch = useCallback(async (filters: any) => {
    if (!urlSearchTerm) return;
    
    try {
      console.log('🚀 TRIGGERED: Enhanced search with filters:', filters);
      console.log('🚀 Current URL search term:', urlSearchTerm);
      toast.loading('Applying filters...', { id: 'filter-search' });
      
      // Build enhanced query with filter context for better search relevance
      const enhancedQuery = buildEnhancedQuery(urlSearchTerm, filters);
      console.log('🎯 Enhanced query:', enhancedQuery);
      
      // Store filter context for the handleLoadMore function
      sessionStorage.setItem('active-filters', JSON.stringify(filters));
      
      // Build new URLSearchParams - use React Router to trigger proper re-render
      const newParams = new URLSearchParams();
      newParams.set('search', enhancedQuery);
      
      // Add filter params to URL for proper server-side filtering
      if (filters.waist?.length) newParams.set('waist', filters.waist.join(','));
      if (filters.inseam?.length) newParams.set('inseam', filters.inseam.join(','));
      if (filters.size?.length) newParams.set('size', filters.size.join(','));
      if (filters.brand?.length) newParams.set('brand', filters.brand.join(','));
      if (filters.color?.length) newParams.set('color', filters.color.join(','));
      if (filters.gender?.length) newParams.set('gender', filters.gender.join(','));
      
      // Use React Router's navigate to update URL - this TRIGGERS useMarketplace refetch
      navigate(`${location.pathname}?${newParams.toString()}`, { replace: true });
      
      toast.success('Filters applied', { id: 'filter-search' });
      
    } catch (error) {
      console.error('Enhanced search failed:', error);
      toast.error('Filter application failed', { id: 'filter-search' });
    }
  }, [urlSearchTerm, navigate, location.pathname]);

  // Helper function to build enhanced queries
  // NOTE: Waist/inseam filters are NOT added to query - they're handled server-side via URL params
  const buildEnhancedQuery = useCallback((baseQuery: string, filters: any): string => {
    const queryParts = [baseQuery];
    
    // Only add general filters to enhance search relevance
    // Size-specific filters (waist, inseam) are handled server-side via URL params
    if (filters.gender?.length) {
      queryParts.push(...filters.gender);
    }
    if (filters.brand?.length) {
      queryParts.push(...filters.brand);
    }
    if (filters.color?.length) {
      queryParts.push(...filters.color);
    }
    if (filters.material?.length) {
      queryParts.push(...filters.material);
    }
    if (filters.style?.length) {
      queryParts.push(...filters.style);
    }
    if (filters.features?.length) {
      queryParts.push(...filters.features);
    }
    
    // DO NOT add waist/inseam to query - they're filtered server-side
    // This prevents double-filtering that causes 0 results
    
    return queryParts.join(' ').trim();
  }, []);

  // Debug logging for the current state - MOVED TO useEffect
  useEffect(() => {
    console.log('StreamlinedMarketplaceWrapper render state:', {
      productsLength: products?.length || 0,
      paginatedProductsLength: paginatedProducts?.length || 0,
      hasMore,
      isPaginationLoading,
      showSearchInfo: urlSearchTerm || luxuryCategories || giftsForHer || giftsForHim || giftsUnder50 || brandCategories || personId || occasionType
    });
  }, [products, paginatedProducts, hasMore, isPaginationLoading, urlSearchTerm, luxuryCategories, giftsForHer, giftsForHim, giftsUnder50, brandCategories, personId, occasionType]);

  // Memoized product interaction handlers to prevent recreation
  const handleProductClick = useCallback((product: any) => {
    console.log('Product clicked:', product);
    const productId = product.product_id || product.id;
    navigate(`/marketplace/product/${productId}`, {
      state: {
        product,
        context: isPersonalizedActive ? 'personalized' : 'marketplace',
        returnPath: location.pathname + location.search
      }
    });
  }, [navigate, location, isPersonalizedActive]);

  const handleAddToCart = useCallback(async (product: any) => {
    console.log('Add to cart:', product);
    try {
      await addToCart(product, 1);
      // Toast is handled by UnifiedPaymentService
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast.error("Failed to add item to cart. Please try again.");
    }
  }, [addToCart]);

  const handleShare = useCallback((product: any) => {
    console.log('Share product:', product);
    // TODO: Implement share functionality
  }, []);

  const toggleWishlist = (productId: string) => {
    console.log('Toggle wishlist for product:', productId);
    // Implement wishlist toggle logic
  };

  const isFavorited = (productId: string) => {
    // Implement favorited check logic
    return false;
  };

  // Memoized product status calculation
  const getProductStatus = useCallback((product: any): { badge: string; color: string } | null => {
    if (product.vendor === "Local Vendor") {
      return { badge: "Local", color: "bg-blue-100 text-blue-800 border-blue-200" };
    }
    if (product.onSale) {
      return { badge: "Sale", color: "bg-red-100 text-red-800 border-red-200" };
    }
    if (product.isNew) {
      return { badge: "New", color: "bg-green-100 text-green-800 border-green-200" };
    }
    return null;
  }, []);

  // Performance monitoring for search completion - MOVED BEFORE EARLY RETURNS
  useEffect(() => {
    if (!isLoading && showSearchInfo) {
      endTimer('search-operation', 'searchTime');
    }
  }, [isLoading, showSearchInfo, endTimer]);

  // Debug logging for giftsUnder50 specifically - MOVED BEFORE EARLY RETURNS
  useEffect(() => {
    console.log('🐛 StreamlinedMarketplaceWrapper Debug:', {
      giftsUnder50,
      showSearchInfo,
      productsLength: products?.length,
      paginatedProductsLength: paginatedProducts?.length,
      isLoading,
      error
    });
  }, [giftsUnder50, showSearchInfo, products, paginatedProducts, isLoading, error]);

  // Check if user came from homepage category navigation and determine Quick Pick type
  const { hideHeroBanner, currentQuickPickCategory, currentLifestyleCategory, lifeEventCategory } = useMemo(() => {
    // Check router state first (most reliable)
    const isFromHome = Boolean(location.state?.fromHome) || searchParams.get('diversity') === 'true';
    
    // Check for Quick Pick categories
    const giftsForHerParam = searchParams.get('giftsForHer') === 'true';
    const giftsForHimParam = searchParams.get('giftsForHim') === 'true';
    const giftsUnder50Param = searchParams.get('giftsUnder50') === 'true';
    const luxuryCategoriesParam = searchParams.get('luxuryCategories') === 'true';
    
    // Check for lifestyle categories (simplified - any category not in the excluded list)
    const categoryParam = searchParams.get('category');
    const lifeEventCategories = ['wedding', 'baby'];
    const excludedCategories = ['best-selling', 'electronics', 'luxury', 'gifts-for-her', 'gifts-for-him', 'gifts-under-50', 'brand-categories', ...lifeEventCategories];
    const isLifestyleCategory = categoryParam && !excludedCategories.includes(categoryParam);
    const isLifeEvent = categoryParam ? lifeEventCategories.includes(categoryParam) : false;
    
    // Determine if we should hide the hero banner
    const shouldHide = isFromHome && (categoryParam || giftsForHerParam || giftsForHimParam || giftsUnder50Param || luxuryCategoriesParam) ||
                      isLifestyleCategory; // Always hide for lifestyle categories
    
    // Determine the current Quick Pick category for custom headers
    const quickPickType: 'giftsForHer' | 'giftsForHim' | 'giftsUnder50' | 'luxury' | null = giftsForHerParam ? 'giftsForHer' : 
                         giftsForHimParam ? 'giftsForHim' : 
                         giftsUnder50Param ? 'giftsUnder50' : 
                         luxuryCategoriesParam ? 'luxury' : null;

    console.log(`[StreamlinedMarketplaceWrapper] Navigation analysis:`, {
      isFromHome,
      categoryParam,
      isLifestyleCategory,
      giftsForHerParam,
      giftsForHimParam,
      giftsUnder50Param,
      luxuryCategoriesParam,
      shouldHide,
      quickPickType
    });

    return { 
      hideHeroBanner: shouldHide, 
      currentQuickPickCategory: quickPickType,
      currentLifestyleCategory: isLifestyleCategory ? categoryParam : null,
      lifeEventCategory: isLifeEvent ? (categoryParam as 'wedding' | 'baby') : null,
    };
  }, [location.state, searchParams]);

  // Use virtualized grid for large product lists - MOVED BEFORE EARLY RETURNS
  const shouldUseVirtualization = paginatedProducts.length > 50;

  // Determine if we should show loading state
  // Show loading when: explicitly loading OR we have search/category params but no products yet
  // SKIP loading for life event landing pages (wedding/baby with no search) — they're pure presentation
  const isLifeEventLanding = !!(lifeEventCategory && !urlSearchTerm);
  const shouldShowLoading = !isLifeEventLanding && (isLoading || (
    showSearchInfo && 
    paginatedProducts.length === 0 && 
    !error
  ));

  // Show loading skeleton
  if (shouldShowLoading) {
    return (
      <div className="container mx-auto px-4 py-6 pt-safe-top pb-safe">
          <MarketplaceHeader />
          <div className="lg:hidden py-3">
            <Skeleton className="h-11 w-full rounded-full" />
          </div>
          
          {/* Filter Pills */}
          <div className="lg:hidden">
            <FilterPills
              filters={activeFilters}
              onRemoveFilter={(filterType, value) => {
                const newFilters = { ...activeFilters };
                
                // Handle array-based filters (categories and smart filters)
                if (['category', 'gender', 'brand', 'size', 'color', 'fit'].includes(filterType) && value) {
                  newFilters[filterType] = (newFilters[filterType] || []).filter((item: string) => item !== value);
                  if (newFilters[filterType].length === 0) {
                    delete newFilters[filterType];
                  }
                } else if (filterType === 'priceRange') {
                  newFilters.priceRange = [0, 500];
                } else {
                  // Handle single-value filters
                  delete newFilters[filterType];
                }
                
                setActiveFilters(newFilters);
              }}
              onClearAll={() => setActiveFilters({})}
            />
          </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 pt-safe-top pb-safe">
        <MarketplaceHeader />
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div 
      ref={(el) => {
        containerRef.current = el;
        intersectionRef(el);
      }}
      className={`container mx-auto px-4 py-6 pt-safe-top pb-safe ${isMobile ? 'mobile-marketplace-grid mobile-safe-area' : ''}`}
    >
      {/* Conditional Hero Section - Hide if personalized or there's an active search */}
      {!isPersonalizedActive && !urlSearchTerm && (
        <> 
          {brandCategories ? (
            hideHeroBanner ? null : (
              <BrandHeroSection 
                brandName={brandCategories}
                productCount={totalCount}
              />
            )
          ) : (currentQuickPickCategory || giftsForHer || giftsForHim || giftsUnder50 || luxuryCategories) ? null : (
            /* Show curated hero on the default landing page (no search, no category) */
            showSearchInfo ? null : <MarketplaceLandingHero />
          )}
        </>
      )}
      
      {/* Only show MarketplaceHeader for non-personalized, non-life-event-landing */}
      {!isPersonalizedActive && !isLifeEventLanding && (
        <MarketplaceHeader
          totalResults={filteredPaginatedProducts.length}
          filteredProducts={filteredPaginatedProducts}
        />
      )}

      {/* Personalized Header */}
      {personalizedContext?.isPersonalized && (
        <div className="mb-6 lg:mb-8">
          <div className="flex items-center gap-3 lg:gap-4 mb-4">
            <Sparkles className="h-5 w-5 lg:h-6 lg:w-6 text-primary" />
            <h2 className="text-heading-3 lg:text-heading-2 font-semibold">
              Curated for {personalizedContext.recipientName}
            </h2>
          </div>
          <p className="text-body lg:text-lg text-muted-foreground max-w-3xl">
            These gift recommendations were personally curated by Nicole AI based on your relationship and the occasion.
          </p>
        </div>
      )}

      {/* Life Event Landing Pages (Wedding / Baby) */}
      {lifeEventCategory && !urlSearchTerm && !isPersonalizedActive && (
        <LifeEventLandingPage category={lifeEventCategory} />
      )}

      {/* Unified Category / Search Header — skip for life event landing */}
      {showSearchInfo && !brandCategories && !isPersonalizedActive && !(lifeEventCategory && !urlSearchTerm) && (() => {
        const quickPickMap: Record<string, { title: string; subtitle: string; tileId: string }> = {
          giftsForHer: { title: 'Gifts for Her', subtitle: "Thoughtfully curated for the special women in your life", tileId: 'gifts-for-her' },
          giftsForHim: { title: 'Gifts for Him', subtitle: "Discover the perfect gift for every guy", tileId: 'gifts-for-him' },
          giftsUnder50: { title: 'Gifts Under $50', subtitle: "Great gifts that won't break the bank", tileId: 'under-50' },
          luxury: { title: 'Luxury Gifts', subtitle: "Premium selections for extraordinary moments", tileId: 'luxury' },
        };

        const lifestyleMap: Record<string, { title: string; subtitle: string }> = {
          'movie-buff': { title: 'Movie Buff', subtitle: "Perfect gifts for cinema lovers and entertainment enthusiasts" },
          'on-the-go': { title: 'On the Go', subtitle: "Essential items for busy, active lifestyles" },
          'work-from-home': { title: 'Work From Home', subtitle: "Everything you need for productive remote work" },
          'the-traveler': { title: 'The Traveler', subtitle: "Adventure-ready gear for wanderers" },
          'the-home-chef': { title: 'The Home Chef', subtitle: "Culinary tools for kitchen enthusiasts" },
          'teens': { title: 'Teens', subtitle: "Trendy picks for young adults" },
        };

        const quick = currentQuickPickCategory || (giftsForHer ? 'giftsForHer' : giftsForHim ? 'giftsForHim' : giftsUnder50 ? 'giftsUnder50' : luxuryCategories ? 'luxury' : null);

        // Build header props based on category type
        let headerTitle: string;
        let headerSubtitle: string | undefined;
        let breadcrumbs: { label: string; href?: string; isCurrentPage?: boolean }[];
        let siblingCollections: typeof TILES | undefined;
        let currentTileId: string | undefined;

        if (quick && quickPickMap[quick]) {
          const info = quickPickMap[quick];
          headerTitle = info.title;
          headerSubtitle = info.subtitle;
          currentTileId = info.tileId;
          siblingCollections = TILES;
          breadcrumbs = [
            { label: 'Marketplace', href: '/marketplace' },
            { label: 'Gift Ideas', href: '/marketplace' },
            { label: info.title, isCurrentPage: true },
          ];
        } else if (urlSearchTerm) {
          const urlTitleParam = searchParams.get('title');
          const categoryParam = searchParams.get('category');
          const categoryDisplayName = categoryParam ? getCategoryDisplayNameFromValue(categoryParam) : null;

          if (urlTitleParam) {
            // Sub-collection tile was clicked — show its title
            headerTitle = urlTitleParam;
            headerSubtitle = `Browse ${urlTitleParam.toLowerCase()}`;
            const parentLabel = categoryDisplayName || (categoryParam ? categoryParam.charAt(0).toUpperCase() + categoryParam.slice(1) : 'Results');
            breadcrumbs = [
              { label: 'Marketplace', href: '/marketplace' },
              { label: parentLabel, href: `/marketplace?category=${categoryParam}` },
              { label: urlTitleParam, isCurrentPage: true },
            ];
          } else {
            const displayTitle = isCategorySearchTerm(urlSearchTerm)
              ? getCategoryDisplayNameFromSearchTerm(urlSearchTerm)
              : urlSearchTerm;
            const finalTitle = categoryDisplayName || displayTitle;
            headerTitle = finalTitle;
            headerSubtitle = categoryDisplayName ? `Browse ${finalTitle.toLowerCase()}` : `Search results for "${finalTitle}"`;
            breadcrumbs = [
              { label: 'Marketplace', href: '/marketplace' },
              { label: 'Search Results', isCurrentPage: true },
            ];
          }
        } else if (currentLifestyleCategory && lifestyleMap[currentLifestyleCategory]) {
          const info = lifestyleMap[currentLifestyleCategory];
          headerTitle = info.title;
          headerSubtitle = info.subtitle;
          breadcrumbs = [
            { label: 'Marketplace', href: '/marketplace' },
            { label: info.title, isCurrentPage: true },
          ];
        } else {
          const categoryParam = searchParams.get('category');
          const category = categoryParam ? getCategoryByValue(categoryParam) : null;
          headerTitle = category ? (category.displayName || category.name) : 'Browse Products';
          headerSubtitle = category ? category.description : 'Browse our curated selection';
          breadcrumbs = [
            { label: 'Marketplace', href: '/marketplace' },
            { label: headerTitle, isCurrentPage: true },
          ];
        }

        return (
          <CategoryLandingHeader
            title={headerTitle}
            subtitle={headerSubtitle}
            productCount={totalCount}
            breadcrumbs={breadcrumbs}
            siblingCollections={siblingCollections}
            currentCollectionId={currentTileId}
          />
        );
      })()}

      {/* Quick Filters - Only for non-personalized, hidden on life event landing */}
      {!isPersonalizedActive && !(lifeEventCategory && !urlSearchTerm) && (
        <>
          {/* Sub-Category Tabs - Below hero, above filters */}
          {showSearchInfo && (
            <div className="mb-4">
              <SubCategoryTabs />
            </div>
          )}
          
          {/* Desktop: Two-column layout with sidebar */}
          <div className="hidden lg:flex gap-8 items-start">
            {/* Left: Filter Sidebar */}
            {showSearchInfo && (
              <DynamicDesktopFilterSidebar
                searchTerm={urlSearchTerm || ''}
                products={displayProducts}
                productCount={filteredPaginatedProducts.length}
                activeFilters={activeFilters}
                onFilterChange={(newFilters) => {
                  setActiveFilters(newFilters);
                  // Trigger enhanced search if needed
                  if (urlSearchTerm) {
                    const criticalFilters = ['waist', 'inseam', 'size', 'brand', 'color', 'material', 'style', 'features'];
                    const hasChanges = Object.keys(newFilters).some(key => criticalFilters.includes(key));
                    if (hasChanges) {
                      setTimeout(() => triggerEnhancedSearch(newFilters), 100);
                    }
                  }
                }}
              />
            )}
            
            {/* Right: Main content */}
            <div className="flex-1">
              {/* Secondary Filter Row */}
              {showSearchInfo && (
                <FilterSortRow
                  sortBy={activeFilters?.sortBy || 'relevance'}
                  onSortChange={(value) => setActiveFilters({ ...activeFilters, sortBy: value })}
                  className="mb-6"
                />
              )}
              
              {/* Products Grid - Loading State */}
              {isLoading && filteredPaginatedProducts.length === 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="aspect-square rounded-lg" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ))}
                </div>
              )}
              
              {/* Featured Product Hero - Show for brand/product searches with high-quality first result */}
              {featuredProduct && (
                <FeaturedProductHero 
                  product={featuredProduct}
                  searchTerm={urlSearchTerm || ''}
                />
              )}
              
              {/* Products Grid */}
              {(showSearchInfo || !products.length || isPersonalizedActive) && gridProducts.length > 0 && (
                <>
                  {shouldUseVirtualization ? (
                    <VirtualizedProductGrid
                      products={gridProducts}
                      viewMode={viewMode}
                      onProductClick={handleProductClick}
                      onAddToCart={handleAddToCart}
                      onShare={handleShare}
                      getProductStatus={getProductStatus}
                      className="mb-8"
                      containerHeight={600}
                      itemHeight={400}
                    />
                  ) : (
                    <OptimizedProductGrid
                      products={gridProducts}
                      viewMode={viewMode}
                      onProductClick={handleProductClick}
                      onAddToCart={handleAddToCart}
                      onShare={handleShare}
                      getProductStatus={getProductStatus}
                      className="mb-8"
                    />
                  )}

                  {/* Load More Button */}
                  {hasMore && showSearchInfo && (
                    <div className="flex justify-center mt-8">
                      <Button 
                        onClick={() => {
                          console.log('Load More button clicked!', { hasMore, isPaginationLoading });
                          loadMore();
                        }} 
                        disabled={isPaginationLoading}
                        className="min-w-[160px]"
                        variant="outline"
                      >
                        {isPaginationLoading ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          `Load More Products`
                        )}
                      </Button>
                    </div>
                  )}
                  
                  {/* Find More Results Button - when cache results are sparse */}
{showSearchInfo && urlSearchTerm && fromCache && displayProducts.length > 0 && (
                    <div className="flex justify-center mt-6">
                      <Button 
                        onClick={handleFindMoreResults}
                        disabled={isFindingMore}
                        variant="outline"
                        className="min-w-[200px] gap-2"
                      >
                        {isFindingMore ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Searching...
                          </>
                        ) : (
                          <>
                            <Search className="h-4 w-4" />
                            {categoryParam
                              ? `Find more ${categoryDisplayName} gifts`
                              : `Find more "${urlSearchTerm}" results`}
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}
              
              {/* Empty State with Fallback Products */}
              {filteredPaginatedProducts.length === 0 && !isLoading && (
                <ZeroResultsState
                  query={urlSearchTerm || ''}
                  suggestedQueries={suggestedQueries}
                  fallbackProducts={fallbackProducts}
                  onSearchSuggestion={(suggestion) => search(suggestion)}
                />
              )}
            </div>
          </div>
          
          {/* Mobile: Lululemon-style filters with dynamic drawer */}
          <div className="lg:hidden">
            <LululemonMobileFilters
              searchTerm={urlSearchTerm || ''}
              products={displayProducts}
              activeFilters={activeFilters}
              onFilterChange={(newFilters) => {
                setActiveFilters(newFilters);
                if (urlSearchTerm) {
                  const criticalFilters = ['waist', 'inseam', 'size', 'brand', 'color', 'material', 'style', 'features'];
                  const hasChanges = Object.keys(newFilters).some(key => criticalFilters.includes(key));
                  if (hasChanges) {
                    setTimeout(() => triggerEnhancedSearch(newFilters), 100);
                  }
                }
              }}
              onOpenFullFilters={() => setShowFiltersDrawer(true)}
            />
            
            {/* Filter Pills */}
            <FilterPills
              filters={activeFilters}
              onRemoveFilter={(filterType, value) => {
                const newFilters = { ...activeFilters };
                
                // Handle array-based filters (categories and smart filters) - EXPANDED
                if (['category', 'gender', 'brand', 'size', 'color', 'fit', 'waist', 'inseam', 'material', 'style', 'features'].includes(filterType) && value) {
                  newFilters[filterType] = (newFilters[filterType] || []).filter((item: string) => item !== value);
                  if (newFilters[filterType].length === 0) {
                    delete newFilters[filterType];
                  }
                } else if (filterType === 'priceRange') {
                  newFilters.priceRange = [0, 500];
                } else {
                  // Handle single-value filters
                  delete newFilters[filterType];
                }
                
                setActiveFilters(newFilters);
                
                // Check if this is a critical filter change that should trigger new search
                const criticalFilters = ['waist', 'inseam', 'size', 'brand', 'color', 'material', 'style', 'features'];
                if (criticalFilters.includes(filterType) && urlSearchTerm) {
                  console.log('🔍 Critical filter removed, triggering enhanced search...');
                  setTimeout(() => {
                    triggerEnhancedSearch(newFilters);
                  }, 100);
                }
              }}
              onClearAll={() => {
                setActiveFilters({});
                // Reset to original search when clearing all filters
                if (urlSearchTerm) {
                  setTimeout(() => {
                    triggerEnhancedSearch({});
                  }, 100);
                }
              }}
            />
            
            {/* Mobile Products Grid - Loading State */}
            {isLoading && filteredPaginatedProducts.length === 0 && (
              <div className="grid grid-cols-2 gap-4 mb-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-square rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            )}
            
            {/* Mobile Featured Product Hero */}
            {featuredProduct && (
              <FeaturedProductHero 
                product={featuredProduct}
                searchTerm={urlSearchTerm || ''}
              />
            )}
            
            {/* Mobile Products Grid */}
            {(showSearchInfo || !products.length || isPersonalizedActive) && gridProducts.length > 0 && (
              <>
                {shouldUseVirtualization ? (
                  <VirtualizedProductGrid
                    products={gridProducts}
                    viewMode={viewMode}
                    onProductClick={handleProductClick}
                    onAddToCart={handleAddToCart}
                    onShare={handleShare}
                    getProductStatus={getProductStatus}
                    className="mb-8"
                    containerHeight={600}
                    itemHeight={400}
                  />
                ) : (
                  <OptimizedProductGrid
                    products={gridProducts}
                    viewMode={viewMode}
                    onProductClick={handleProductClick}
                    onAddToCart={handleAddToCart}
                    onShare={handleShare}
                    getProductStatus={getProductStatus}
                    className="mb-8"
                  />
                )}

                {/* Load More Button */}
                {hasMore && showSearchInfo && (
                  <div className="flex justify-center mt-8">
                    <Button 
                      onClick={() => {
                        console.log('Load More button clicked!', { hasMore, isPaginationLoading });
                        loadMore();
                      }} 
                      disabled={isPaginationLoading}
                      className="min-w-[160px]"
                      variant="outline"
                    >
                      {isPaginationLoading ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        `Load More Products`
                      )}
                    </Button>
                  </div>
                )}
                
                {/* Mobile: Find More Results Button */}
                {showSearchInfo && urlSearchTerm && fromCache && displayProducts.length > 0 && (
                  <div className="flex justify-center mt-6">
                    <Button 
                      onClick={handleFindMoreResults}
                      disabled={isFindingMore}
                      variant="outline"
                      className="min-w-[200px] gap-2"
                    >
                      {isFindingMore ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4" />
                          {categoryParam
                            ? `Find more ${categoryDisplayName} gifts`
                            : `Find more "${urlSearchTerm}" results`}
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
            
            {/* Mobile Empty State with Fallback Products */}
            {filteredPaginatedProducts.length === 0 && !isLoading && (
              <ZeroResultsState
                query={urlSearchTerm || ''}
                suggestedQueries={suggestedQueries}
                fallbackProducts={fallbackProducts}
                onSearchSuggestion={(suggestion) => search(suggestion)}
              />
            )}
          </div>
        </>
      )}

      {/* Curated Landing Sections (when no search active) */}
      {!showSearchInfo && !isPersonalizedActive && (
        <>
          <CuratedCollectionTiles />
          <PopularBrands />
          <TrendingProductsSection onProductClick={handleProductClick} onAddToCart={handleAddToCart} />
          <ShopByOccasion />
          <CategoryBrowseGrid />
        </>
      )}
      
      {/* Dynamic Mobile Filter Drawer */}
      <DynamicMobileFilterDrawer
        searchTerm={urlSearchTerm || ''}
        products={displayProducts}
        activeFilters={activeFilters}
        onFilterChange={(newFilters) => {
          setActiveFilters(newFilters);
          if (urlSearchTerm) {
            const criticalFilters = ['waist', 'inseam', 'size', 'brand', 'color', 'material', 'style', 'features'];
            const hasChanges = Object.keys(newFilters).some(key => criticalFilters.includes(key));
            if (hasChanges) {
              setTimeout(() => triggerEnhancedSearch(newFilters), 100);
            }
          }
        }}
        isOpen={showFiltersDrawer}
        onOpenChange={setShowFiltersDrawer}
      />
      
      
    </div>
  );
});

StreamlinedMarketplaceWrapper.displayName = "StreamlinedMarketplaceWrapper";

export default StreamlinedMarketplaceWrapper;
