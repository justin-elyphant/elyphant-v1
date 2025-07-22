
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Heart, MapPin, Clock, ChevronLeft, ChevronRight, ShoppingCart, Share2 } from "lucide-react";
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
  onAddToCart?: (product: Product) => void;
  onShare?: (product: Product) => void;
}

const AirbnbStyleProductCard: React.FC<AirbnbStyleProductCardProps> = ({
  product,
  onProductClick,
  statusBadge,
  isLocal = false,
  vendorInfo,
  onAddToCart,
  onShare
}) => {
  const { user } = useAuth();
  const { isProductWishlisted, loadWishlists } = useUnifiedWishlist();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const productId = String(product.product_id || product.id);
  const isWishlisted = user ? isProductWishlisted(productId) : false;
  
  const handleWishlistAdded = async () => {
    await loadWishlists();
  };

  const getProductImage = () => {
    // Priority order for best image quality:
    // 1. main_image (highest quality from Zinc API)
    // 2. First image from images array
    // 3. Basic image field
    // 4. Fallback placeholder
    
    const highQualityImage = (product as any).main_image;
    if (highQualityImage) {
      return highQualityImage;
    }
    
    const images = product.images || [product.image] || ["/placeholder.svg"];
    const selectedImage = images[currentImageIndex] || images[0] || "/placeholder.svg";
    
    // If it's an Amazon image URL, try to get higher resolution version
    if (selectedImage && selectedImage.includes('amazon.com') && selectedImage.includes('._AC_UL320_')) {
      // Replace small resolution with larger one for better quality
      return selectedImage.replace('._AC_UL320_', '._AC_UL480_');
    }
    
    return selectedImage;
  };

  const getProductImages = () => {
    // Get all available images for carousel, prioritizing higher quality versions
    const mainImage = (product as any).main_image;
    const standardImages = product.images || [product.image] || ["/placeholder.svg"];
    
    // Combine and deduplicate images
    const allImages = mainImage ? [mainImage, ...standardImages] : standardImages;
    const uniqueImages = [...new Set(allImages.filter(Boolean))];
    
    // Enhance Amazon image URLs for better quality
    return uniqueImages.map(img => {
      if (img && img.includes('amazon.com') && img.includes('._AC_UL320_')) {
        return img.replace('._AC_UL320_', '._AC_UL480_');
      }
      return img;
    });
  };

  const getProductTitle = () => {
    return product.title || product.name || "Product";
  };

  const getProductPrice = () => {
    const price = typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0;
    // Ensure price is in dollars, not cents
    const normalizedPrice = price > 100 ? price / 100 : price;
    return normalizedPrice.toFixed(2);
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
      {/* Image Section - Airbnb Style with Enhanced Quality */}
      <div className="relative aspect-square overflow-hidden rounded-t-xl group">
        <img
          src={getProductImage()}
          alt={getProductTitle()}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            // Fallback to standard image if high-quality version fails
            const target = e.target as HTMLImageElement;
            if (target.src.includes('._AC_UL480_')) {
              target.src = target.src.replace('._AC_UL480_', '._AC_UL320_');
            }
          }}
        />
        
        {/* Image Navigation Arrows */}
        {getProductImages().length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex(prev => 
                  prev === 0 ? getProductImages().length - 1 : prev - 1
                );
              }}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-700 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex(prev => 
                  prev === getProductImages().length - 1 ? 0 : prev + 1
                );
              }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-700 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
        
        {/* Image Dots Indicator */}
        {getProductImages().length > 1 && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {getProductImages().map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(index);
                }}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
        
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

        {/* Brand - Always show brand or "Amazon" fallback */}
        <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">
          {(product.brand && product.brand.trim()) || "AMAZON"}
        </p>

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

        {/* Price and Actions Row */}
        <div className="pt-1 flex items-center justify-between">
          <div className="flex items-center">
            <span className="font-semibold text-gray-900">
              ${getProductPrice()}
            </span>
            {product.tags?.includes("trending") && (
              <span className="text-xs text-gray-500 ml-1">trending</span>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Share Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare?.(product);
              }}
              className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              title="Share product"
            >
              <Share2 className="h-4 w-4 text-gray-600" />
            </button>
            
            {/* Add to Cart Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart?.(product);
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-full hover:bg-gray-800 transition-colors"
              title="Add to cart"
            >
              <ShoppingCart className="h-3 w-3" />
              Add
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AirbnbStyleProductCard;
