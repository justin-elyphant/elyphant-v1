import React, { useMemo, useCallback, memo } from "react";
import { Product } from "@/contexts/ProductContext";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
import { useFavorites } from "@/components/gifting/hooks/useFavorites";
import ProductItem from "./product-item/ProductItem";
import ProductDetailsDialog from "./product-details/ProductDetailsDialog";
import SignUpDialog from "./SignUpDialog";
import { sortProducts } from "./hooks/utils/categoryUtils";
import ProductSkeleton from "./ui/ProductSkeleton";
import ModernProductCard from "./ui/ModernProductCard";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";
import { Badge } from "@/components/ui/badge";

interface ProductGridOptimizedProps {
  products: Product[];
  viewMode: "grid" | "list" | "modern";
  sortOption?: string;
  isLoading?: boolean;
  useMock?: boolean;
}

// Memoized individual product component
const MemoizedProductItem = memo(ProductItem);
const MemoizedModernProductCard = memo(ModernProductCard);

const ProductGridOptimized = ({ 
  products, 
  viewMode, 
  sortOption = "relevance",
  isLoading = false,
  useMock = false
}: ProductGridOptimizedProps) => {
  const [showSignUpDialog, setShowSignUpDialog] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<string | null>(null);
  const [dlgOpen, setDlgOpen] = React.useState<boolean>(false);
  const [userData] = useLocalStorage("userData", null);
  const { handleFavoriteToggle, isFavorited } = useFavorites();
  const { addToCart } = useCart();
  const { addToRecentlyViewed } = useRecentlyViewed();

  // Memoize sorted products to prevent unnecessary recalculations
  const sortedProducts = useMemo(() => {
    return sortProducts(products, sortOption);
  }, [products, sortOption]);
  
  // Group products by source for better display
  const groupedProducts = useMemo(() => {
    const wishlistItems = sortedProducts.filter(p => p.fromWishlist);
    const preferenceItems = sortedProducts.filter(p => p.fromPreferences && !p.fromWishlist);
    const regularItems = sortedProducts.filter(p => !p.fromWishlist && !p.fromPreferences);
    
    return {
      wishlistItems,
      preferenceItems,
      regularItems,
      hasGrouping: wishlistItems.length > 0 || preferenceItems.length > 0
    };
  }, [sortedProducts]);

  // Memoize event handlers
  const handleWishlistClick = useCallback((e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    if (!userData) {
      setShowSignUpDialog(true);
    } else {
      handleFavoriteToggle(productId);
    }
  }, [userData, handleFavoriteToggle]);
  
  const handleProductClick = useCallback((productId: string) => {
    setSelectedProduct(productId);
    setDlgOpen(true);
    
    // Add to recently viewed items
    const product = products.find(p => p.product_id === productId);
    if (product) {
      addToRecentlyViewed({
        id: product.product_id,
        name: product.title || "",
        image: product.image,
        price: product.price
      });
    }
  }, [products, addToRecentlyViewed]);
  
  const handleAddToCart = useCallback((e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    addToCart(product);
    toast.success(`Added ${product.title || 'Product'} to cart`);
  }, [addToCart]);

  // Render product card with potential tag
  const renderProductCard = useCallback((product: Product) => {
    if (viewMode === 'modern') {
      return (
        <div key={product.product_id} className="relative">
          {product.tags && product.tags.length > 0 && (
            <Badge className="absolute top-0 left-0 z-10 m-2 bg-purple-600">
              {product.tags[0]}
            </Badge>
          )}
          <MemoizedModernProductCard
            product={product}
            isFavorited={userData ? isFavorited(product.product_id) : false}
            onToggleFavorite={(e) => handleWishlistClick(e, product.product_id)}
            onAddToCart={(e) => handleAddToCart(e, product)}
            onClick={() => handleProductClick(product.product_id)}
          />
        </div>
      );
    } else {
      return (
        <div key={product.product_id} className="relative">
          {product.tags && product.tags.length > 0 && (
            <Badge className="absolute top-0 left-0 z-10 m-2 bg-purple-600">
              {product.tags[0]}
            </Badge>
          )}
          <MemoizedProductItem
            product={product}
            viewMode={viewMode}
            onProductClick={handleProductClick}
            onWishlistClick={(e) => handleWishlistClick(e, product.product_id)}
            isFavorited={userData ? isFavorited(product.product_id) : false}
            useMock={useMock}
          />
        </div>
      );
    }
  }, [viewMode, userData, isFavorited, handleWishlistClick, handleProductClick, handleAddToCart, useMock]);

  if (isLoading) {
    return <ProductSkeleton count={12} />;
  }

  // For debugging - log what we're trying to render
  console.log("ProductGridOptimized rendering products:", sortedProducts?.length || 0);

  if (!sortedProducts || sortedProducts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-medium">No products found</p>
        <p className="text-muted-foreground">Try adjusting your filters or search terms</p>
      </div>
    );
  }

  // If we have grouped products (wishlist + preferences), show them separately
  if (groupedProducts.hasGrouping) {
    return (
      <>
        {/* Wishlist items section */}
        {groupedProducts.wishlistItems.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">From Wishlist</h3>
            <div className={viewMode === 'modern' 
              ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6' 
              : viewMode === 'grid' 
                ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6' 
                : 'space-y-4'}
            >
              {groupedProducts.wishlistItems.map(renderProductCard)}
            </div>
          </div>
        )}
        
        {/* Preference-based items section */}
        {groupedProducts.preferenceItems.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Based on Preferences</h3>
            <div className={viewMode === 'modern' 
              ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6' 
              : viewMode === 'grid' 
                ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6' 
                : 'space-y-4'}
            >
              {groupedProducts.preferenceItems.map(renderProductCard)}
            </div>
          </div>
        )}
        
        {/* Other recommended items section */}
        {groupedProducts.regularItems.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">More Recommendations</h3>
            <div className={viewMode === 'modern' 
              ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6' 
              : viewMode === 'grid' 
                ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6' 
                : 'space-y-4'}
            >
              {groupedProducts.regularItems.map(renderProductCard)}
            </div>
          </div>
        )}
        
        <ProductDetailsDialog 
          productId={selectedProduct}
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
  }

  // Standard product grid for non-grouped products
  return (
    <>
      <div className={viewMode === 'modern' 
        ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6' 
        : viewMode === 'grid' 
          ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6' 
          : 'space-y-4'}
      >
        {sortedProducts.map(renderProductCard)}
      </div>

      <ProductDetailsDialog 
        productId={selectedProduct}
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

export default React.memo(ProductGridOptimized);
