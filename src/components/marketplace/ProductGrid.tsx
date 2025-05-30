
import React, { useState, useEffect } from "react";
import { Product } from "@/types/product";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUnifiedWishlist } from "@/hooks/useUnifiedWishlist";
import { useAuth } from "@/contexts/auth";
import { sortProducts } from "./hooks/utils/categoryUtils";
import ProductItem from "./product-item/ProductItem";
import ProductDetailsDialog from "./ProductDetailsDialog";
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
  // Always initialize these hooks first, regardless of conditions
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [dlgOpen, setDlgOpen] = useState<boolean>(false);
  const [sortedProducts, setSortedProducts] = useState<Product[]>(products);
  const [showSignUpDialog, setShowSignUpDialog] = useState(false);
  const { addItem, recentlyViewed } = useRecentlyViewed();
  const isMobile = useIsMobile();
  const [userData] = useLocalStorage("userData", null);
  const { user } = useAuth();
  
  // Use our unified wishlist system
  const { isProductWishlisted, quickAddToWishlist } = useUnifiedWishlist();
  
  // Update sorted products when products or sort option changes
  useEffect(() => {
    setSortedProducts(sortProducts(products, sortOption));
  }, [products, sortOption]);

  // Generate product badges for visual indicators
  const getProductStatus = (product: Product): { badge: string; color: string } | null => {
    // Check if this is in the recently viewed items to add "Recently Viewed" badge
    const isRecentlyViewed = recentlyViewed?.some(item => item.id === (product.product_id || product.id));

    // --- NEW: Wishlist badge for friend event searches ---
    if (product.fromWishlist && product.tags) {
      // Find the friend's wishlist tag, e.g. "From Michael's Wishlist"
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
  };

  const handleProductClick = (productId: string) => {
    console.log("Product clicked:", productId);
    setSelectedProduct(productId);
    setDlgOpen(true);
    
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
    }
    
    // Track product view if callback provided
    if (onProductView) {
      onProductView(productId);
    }
  };

  const toggleWishlist = async (e: React.MouseEvent, productInfo: any) => {
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
  };

  const isFavorited = (productId: string) => {
    return user ? isProductWishlisted(productId) : false;
  };

  return (
    <>
      <ProductGridDisplay
        products={sortedProducts}
        viewMode={viewMode}
        getProductStatus={getProductStatus}
        handleProductClick={handleProductClick}
        toggleWishlist={toggleWishlist}
        isFavorited={isFavorited}
        isMobile={isMobile}
      />

      <ProductDetailsDialog
        product={
          selectedProduct
            ? products.find(
                (p) => (p.product_id || p.id) === selectedProduct
              ) || null
            : null
        }
        open={dlgOpen}
        onOpenChange={setDlgOpen}
        userData={userData}
      />

      <SignUpDialog
        open={showSignUpDialog}
        onOpenChange={setShowSignUpDialog}
      />
    </>
  );
};

export default ProductGrid;
