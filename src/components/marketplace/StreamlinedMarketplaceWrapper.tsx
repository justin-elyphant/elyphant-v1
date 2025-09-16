
import React, { useState, useEffect, memo, useCallback, useMemo } from "react";
import { useUnifiedMarketplace } from "@/hooks/useUnifiedMarketplace";
import { useIsMobile } from "@/hooks/use-mobile";
import MarketplaceHeader from "./MarketplaceHeader";
import MarketplaceQuickFilters from "./MarketplaceQuickFilters";
import { ProgressiveAirbnbStyleCategorySections } from "./ProgressiveAirbnbStyleCategorySections";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { optimizedMarketplaceService } from "@/services/marketplace/OptimizedMarketplaceService";
import ProductDetailsDialog from "./ProductDetailsDialog";
import MarketplaceHeroBanner from "./MarketplaceHeroBanner";
import BrandHeroSection from "./BrandHeroSection";
import CategoryHeroSection from "./CategoryHeroSection";
import { useOptimizedProducts } from "./hooks/useOptimizedProducts";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams, useLocation } from "react-router-dom";
import { getCategoryByValue } from "@/constants/categories";
import OptimizedProductGrid from "./components/OptimizedProductGrid";
import VirtualizedProductGrid from "./components/VirtualizedProductGrid";
import { batchDOMUpdates } from "@/utils/performanceOptimizations";
import { usePerformanceMonitoring } from "@/hooks/usePerformanceMonitoring";
import { useOptimizedTouchInteractions } from "@/hooks/useOptimizedTouchInteractions";
import { useOptimizedIntersectionObserver } from "@/hooks/useOptimizedIntersectionObserver";
import { backgroundPrefetchingService } from "@/services/marketplace/BackgroundPrefetchingService";


const StreamlinedMarketplaceWrapper = memo(() => {
  const {
    products,
    isLoading,
    error,
    searchTerm,
    urlSearchTerm,
    luxuryCategories,
    giftsForHer,
    giftsForHim,
    giftsUnder50,
    brandCategories,
    personId,
    occasionType,
  } = useUnifiedMarketplace();

  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<"grid" | "list" | "modern">("grid");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { addToCart } = useCart();
  
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
  
  // Optimized touch interactions for mobile
  const { gesture, isInteracting } = useOptimizedTouchInteractions(containerRef, {
    preventDefaultScroll: true,
    tapDelay: 200
  });
  
  // Intersection observer for lazy loading optimization
  const { isVisible, ref: intersectionRef } = useOptimizedIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px'
  });

  // Memoized show search info calculation
  const showSearchInfo = useMemo(() => 
    !!(urlSearchTerm || luxuryCategories || giftsForHer || giftsForHim || giftsUnder50 || brandCategories || personId || occasionType),
    [urlSearchTerm, luxuryCategories, giftsForHer, giftsForHim, giftsUnder50, brandCategories, personId, occasionType]
  );

  // Server-side load more function - MOVED BEFORE useOptimizedProducts
  const handleLoadMore = useCallback(async (page: number): Promise<any[]> => {
    try {
      console.log(`handleLoadMore called for page ${page}`);
      console.log('URL params:', {
        giftsForHer: searchParams.get('giftsForHer'),
        giftsForHim: searchParams.get('giftsForHim'),
        giftsUnder50: searchParams.get('giftsUnder50'),
        luxuryCategories: searchParams.get('luxuryCategories'),
        brandCategories: searchParams.get('brandCategories'),
        search: searchParams.get('search')
      });
      
      // Handle category-based searches
      const categoryParams = {
        ...(searchParams.get('giftsForHer') && { giftsForHer: true }),
        ...(searchParams.get('giftsForHim') && { giftsForHim: true }),
        ...(searchParams.get('giftsUnder50') && { giftsUnder50: true }),
        ...(searchParams.get('luxuryCategories') && { luxuryCategories: true }),
        ...(searchParams.get('brandCategories') && { brandCategories: true, query: searchParams.get('brandCategories') }),
        ...(searchParams.get('category') === 'best-selling' && { bestSelling: true })
      };
      
      if (Object.keys(categoryParams).length > 0) {
        const categoryType = Object.keys(categoryParams)[0];
        console.log(`Making ${categoryType} request with page:`, page);
        
        const response = await supabase.functions.invoke('get-products', {
          body: { 
            ...categoryParams,
            page,
            limit: 20
          }
        });
        
        console.log('Edge function response:', response);
        
        if (response.error) {
          console.error('Edge function error:', response.error);
          throw new Error(response.error.message);
        }
        
        console.log('Returning products:', response.data?.results?.length || 0);
        return response.data?.results || [];
      }
      
      // Get Nicole context from session storage for budget filtering
      let nicoleContext;
      try {
        const storedContext = sessionStorage.getItem('nicole-search-context');
        if (storedContext) {
          nicoleContext = JSON.parse(storedContext);
          console.log('💰 Retrieved Nicole context for search:', nicoleContext);
        }
      } catch (error) {
        console.warn('Failed to parse Nicole context from session storage:', error);
      }
      
      // Also read explicit min/max price from URL
      const urlMinPrice = searchParams.get('minPrice');
      const urlMaxPrice = searchParams.get('maxPrice');
      const minPrice = urlMinPrice ? Number(urlMinPrice) : undefined;
      const maxPrice = urlMaxPrice ? Number(urlMaxPrice) : undefined;
      
      // For other search types, use optimized marketplace service
      const searchOptions = {
        page,
        limit: 20,
        ...(searchParams.get('luxuryCategories') && { luxuryCategories: true }),
        ...(searchParams.get('brandCategories') && { brandCategories: true }),
        ...(searchParams.get('personId') && { personId: searchParams.get('personId') }),
        ...(searchParams.get('occasionType') && { occasionType: searchParams.get('occasionType') }),
        ...(nicoleContext && { nicoleContext }), // Pass Nicole context for budget filtering
        ...(minPrice !== undefined ? { minPrice } : {}),
        ...(maxPrice !== undefined ? { maxPrice } : {}),
      };
      
      const searchTerm = searchParams.get('brandCategories') || searchParams.get('search') || '';
      console.log('🔍 Optimized searching with options:', searchOptions);
      const result = await optimizedMarketplaceService.searchProducts(searchTerm, searchOptions);
      
      return result || [];
    } catch (error) {
      console.error('Failed to load more products:', error);
      throw error;
    }
  }, [searchParams]);

  // Use optimized products hook for pagination and loading - MOVED BEFORE EARLY RETURNS
  const {
    products: paginatedProducts,
    isLoading: isPaginationLoading,
    hasMore,
    loadMore,
    refresh: refreshPagination,
    totalCount
  } = useOptimizedProducts({
    initialProducts: products || [],
    pageSize: 20,
    onLoadMore: handleLoadMore,
    hasMoreFromServer: true, // Always assume there might be more until we get less than a full page
  });
  // Listen for Nicole search events and trigger marketplace search
  useEffect(() => {
    const handleMarketplaceSearchUpdate = (event: CustomEvent) => {
      const { searchTerm, nicoleContext } = event.detail;
      if (searchTerm) {
        console.log('🎯 Marketplace search update received:', { searchTerm, nicoleContext });
        
        // Track search for background prefetching
        backgroundPrefetchingService.trackSearch(searchTerm, 'nicole');
        
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
    setSelectedProduct(product);
    setShowProductDetails(true);
  }, []);

  const handleAddToCart = useCallback(async (product: any) => {
    console.log('Add to cart:', product);
    try {
      await addToCart(product, 1);
      toast.success(`${product.title || product.name} has been added to your cart.`);
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
  const { hideHeroBanner, currentQuickPickCategory } = useMemo(() => {
    // Check router state first (most reliable)
    const isFromHome = Boolean(location.state?.fromHome) || searchParams.get('diversity') === 'true';
    
    // Check for Quick Pick categories
    const giftsForHerParam = searchParams.get('giftsForHer') === 'true';
    const giftsForHimParam = searchParams.get('giftsForHim') === 'true';
    const giftsUnder50Param = searchParams.get('giftsUnder50') === 'true';
    const luxuryCategoriesParam = searchParams.get('luxuryCategories') === 'true';
    
    // Check for regular category navigation
    const categoryParam = Boolean(searchParams.get('category'));
    
    // Determine if we should hide the hero banner
    const shouldHide = isFromHome && (categoryParam || giftsForHerParam || giftsForHimParam || giftsUnder50Param || luxuryCategoriesParam);
    
    // Determine the current Quick Pick category for custom headers
    const quickPickType: 'giftsForHer' | 'giftsForHim' | 'giftsUnder50' | 'luxury' | null = giftsForHerParam ? 'giftsForHer' : 
                         giftsForHimParam ? 'giftsForHim' : 
                         giftsUnder50Param ? 'giftsUnder50' : 
                         luxuryCategoriesParam ? 'luxury' : null;

    console.log(`[StreamlinedMarketplaceWrapper] Navigation analysis:`, {
      isFromHome,
      categoryParam,
      giftsForHerParam,
      giftsForHimParam,
      giftsUnder50Param,
      luxuryCategoriesParam,
      shouldHide,
      quickPickType
    });

    return { 
      hideHeroBanner: shouldHide, 
      currentQuickPickCategory: quickPickType 
    };
  }, [location.state, searchParams]);

  // Use virtualized grid for large product lists - MOVED BEFORE EARLY RETURNS
  const shouldUseVirtualization = paginatedProducts.length > 50;

  // Show loading skeleton
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <MarketplaceHeader />
        <MarketplaceQuickFilters />
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
      <div className="container mx-auto px-4 py-6">
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
      className={`container mx-auto px-4 py-6 ${isInteracting ? 'pointer-events-none' : ''}`}
    >
      {/* Conditional Hero Section */}
      {brandCategories ? (
        hideHeroBanner ? null : (
          <BrandHeroSection 
            brandName={brandCategories}
            productCount={totalCount}
          />
        )
      ) : (currentQuickPickCategory || giftsForHer || giftsForHim || giftsUnder50 || luxuryCategories) ? null : (
        hideHeroBanner ? null : (
          <MarketplaceHeroBanner 
            category={searchParams.get("category") || undefined} 
            hideFromCategoryNavigation={false}
            quickPickCategory={currentQuickPickCategory}
          />
        )
      )}
      
      <MarketplaceHeader
        totalResults={products.length}
        filteredProducts={products}
      />

      {/* Category or Quick Pick Title */}
      {showSearchInfo && !brandCategories && (() => {
        const quick = currentQuickPickCategory || (giftsForHer ? 'giftsForHer' : giftsForHim ? 'giftsForHim' : giftsUnder50 ? 'giftsUnder50' : luxuryCategories ? 'luxury' : null);

        if (quick) {
          const map = {
            giftsForHer: { title: 'Gifts for Her', subtitle: "Thoughtfully curated for the special women in your life" },
            giftsForHim: { title: 'Gifts for Him', subtitle: "Discover the perfect gift for every guy" },
            giftsUnder50: { title: 'Gifts Under $50', subtitle: "Great gifts that won't break the bank" },
            luxury: { title: 'Luxury Gifts', subtitle: "Premium selections for extraordinary moments" },
          } as const;
          const { title, subtitle } = map[quick];
          return (
            <div className="mb-8">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
                <p className="text-lg text-muted-foreground mb-4">{subtitle}</p>
                <p className="text-sm text-muted-foreground">
                  {totalCount} {totalCount === 1 ? 'product' : 'products'} found
                </p>
              </div>
            </div>
          );
        }

        const categoryParam = searchParams.get("category");
        const category = categoryParam ? getCategoryByValue(categoryParam) : null;
        
        // Show title/description for all categories including flowers
        
        return (
          <div className="mb-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {category ? (category.displayName || category.name) : "Search Results"}
              </h1>
              <p className="text-lg text-muted-foreground mb-4">
                {category ? category.description : "Browse our curated selection"}
              </p>
              <p className="text-sm text-muted-foreground">
                {totalCount} {totalCount === 1 ? 'product' : 'products'} found
              </p>
            </div>
          </div>
        );
      })()}

      {/* Quick Filters */}
      <MarketplaceQuickFilters />

      {/* Category Sections (when no search active) */}
      {!showSearchInfo && (
        <ProgressiveAirbnbStyleCategorySections onProductClick={handleProductClick} />
      )}

      {/* Products Grid (when search is active or as fallback) */}
      {(showSearchInfo || !products.length) && paginatedProducts.length > 0 && (
        <>
          {shouldUseVirtualization ? (
            <VirtualizedProductGrid
              products={paginatedProducts}
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
              products={paginatedProducts}
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
        </>
      )}

      {/* Empty State */}
      {paginatedProducts.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8V4a1 1 0 00-1-1H9a1 1 0 00-1 1v1m7 0V4a1 1 0 00-1-1H6a1 1 0 00-1 1v1" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">
              {showSearchInfo 
                ? "Try adjusting your search terms or filters"
                : "We're loading our product catalog. Please check back soon!"
              }
            </p>
          </div>
        </div>
      )}
      
      {/* Product Details Dialog */}
      {selectedProduct && (
        <ProductDetailsDialog
          product={selectedProduct}
          open={showProductDetails}
          onOpenChange={setShowProductDetails}
          userData={null}
        />
      )}
    </div>
  );
});

StreamlinedMarketplaceWrapper.displayName = "StreamlinedMarketplaceWrapper";

export default StreamlinedMarketplaceWrapper;
