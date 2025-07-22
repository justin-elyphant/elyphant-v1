
import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Heart, MapPin, Clock } from "lucide-react";
import { Product } from "@/types/product";
import { useUnifiedWishlist } from "@/hooks/useUnifiedWishlist";
import { useAuth } from "@/contexts/auth";
import { cn } from "@/lib/utils";
import WishlistSelectionPopoverButton from "@/components/gifting/wishlist/WishlistSelectionPopoverButton";

interface AirbnbStyleProductCardProps {
  product: Product;
  onProductClick: () => void;
  statusBadge?: { badge: string; color: string } | null;
  isLocal?: boolean;
  vendorInfo?: {
    name: string;
    location: string;
  };
}

const AirbnbStyleProductCard: React.FC<AirbnbStyleProductCardProps> = ({
  product,
  onProductClick,
  statusBadge,
  isLocal = false,
  vendorInfo
}) => {
  const { user } = useAuth();
  const { isProductWishlisted, loadWishlists } = useUnifiedWishlist();
  
  const productId = String(product.product_id || product.id);
  const isWishlisted = user ? isProductWishlisted(productId) : false;
  
  const handleWishlistAdded = async () => {
    await loadWishlists();
  };

  const getProductImage = () => {
    return product.image || product.images?.[0] || "/placeholder.svg";
  };

  const getProductTitle = () => {
    return product.title || product.name || "Product";
  };

  const getProductPrice = () => {
    return typeof product.price === 'number' ? product.price.toFixed(2) : '0.00';
  };

  const getRating = () => {
    return product.rating || product.stars || 0;
  };

  const getReviewCount = () => {
    return product.reviewCount || product.num_reviews || 0;
  };

  return (
    <Card 
      className="group overflow-hidden cursor-pointer border-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-white rounded-xl"
      onClick={onProductClick}
    >
      {/* Image Section - Airbnb Style */}
      <div className="relative aspect-square overflow-hidden rounded-t-xl">
        <img
          src={getProductImage()}
          alt={getProductTitle()}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        
        {/* Status Badge - Top Left */}
        {statusBadge && (
          <div className="absolute top-3 left-3 z-10">
            <Badge className={cn("text-xs font-medium", statusBadge.color)}>
              {statusBadge.badge}
            </Badge>
          </div>
        )}

        {/* Vendor Badge - Top Left (below status) */}
        {isLocal && (
          <div className="absolute top-3 left-3 z-10" style={{ marginTop: statusBadge ? '32px' : '0' }}>
            <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs font-medium">
              <MapPin className="h-3 w-3 mr-1" />
              Local Vendor
            </Badge>
          </div>
        )}

        {/* Heart Icon - Top Right (Airbnb Style) */}
        <div className="absolute top-3 right-3 z-10" onClick={e => e.stopPropagation()}>
          {user ? (
            <WishlistSelectionPopoverButton
              product={{
                id: productId,
                name: getProductTitle(),
                image: getProductImage(),
                price: product.price,
                brand: product.brand || "",
              }}
              triggerClassName={cn(
                "p-2 rounded-full transition-colors shadow-sm",
                isWishlisted 
                  ? "bg-white text-pink-500 hover:bg-pink-50" 
                  : "bg-white/80 text-gray-600 hover:text-pink-500 hover:bg-white"
              )}
              onAdded={handleWishlistAdded}
            />
          ) : (
            <div className="p-2 bg-white/80 rounded-full shadow-sm">
              <Heart className="h-4 w-4 text-gray-600" />
            </div>
          )}
        </div>

        {/* Limited Time Badge - Bottom Right */}
        {product.tags?.includes("limited") && (
          <div className="absolute bottom-3 right-3 z-10">
            <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Limited
            </Badge>
          </div>
        )}
      </div>

      {/* Content Section - Clean Airbnb Style */}
      <div className="p-4 space-y-2">
        {/* Vendor Info for Local Products */}
        {isLocal && vendorInfo && (
          <div className="text-xs text-gray-500 flex items-center">
            <MapPin className="h-3 w-3 mr-1" />
            {vendorInfo.name} • {vendorInfo.location}
          </div>
        )}

        {/* Product Title */}
        <h3 className="font-medium text-gray-900 line-clamp-2 text-sm leading-snug">
          {getProductTitle()}
        </h3>

        {/* Brand */}
        {product.brand && (
          <p className="text-xs text-gray-500">
            {product.brand}
          </p>
        )}

        {/* Rating */}
        {getRating() > 0 && (
          <div className="flex items-center text-xs">
            <Star className="h-3 w-3 text-gray-900 fill-gray-900 mr-1" />
            <span className="font-medium text-gray-900">{getRating().toFixed(1)}</span>
            {getReviewCount() > 0 && (
              <span className="text-gray-500 ml-1">({getReviewCount()})</span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="pt-1">
          <span className="font-semibold text-gray-900">
            ${getProductPrice()}
          </span>
          {product.tags?.includes("trending") && (
            <span className="text-xs text-gray-500 ml-1">trending</span>
          )}
        </div>
      </div>
    </Card>
  );
};

export default AirbnbStyleProductCard;
