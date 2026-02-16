import { useCallback, useState } from "react";
import { Product } from "@/contexts/ProductContext";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
import { useFavorites } from "@/components/gifting/hooks/useFavorites";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import UnifiedProductCard from "../../UnifiedProductCard";

export const useProductInteractions = (
  products: Product[], 
  viewMode: "grid" | "list" | "modern",
  onProductView?: (productId: string) => void
) => {
  const [showSignUpDialog, setShowSignUpDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [dlgOpen, setDlgOpen] = useState<boolean>(false);
  const [userData] = useLocalStorage("userData", null);
  const { handleFavoriteToggle, isFavorited } = useFavorites();
  const { addToCart } = useCart();
  const { addItem } = useRecentlyViewed();

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
      addItem({
        id: product.product_id || "",
        title: product.title || product.name || "",
        image: product.image,
        price: product.price
      });
      
      // Call the onProductView prop if provided
      if (onProductView) {
        onProductView(productId);
      }
    }
  }, [products, addItem, onProductView]);
  
  const handleAddToCart = useCallback((e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    addToCart(product);
    toast.success(`Added ${product.title || 'Product'} to cart`);
  }, [addToCart]);

  // Render product card with potential tag
  const renderProductCard = useCallback((product: Product) => {
    if (viewMode === 'modern') {
      return (
        <div key={product.product_id || product.id || ""} className="relative">
          {product.tags && product.tags.length > 0 && (
            <Badge className="absolute top-0 left-0 z-10 m-2 bg-purple-600">
              {product.tags[0]}
            </Badge>
          )}
          <UnifiedProductCard
            cardType="modern"
            product={product}
            isFavorited={userData ? isFavorited(product.product_id || product.id || "") : false}
            onToggleFavorite={(e) => handleWishlistClick(e, product.product_id || product.id || "")}
            onAddToCart={(e) => handleAddToCart(e, product)}
            onClick={() => handleProductClick(product.product_id || product.id || "")}
          />
        </div>
      );
    } else {
      return (
        <div key={product.product_id || product.id || ""} className="relative">
          {product.tags && product.tags.length > 0 && (
            <Badge className="absolute top-0 left-0 z-10 m-2 bg-purple-600">
              {product.tags[0]}
            </Badge>
          )}
          <UnifiedProductCard
            cardType="airbnb"
            product={product}
            viewMode={viewMode}
            onProductClick={() => handleProductClick(product.product_id || product.id || "")}
            onToggleFavorite={(e) => handleWishlistClick(e, product.product_id || product.id || "")}
            isFavorited={userData ? isFavorited(product.product_id || product.id || "") : false}
          />
        </div>
      );
    }
  }, [viewMode, userData, isFavorited, handleWishlistClick, handleProductClick, handleAddToCart]);

  return {
    selectedProduct,
    dlgOpen,
    showSignUpDialog,
    setDlgOpen,
    setShowSignUpDialog,
    handleWishlistClick,
    handleProductClick,
    handleAddToCart,
    userData,
    renderProductCard
  };
};
