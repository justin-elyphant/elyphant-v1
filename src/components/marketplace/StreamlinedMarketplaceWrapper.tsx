
import React, { useState, useEffect } from "react";
import { useUnifiedMarketplace } from "@/hooks/useUnifiedMarketplace";
import { useIsMobile } from "@/hooks/use-mobile";
import MarketplaceHeader from "./MarketplaceHeader";
import MarketplaceQuickFilters from "./MarketplaceQuickFilters";
import { AirbnbStyleCategorySections } from "./AirbnbStyleCategorySections";
import AirbnbStyleProductCard from "./AirbnbStyleProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { unifiedMarketplaceService } from "@/services/marketplace/UnifiedMarketplaceService";
import ProductDetailsDialog from "./ProductDetailsDialog";
import MarketplaceHeroBanner from "./MarketplaceHeroBanner";

const StreamlinedMarketplaceWrapper = () => {
  const {
    products,
    isLoading,
    error,
    searchTerm,
    urlSearchTerm,
    luxuryCategories,
    personId,
    occasionType,
  } = useUnifiedMarketplace();

  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<"grid" | "list" | "modern">("modern");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);

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
  const showSearchInfo = urlSearchTerm || luxuryCategories || personId || occasionType;
  
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Hero Banner - always show for consistent branding */}
      <MarketplaceHeroBanner />
      
      <MarketplaceHeader
        totalResults={products.length}
        filteredProducts={products}
      />

      {/* Quick Filters */}
      <MarketplaceQuickFilters />

      {/* Search Results Info */}
      {showSearchInfo && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-900">
                {luxuryCategories && "Luxury Collections"}
                {urlSearchTerm && `Showing results for: "${urlSearchTerm}"`}
                {personId && occasionType && `Gifts for ${occasionType}`}
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                Found {products.length} {products.length === 1 ? 'product' : 'products'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Category Sections (when no search active) */}
      {!showSearchInfo && (
        <AirbnbStyleCategorySections />
      )}

      {/* Products Grid (when search is active or as fallback) */}
      {(showSearchInfo || !products.length) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product, index) => (
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
      )}

      {/* Empty State */}
      {products.length === 0 && !isLoading && (
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
