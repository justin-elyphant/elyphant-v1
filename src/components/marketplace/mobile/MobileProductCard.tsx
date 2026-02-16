
import React from "react";
import { Product } from "@/types/product";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import WishlistSelectionPopoverButton from "@/components/gifting/wishlist/WishlistSelectionPopoverButton";
import AddToCartButton from "@/components/marketplace/components/AddToCartButton";
import { useUnifiedWishlistSystem } from "@/hooks/useUnifiedWishlistSystem";
import SignUpDialog from "../SignUpDialog";

interface MobileProductCardProps {
  product: Product;
  onProductClick: (productId: string) => void;
  onWishlistClick?: () => void;
  statusBadge?: { badge: string; color: string } | null;
}

const MobileProductCard = ({
  product,
  onProductClick,
  onWishlistClick,
  statusBadge,
}: MobileProductCardProps) => {
  const { user } = useAuth();
  const { isProductWishlisted, loadWishlists } = useUnifiedWishlistSystem();
  const [showSignUpDialog, setShowSignUpDialog] = React.useState(false);

  const productId = String(product.product_id || product.id);
  const productName = product.title || product.name || "";
  const isWishlisted = user ? isProductWishlisted(productId) : false;

  const handleWishlistAdded = async () => {
    await loadWishlists();
    if (onWishlistClick) {
      onWishlistClick();
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

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const formatPrice = (price: number | undefined) => {
    if (!price) return "Price not available";
    return `$${price.toFixed(2)}`;
  };

  const renderRating = () => {
    const rating = product.rating || product.stars || 0;
    const reviewCount = product.reviewCount || product.num_reviews || 0;
    
    if (!rating) return null;

    return (
      <div className="flex items-center gap-1 mt-1">
        <div className="flex items-center">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          <span className="text-xs font-medium ml-1">{rating.toFixed(1)}</span>
        </div>
        {reviewCount > 0 && (
          <span className="text-xs text-gray-500">({reviewCount})</span>
        )}
      </div>
    );
  };

  return (
    <>
      <Card
        className="overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.98] touch-manipulation"
        onClick={handleProductClick}
      >
        {/* Image Section */}
        <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
          {product.image ? (
            <img
              src={product.image}
              alt={productName}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
              No Image
            </div>
          )}

          {/* Status Badge */}
          {statusBadge && (
            <Badge 
              className={`absolute top-2 left-2 z-10 text-xs px-2 py-1 ${statusBadge.color}`}
            >
              {statusBadge.badge}
            </Badge>
          )}

          {/* Wishlist Button */}
          <div className="absolute top-2 right-2 z-10">
            {user ? (
              <WishlistSelectionPopoverButton
                variant="icon"
                product={{
                  id: productId,
                  name: productName,
                  image: product.image,
                  price: product.price,
                  brand: product.brand,
                }}
                triggerClassName="bg-white/90 backdrop-blur-sm hover:bg-white text-gray-600 hover:text-pink-500 p-2 rounded-full transition-colors shadow-sm"
                onAdded={handleWishlistAdded}
                isWishlisted={isWishlisted}
              />
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="bg-white/90 backdrop-blur-sm hover:bg-white text-gray-600 hover:text-pink-500 rounded-full p-2 shadow-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleWishlistClick();
                }}
              >
                <Heart className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-3 space-y-2">
          {/* Product Name */}
          <h3 className="font-medium text-sm leading-tight line-clamp-2 text-gray-900 min-h-[2.5rem]">
            {productName}
          </h3>

          {/* Brand */}
          {product.brand && (
            <p className="text-xs text-gray-500">{product.brand}</p>
          )}

          {/* Rating */}
          {renderRating()}

          {/* Price */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-base font-semibold text-gray-900">
              {formatPrice(product.price)}
            </p>
          </div>

          {/* Add to Cart Button */}
          <div className="pt-2">
            <AddToCartButton
              product={product}
              variant="outline"
              size="sm"
              className="w-full h-9 text-sm font-medium border-gray-200 hover:border-gray-300 active:scale-[0.96] transition-transform duration-100"
              onClick={handleAddToCartClick}
            />
          </div>
        </div>
      </Card>

      <SignUpDialog 
        open={showSignUpDialog} 
        onOpenChange={setShowSignUpDialog} 
      />
    </>
  );
};

export default MobileProductCard;
