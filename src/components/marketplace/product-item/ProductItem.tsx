
import React from "react";
import { Product } from "@/types/product";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth";
import WishlistSelectionPopoverButton from "@/components/gifting/wishlist/WishlistSelectionPopoverButton";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useUnifiedWishlist } from "@/hooks/useUnifiedWishlist";
import SignUpDialog from "../SignUpDialog";
import AddToCartButton from "@/components/marketplace/components/AddToCartButton";

interface ProductItemProps {
  product: Product;
  viewMode: "grid" | "list" | "modern";
  onProductClick: (productId: string) => void;
  onWishlistClick?: (e: React.MouseEvent) => void;
  isFavorited: boolean;
  statusBadge?: { badge: string; color: string } | null;
}

const ProductItem = ({
  product,
  viewMode,
  onProductClick,
  onWishlistClick,
  isFavorited,
  statusBadge,
}: ProductItemProps) => {
  const { user } = useAuth();
  const { isProductWishlisted, loadWishlists } = useUnifiedWishlist();
  const [showSignUpDialog, setShowSignUpDialog] = React.useState(false);

  const productId = String(product.product_id || product.id);
  const productName = product.title || product.name || "";
  const productPrice = product.price || 0;

  // Use the unified wishlist system to check if product is wishlisted
  const isActuallyWishlisted = user ? isProductWishlisted(productId) : false;

  const handleWishlistAdded = async () => {
    console.log('ProductItem - Item added to wishlist, refreshing state');
    await loadWishlists();
    
    if (onWishlistClick) {
      onWishlistClick({} as React.MouseEvent);
    }
  };

  const handleWishlistClick = () => {
    if (!user) {
      setShowSignUpDialog(true);
      return;
    }
  };

  const handleProductClick = () => {
    onProductClick(productId);
  };

  // Prevent cart button clicks from triggering product modal
  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const formatPrice = (price: number | undefined) => {
    if (!price) return "Price not available";
    return `$${price.toFixed(2)}`;
  };

  const isListView = viewMode === "list";

  return (
    <>
      <div
        className={`group cursor-pointer bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-md overflow-hidden relative ${
          isListView ? "flex gap-4 p-4" : "flex flex-col"
        }`}
        onClick={handleProductClick}
      >
        {/* Status Badge */}
        {statusBadge && (
          <Badge 
            className={`absolute top-2 left-2 z-10 text-xs ${statusBadge.color}`}
          >
            {statusBadge.badge}
          </Badge>
        )}

        {/* Wishlist Button */}
        <div className="absolute top-2 right-2 z-10">
          {user ? (
            <WishlistSelectionPopoverButton
              product={{
                id: productId,
                name: productName,
                image: product.image,
                price: productPrice,
                brand: product.brand,
              }}
              triggerClassName="bg-white/80 hover:bg-white text-gray-400 hover:text-pink-500 p-1.5 rounded-full transition-colors shadow-sm"
              onAdded={handleWishlistAdded}
              isWishlisted={isActuallyWishlisted}
            />
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="bg-white/80 hover:bg-white text-gray-400 hover:text-pink-500 rounded-full p-1.5 shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                handleWishlistClick();
              }}
            >
              <Heart className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Product Image */}
        <div className={`${isListView ? "w-32 h-32 flex-shrink-0" : "aspect-square"} bg-gray-100 overflow-hidden ${isListView ? "rounded-md" : ""}`}>
          {product.image ? (
            <img
              src={product.image}
              alt={productName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No Image
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className={`${isListView ? "flex-1" : "p-4"} flex flex-col`}>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-primary transition-colors">
              {productName}
            </h3>
            
            {product.brand && (
              <p className="text-sm text-gray-500 mt-1">{product.brand}</p>
            )}
            
            <p className="text-lg font-semibold text-gray-900 mt-2">
              {formatPrice(product.price)}
            </p>

            {product.description && isListView && (
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                {product.description}
              </p>
            )}
          </div>

          {/* Add to Cart Button */}
          <div className="mt-3">
            <AddToCartButton
              product={product}
              variant="outline"
              size="sm"
              className="w-full h-9 text-sm font-medium"
              onClick={handleAddToCartClick}
            />
          </div>
        </div>
      </div>

      <SignUpDialog 
        open={showSignUpDialog} 
        onOpenChange={setShowSignUpDialog} 
      />
    </>
  );
};

export default ProductItem;
