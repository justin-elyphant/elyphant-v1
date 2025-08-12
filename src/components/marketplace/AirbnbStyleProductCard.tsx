
import React, { useState, memo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Heart, MapPin, Clock, ChevronLeft, ChevronRight, ShoppingCart, Share, Truck } from "lucide-react";
import { Product } from "@/types/product";
import { useUnifiedWishlist } from "@/hooks/useUnifiedWishlist";
import { useAuth } from "@/contexts/auth";
import { cn, formatPrice } from "@/lib/utils";
import WishlistSelectionPopoverButton from "@/components/gifting/wishlist/WishlistSelectionPopoverButton";
import AddToCartButton from "@/components/marketplace/components/AddToCartButton";
import SocialShareButton from "@/components/marketplace/product-item/SocialShareButton";
import SignUpDialog from "@/components/marketplace/SignUpDialog";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useProductDataSync } from "@/hooks/useProductDataSync";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ProductStatusBadges from "@/components/gifting/ProductStatusBadges";
import OptimizedImage from "./ui/OptimizedImage";

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
  // Additional props for unified support
  viewMode?: "grid" | "list" | "modern";
  isFavorited?: boolean;
  onToggleFavorite?: (e: React.MouseEvent) => void;
  onClick?: () => void;
  onWishlistClick?: () => void;
  isWishlisted?: boolean;
  isGifteeView?: boolean;
  onToggleWishlist?: () => void;
}

const AirbnbStyleProductCard: React.FC<AirbnbStyleProductCardProps> = memo(({
  product,
  onProductClick,
  statusBadge,
  isLocal = false,
  vendorInfo,
  onAddToCart,
  onShare,
  // Additional unified props
  viewMode = "grid",
  isFavorited,
  onToggleFavorite,
  onClick,
  onWishlistClick,
  isWishlisted: propIsWishlisted,
  isGifteeView = true,
  onToggleWishlist
}) => {
  const { user } = useAuth();
  const { isProductWishlisted, loadWishlists } = useUnifiedWishlist();
  const { addItem } = useRecentlyViewed();
  const { trackProductView } = useProductDataSync();
  const isMobile = useIsMobile();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showSignUpDialog, setShowSignUpDialog] = useState(false);
  
  const productId = String(product.product_id || product.id);
  // Use prop isWishlisted if provided, otherwise use unified wishlist system
  const isWishlisted = propIsWishlisted !== undefined 
    ? propIsWishlisted 
    : (user ? isProductWishlisted(productId) : false);
  
  const handleWishlistAdded = async () => {
    await loadWishlists();
    onToggleWishlist?.();
    onWishlistClick?.();
    onToggleFavorite?.({} as React.MouseEvent);
  };

  const handleCardClick = () => {
    // Add to recently viewed and track
    addItem({
      id: productId,
      title: getProductTitle(),
      image: getProductImage(),
      price: product.price
    });
    trackProductView(product);
    
    // Use onClick prop if provided, otherwise onProductClick
    if (onClick) {
      onClick();
    } else {
      onProductClick();
    }
  };

  const handleWishlistClick = () => {
    if (!user) {
      setShowSignUpDialog(true);
      return;
    }
    console.log('Wishlist clicked for product:', productId);
  };

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('Add to cart clicked for product:', product);
    
    if (onAddToCart) {
      onAddToCart(product);
    } else {
      console.warn('No onAddToCart handler provided');
    }
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
    return formatPrice(normalizedPrice);
  };

  const getRating = () => {
    return product.rating || product.stars || 0;
  };

  const getReviewCount = () => {
    return product.reviewCount || product.num_reviews || 0;
  };

  // Additional helper functions from other cards
  const getSalePrice = () => {
    return (product as any).sale_price || null;
  };

  const hasDiscount = () => {
    return getSalePrice() && getSalePrice()! < product.price;
  };

  const isFreeShipping = () => {
    return product.prime || (product as any).free_shipping || false;
  };

  const isRecentlyViewed = () => {
    return (product as any).recentlyViewed;
  };

  const isNewArrival = () => {
    return product.tags?.includes("new") || (product.id && Number(product.id) > 9000);
  };

  const isBestSeller = () => {
    return product.isBestSeller || product.tags?.includes("bestseller") || false;
  };

  const getBestSellerType = () => {
    return product.bestSellerType || null;
  };

  const getBadgeText = () => {
    return product.badgeText || null;
  };

  return (
    <>
      <Card 
        className={cn(
          "group overflow-hidden cursor-pointer border-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-white rounded-xl h-full flex flex-col",
          viewMode === "list" && "flex flex-row h-auto",
          isWishlisted && "border-2 border-pink-200 hover:border-pink-300",
          isMobile && "active:scale-[0.98] touch-manipulation"
        )}
        onClick={handleCardClick}
      >
      {/* Image Section - Airbnb Style with Enhanced Quality */}
      <div className={cn(
        "relative overflow-hidden group",
        viewMode === "list" ? "w-32 h-32 flex-shrink-0 rounded-l-xl" : "aspect-square rounded-t-xl"
      )}>
        <OptimizedImage
          src={getProductImage()}
          alt={getProductTitle()}
          className="group-hover:scale-105 transition-transform duration-300"
          aspectRatio="square"
          priority={currentImageIndex === 0}
          quality={80}
          sizes="300px"
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
        
        {/* Product Status Badges - Top Left */}
        <ProductStatusBadges
          isBestSeller={isBestSeller()}
          isNewArrival={isNewArrival()}
          isRecentlyViewed={isRecentlyViewed()}
          bestSellerType={getBestSellerType()}
          badgeText={getBadgeText()}
          product={product}
        />

        {/* Custom Status Badge - Top Left (below product status badges) */}
        {statusBadge && (
          <div className="absolute top-20 left-2 z-10">
            <Badge className={cn("text-xs font-medium", statusBadge.color)}>
              {statusBadge.badge}
            </Badge>
          </div>
        )}

        {/* Vendor Badge - Top Left (below other badges) */}
        {isLocal && (
          <div className="absolute left-2 z-10" style={{ top: statusBadge ? '144px' : '80px' }}>
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
              isWishlisted={isWishlisted}
            />
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleWishlistClick();
              }}
              className="p-2 bg-white/80 rounded-full shadow-sm hover:bg-white transition-colors"
            >
              <Heart className="h-4 w-4 text-gray-600 hover:text-pink-500 transition-colors" />
            </button>
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
      <div className="p-4 space-y-2 flex-1 flex flex-col">
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


        {/* Free Shipping Indicator */}
        {isFreeShipping() && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center text-xs text-green-600">
                  <Truck className="h-3 w-3 mr-1" />
                  <span>Free shipping</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Free shipping on this item</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Tags Display */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {product.tags.slice(0, 2).map((tag: string, i: number) => (
              <span 
                key={i} 
                className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-sm"
              >
                {tag}
              </span>
            ))}
            {product.tags.length > 2 && (
              <span className="text-xs text-gray-500">+{product.tags.length - 2}</span>
            )}
          </div>
        )}

        {/* Bottom Section: Price Left, Actions Right */}
        <div className="flex items-center justify-between pt-2 mt-auto">
          {/* Price Section - Bottom Left */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              {hasDiscount() ? (
                <>
                  <span className="font-bold text-lg text-gray-900">
                    {formatPrice(getSalePrice() || 0)}
                  </span>
                  <span className="text-sm text-gray-500 line-through">
                    {getProductPrice()}
                  </span>
                </>
              ) : (
                <span className="font-bold text-lg text-gray-900">
                  {getProductPrice()}
                </span>
              )}
            </div>
            {product.tags?.includes("trending") && (
              <span className="text-xs text-orange-600 font-medium">trending</span>
            )}
          </div>

          {/* Action Buttons - Bottom Right */}
          <div className="flex items-center gap-1">
            {/* Share Button */}
            {onShare ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onShare(product);
                }}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-800"
                title="Share product"
              >
                <Share className="h-4 w-4" />
              </button>
            ) : (
              <SocialShareButton
                product={{
                  ...product,
                  id: productId,
                  name: getProductTitle()
                } as any}
                variant="ghost"
                size="sm"
                className="p-2 hover:bg-gray-100"
              />
            )}
            
            {/* Add to Cart Button */}
            {viewMode === "list" || isMobile ? (
              <AddToCartButton
                product={product}
                variant="luxury"
                size="sm"
                className="min-w-[80px]"
                onClick={handleAddToCartClick}
              />
            ) : (
              <button
                onClick={handleAddToCartClick}
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
                title="Add to cart"
              >
                <ShoppingCart className="h-4 w-4" />
                Add
              </button>
            )}
          </div>
        </div>
      </div>
      </Card>

      {/* Sign Up Dialog */}
      <SignUpDialog 
        open={showSignUpDialog} 
        onOpenChange={setShowSignUpDialog} 
      />
    </>
  );
});

AirbnbStyleProductCard.displayName = "AirbnbStyleProductCard";

export default AirbnbStyleProductCard;
