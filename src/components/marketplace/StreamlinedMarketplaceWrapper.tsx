
import React, { useState, useCallback } from "react";
import { useUnifiedMarketplace } from "@/hooks/useUnifiedMarketplace";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUnifiedWishlist } from "@/hooks/useUnifiedWishlist";
import { useAuth } from "@/contexts/auth";
import { Skeleton } from "@/components/ui/skeleton";
import AirbnbStyleSearchBar from "./AirbnbStyleSearchBar";
import AirbnbStyleCategorySections from "./AirbnbStyleCategorySections";
import ProductDetailsDialog from "./ProductDetailsDialog";
import SignUpDialog from "./SignUpDialog";

const StreamlinedMarketplaceWrapper = () => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showSignUpDialog, setShowSignUpDialog] = useState(false);
  
  // Use the unified marketplace hook
  const {
    products,
    isLoading,
    error,
    searchTerm,
    urlSearchTerm,
    luxuryCategories,
    search,
    clearSearch
  } = useUnifiedMarketplace({
    autoLoadOnMount: true
  });

  const { isProductWishlisted, quickAddToWishlist, loadWishlists } = useUnifiedWishlist();

  // Product click handler
  const handleProductClick = useCallback((productId: string) => {
    console.log("Product clicked:", productId);
    setSelectedProduct(productId);
    setShowProductDialog(true);
  }, []);

  // Wishlist toggle handler
  const toggleWishlist = useCallback(async (e: React.MouseEvent, productInfo: any) => {
    e.stopPropagation();

    if (!user) {
      setShowSignUpDialog(true);
      return;
    }

    const product = products.find(p => (p.product_id || p.id) === productInfo.id);
    if (!product) return;

    const productData = {
      id: product.product_id || product.id || "",
      title: product.title || product.name || "",
      name: product.title || product.name || "",
      image: product.image,
      price: product.price,
      brand: product.brand
    };

    await quickAddToWishlist(productData);
    await loadWishlists();
  }, [user, products, quickAddToWishlist, loadWishlists]);

  // Check if product is favorited
  const isFavorited = useCallback((productId: string) => {
    return user ? isProductWishlisted(productId) : false;
  }, [user, isProductWishlisted]);

  // Get product status badge
  const getProductStatus = useCallback((product: any) => {
    if (product.isBestSeller) {
      return { badge: "Best Seller", color: "bg-amber-100 text-amber-800 border-amber-200" };
    }
    
    if (product.tags?.includes("trending")) {
      return { badge: "Trending", color: "bg-blue-100 text-blue-800 border-blue-200" };
    }
    
    if (product.tags?.includes("limited")) {
      return { badge: "Limited Stock", color: "bg-red-100 text-red-800 border-red-200" };
    }
    
    if (product.tags?.includes("new") || (product.id && Number(product.id) > 9000)) {
      return { badge: "New Arrival", color: "bg-green-100 text-green-800 border-green-200" };
    }
    
    return null;
  }, []);

  // Get selected product data
  const selectedProductData = products.find(p => (p.product_id || p.id) === selectedProduct) || null;

  // Show loading skeleton during initial load
  if (isLoading && products.length === 0) {
    return (
      <div className={`min-h-screen bg-gray-50 ${isMobile ? 'pb-safe' : ''}`}>
        {/* Search Bar Skeleton */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Skeleton className="h-14 w-full rounded-full" />
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* Section Title Skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-96" />
            </div>
            
            {/* Products Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-64 w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${isMobile ? 'pb-safe' : ''}`}>
      {/* Header with Search Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <AirbnbStyleSearchBar onSearch={search} />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        {(urlSearchTerm || luxuryCategories) && (
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {luxuryCategories ? "Luxury Collections" : "Search Results"}
            </h1>
            {urlSearchTerm && (
              <p className="text-gray-600 mt-2 text-lg">
                {products.length} results for "{urlSearchTerm}"
              </p>
            )}
            {luxuryCategories && (
              <p className="text-gray-600 mt-2 text-lg">
                Premium brands and designer collections • {products.length} items
              </p>
            )}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Search Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => search(searchTerm)}
              className="px-6 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* No Results */}
        {!isLoading && !error && products.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">🔍</div>
            <h3 className="text-2xl font-medium text-gray-900 mb-4">
              {urlSearchTerm ? "No results found" : "Start exploring"}
            </h3>
            <p className="text-gray-600 text-lg max-w-md mx-auto">
              {urlSearchTerm 
                ? `We couldn't find any products matching "${urlSearchTerm}". Try adjusting your search terms.`
                : "Search for products, brands, or experiences to discover amazing finds from retailers and local vendors."
              }
            </p>
          </div>
        )}

        {/* Products Display - Airbnb Style */}
        {products.length > 0 && (
          <AirbnbStyleCategorySections
            products={products}
            onProductClick={handleProductClick}
          />
        )}
      </div>

      {/* Product Details Dialog */}
      <ProductDetailsDialog
        product={selectedProductData}
        open={showProductDialog}
        onOpenChange={setShowProductDialog}
        userData={user}
        onWishlistChange={loadWishlists}
      />

      {/* Sign Up Dialog */}
      <SignUpDialog
        open={showSignUpDialog}
        onOpenChange={setShowSignUpDialog}
      />
    </div>
  );
};

export default StreamlinedMarketplaceWrapper;
