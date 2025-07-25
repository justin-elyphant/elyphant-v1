
import React, { useState, useEffect } from "react";
import { useUnifiedMarketplace } from "@/hooks/useUnifiedMarketplace";
import { useIsMobile } from "@/hooks/use-mobile";
import MarketplaceHeader from "./MarketplaceHeader";
import MarketplaceQuickFilters from "./MarketplaceQuickFilters";
import { AirbnbStyleCategorySections } from "./AirbnbStyleCategorySections";
import AirbnbStyleProductCard from "./AirbnbStyleProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { unifiedMarketplaceService } from "@/services/marketplace/UnifiedMarketplaceService";
import ProductDetailsDialog from "./ProductDetailsDialog";
import MarketplaceHeroBanner from "./MarketplaceHeroBanner";
import BrandHeroSection from "./BrandHeroSection";
import CategoryHeroSection from "./CategoryHeroSection";
import { useOptimizedProducts } from "./hooks/useOptimizedProducts";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams } from "react-router-dom";
import { useCallback } from "react";
import { getCategoryByValue } from "@/constants/categories";

const StreamlinedMarketplaceWrapper = () => {
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
  const [viewMode, setViewMode] = useState<"grid" | "list" | "modern">("modern");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [searchParams] = useSearchParams();

  // Server-side load more function
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
        ...(searchParams.get('brandCategories') && { brandCategories: true, query: searchParams.get('brandCategories') })
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
      
      // For other search types, use unified marketplace
      const searchOptions = {
        page,
        limit: 20,
        ...(searchParams.get('luxuryCategories') && { luxuryCategories: true }),
        ...(searchParams.get('brandCategories') && { brandCategories: true }),
        ...(searchParams.get('personId') && { personId: searchParams.get('personId') }),
        ...(searchParams.get('occasionType') && { occasionType: searchParams.get('occasionType') })
      };
      
      const searchTerm = searchParams.get('brandCategories') || searchParams.get('search') || '';
      const result = await unifiedMarketplaceService.searchProducts(searchTerm, searchOptions);
      
      return result || [];
    } catch (error) {
      console.error('Failed to load more products:', error);
      throw error;
    }
  }, [searchParams]);

  // Use optimized products hook for pagination and loading
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

  // Debug logging for the current state
  console.log('StreamlinedMarketplaceWrapper render state:', {
    productsLength: products?.length || 0,
    paginatedProductsLength: paginatedProducts.length,
    hasMore,
    isPaginationLoading,
    showSearchInfo: urlSearchTerm || luxuryCategories || giftsForHer || giftsForHim || giftsUnder50 || brandCategories || personId || occasionType
  });

  // Product interaction handlers
  const handleProductClick = (product: any) => {
    console.log('Product clicked:', product);
    setSelectedProduct(product);
    setShowProductDetails(true);
  };

  const handleAddToCart = (product: any) => {
    console.log('Add to cart:', product);
    // TODO: Implement add to cart functionality
  };

  const handleShare = (product: any) => {
    console.log('Share product:', product);
    // TODO: Implement share functionality
  };

  const toggleWishlist = (productId: string) => {
    console.log('Toggle wishlist for product:', productId);
    // Implement wishlist toggle logic
  };

  const isFavorited = (productId: string) => {
    // Implement favorited check logic
    return false;
  };

  const getProductStatus = (product: any): { badge: string; color: string } | null => {
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
  };

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

  // Show search results info
  const showSearchInfo = urlSearchTerm || luxuryCategories || giftsForHer || giftsForHim || giftsUnder50 || brandCategories || personId || occasionType;
  
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Conditional Hero Section */}
      {brandCategories ? (
        <BrandHeroSection 
          brandName={brandCategories}
          productCount={totalCount}
        />
      ) : giftsForHer ? (
        <CategoryHeroSection 
          categoryType="giftsForHer"
          productCount={totalCount}
        />
      ) : giftsForHim ? (
        <CategoryHeroSection 
          categoryType="giftsForHim"
          productCount={totalCount}
        />
      ) : giftsUnder50 ? (
        <CategoryHeroSection 
          categoryType="giftsUnder50"
          productCount={totalCount}
        />
      ) : luxuryCategories ? (
        <CategoryHeroSection 
          categoryType="luxuryCategories"
          productCount={totalCount}
        />
      ) : (
        <MarketplaceHeroBanner category={searchParams.get("category") || undefined} />
      )}
      
      <MarketplaceHeader
        totalResults={products.length}
        filteredProducts={products}
      />

      {/* Category Title and Description */}
      {showSearchInfo && !brandCategories && !giftsForHer && !giftsForHim && !giftsUnder50 && !luxuryCategories && (() => {
        const categoryParam = searchParams.get("category");
        const category = categoryParam ? getCategoryByValue(categoryParam) : null;
        
        // Don't show title/description for flowers category
        if (categoryParam === "flowers") {
          return (
            <div className="mb-8">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {totalCount} {totalCount === 1 ? 'product' : 'products'} found
                </p>
              </div>
            </div>
          );
        }
        
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
        <AirbnbStyleCategorySections onProductClick={handleProductClick} />
      )}

      {/* Products Grid (when search is active or as fallback) */}
      {(showSearchInfo || !products.length) && paginatedProducts.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedProducts.map((product, index) => (
              <AirbnbStyleProductCard
                key={product.id || product.product_id || index}
                product={product}
                onProductClick={() => handleProductClick(product)}
                statusBadge={getProductStatus(product)}
                onAddToCart={handleAddToCart}
                onShare={handleShare}
              />
            ))}
          </div>

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
};

export default StreamlinedMarketplaceWrapper;
