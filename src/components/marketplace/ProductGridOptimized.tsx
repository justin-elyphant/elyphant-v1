
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

interface ProductGridOptimizedProps {
  products: Product[];
  viewMode: "grid" | "list" | "modern";
  sortOption?: string;
  isLoading?: boolean;
}

// Memoized individual product component
const MemoizedProductItem = memo(ProductItem);
const MemoizedModernProductCard = memo(ModernProductCard);

const ProductGridOptimized = ({ 
  products, 
  viewMode, 
  sortOption = "relevance",
  isLoading = false
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

  return (
    <>
      <div className={viewMode === 'modern' 
        ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6' 
        : viewMode === 'grid' 
          ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6' 
          : 'space-y-4'}
      >
        {sortedProducts.map((product) => (
          viewMode === 'modern' ? (
            <MemoizedModernProductCard
              key={product.product_id}
              product={product}
              isFavorited={userData ? isFavorited(product.product_id) : false}
              onToggleFavorite={(e) => handleWishlistClick(e, product.product_id)}
              onAddToCart={(e) => handleAddToCart(e, product)}
              onClick={() => handleProductClick(product.product_id)}
            />
          ) : (
            <MemoizedProductItem 
              key={product.product_id}
              product={product}
              viewMode={viewMode}
              onProductClick={handleProductClick}
              onWishlistClick={(e) => handleWishlistClick(e, product.product_id)}
              isFavorited={userData ? isFavorited(product.product_id) : false}
            />
          )
        ))}
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
