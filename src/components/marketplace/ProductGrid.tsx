
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Product } from "@/types/product";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUnifiedWishlistSystem } from "@/hooks/useUnifiedWishlistSystem";
import { useAuth } from "@/contexts/auth";
import { sortProducts } from "./hooks/utils/categoryUtils";
import ProductItem from "./product-item/ProductItem";
import SignUpDialog from "./SignUpDialog";
import ProductGridDisplay from "./ProductGridDisplay";

interface ProductGridProps {
  products: Product[];
  viewMode: "grid" | "list" | "modern";
  sortOption?: string;
  onProductView?: (productId: string) => void;
  savedFilters?: SavedFilters;
  onFilterChange?: (filters: SavedFilters) => void;
}

export interface SavedFilters {
  priceRange: [number, number];
  categories: string[];
  ratings: number | null;
  favorites: boolean;
}

const ProductGrid = ({ 
  products, 
  viewMode, 
  sortOption = "relevance",
  onProductView,
  savedFilters,
  onFilterChange
}: ProductGridProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  // State management
  const [showSignUpDialog, setShowSignUpDialog] = useState(false);
  const [wishlistRefreshTrigger, setWishlistRefreshTrigger] = useState(0);
  
  // Hooks
  const { addItem, recentlyViewed } = useRecentlyViewed();
  const isMobile = useIsMobile();
  const [userData] = useLocalStorage("userData", null);
  const { user } = useAuth();
  const { isProductWishlisted, quickAddToWishlist, loadWishlists } = useUnifiedWishlistSystem();
  
  // Memoize sorted products to prevent unnecessary recalculations
  const sortedProducts = useMemo(() => {
    return sortProducts(products, sortOption);
  }, [products, sortOption]);

  // Memoize product status function to prevent recreation on every render
  const getProductStatus = useCallback((product: Product): { badge: string; color: string } | null => {
    // Check if this is in the recently viewed items
    const isRecentlyViewed = recentlyViewed?.some(item => item.id === (product.product_id || product.id));

    // Wishlist badge for friend event searches
    if (product.fromWishlist && product.tags) {
      const wishlistTag = product.tags.find(tag => tag.startsWith("From ") && tag.endsWith("Wishlist"));
      if (wishlistTag) {
        return { badge: wishlistTag, color: "bg-pink-100 text-pink-700 border-pink-200" };
      }
    }

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
    
    if (isRecentlyViewed) {
      return { badge: "Recently Viewed", color: "bg-purple-100 text-purple-800 border-purple-200" };
    }
    
    return null;
  }, [recentlyViewed]);

  // Optimized wishlist state callback
  const handleWishlistChange = useCallback(async () => {
    console.log('ProductGrid - Wishlist changed, refreshing state');
    await loadWishlists();
    setWishlistRefreshTrigger(prev => prev + 1);
  }, [loadWishlists]);

  const handleProductClick = useCallback((productId: string) => {
    console.log("Product clicked:", productId);
    
    // Find the product and add to recently viewed
    const product = products.find(p => (p.product_id || p.id) === productId);
    if (product) {
      console.log("Adding to recently viewed:", product.title || product.name);
      addItem({
        id: product.product_id || product.id || "",
        title: product.title || product.name || "",
        image: product.image,
        price: product.price
      });
      
      // Navigate to full-page product details
      navigate(`/marketplace/product/${productId}`, {
        state: { product, context: 'marketplace' }
      });
    }
    
    // Track product view if callback provided
    if (onProductView) {
      onProductView(productId);
    }
  }, [products, addItem, onProductView, navigate]);

  // Optimized wishlist toggle with better error handling
  const toggleWishlist = useCallback(async (e: React.MouseEvent, productInfo: any) => {
    e.stopPropagation();

    if (!user) {
      setShowSignUpDialog(true);
      return;
    }

    // Find the full product data
    const product = products.find(p => (p.product_id || p.id) === productInfo.id);
    if (!product) return;

    // Convert to the format expected by the wishlist system
    const productData = {
      id: product.product_id || product.id || "",
      title: product.title || product.name || "",
      name: product.title || product.name || "",
      image: product.image,
      price: product.price,
      brand: product.brand
    };

    await quickAddToWishlist(productData);
    // Trigger local state refresh
    setWishlistRefreshTrigger(prev => prev + 1);
  }, [user, products, quickAddToWishlist]);

  // Memoize favorited status check for better performance
  const isFavorited = useCallback((productId: string) => {
    return user ? isProductWishlisted(productId) : false;
  }, [user, isProductWishlisted, wishlistRefreshTrigger]);

  return (
    <div className="safe-area-inset mobile-grid-optimized">
      <ProductGridDisplay
        products={sortedProducts}
        viewMode={viewMode}
        getProductStatus={getProductStatus}
        handleProductClick={handleProductClick}
        toggleWishlist={toggleWishlist}
        isFavorited={isFavorited}
        isMobile={isMobile}
      />

      <SignUpDialog
        open={showSignUpDialog}
        onOpenChange={setShowSignUpDialog}
      />
    </div>
  );
};

export default React.memo(ProductGrid);
