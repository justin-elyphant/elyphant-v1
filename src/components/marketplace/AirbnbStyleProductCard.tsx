
import React, { useState, memo } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Heart, MapPin, Clock, ChevronLeft, ChevronRight, ShoppingCart, Share, Truck } from "lucide-react";
import { Product } from "@/types/product";
import { useUnifiedWishlistSystem } from "@/hooks/useUnifiedWishlistSystem";
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
import ColorSwatches from "./ColorSwatches";
import { getHighResAmazonImage, getAmazonImageSrcSet } from "@/utils/amazonImageOptimizer";
import ProductRating from "@/components/shared/ProductRating";

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
  // Category section specific prop for image ratio
  isInCategorySection?: boolean;
  // Context for button priority
  context?: 'marketplace' | 'wishlist';
  // Hide top right action icon
  hideTopRightAction?: boolean;
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
  onToggleWishlist,
  isInCategorySection = false,
  context = 'marketplace',
  hideTopRightAction = false
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isProductWishlisted, loadWishlists, wishlists } = useUnifiedWishlistSystem();
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
  
  // Count how many wishlists contain this product
  const wishlistCount = user ? wishlists.filter(wl => 
    wl.items?.some(item => String(item.product_id) === productId)
  ).length : 0;
  
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
    
    // Navigate to full-page product details
    if (onClick) {
      onClick();
    } else {
      navigate(`/marketplace/product/${productId}`, {
        state: { 
          product, 
          context: context || 'marketplace',
          returnPath: window.location.pathname + window.location.search
        }
      });
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
      return getHighResAmazonImage(highQualityImage, 'card');
    }
    
    const images = product.images || [product.image] || ["/placeholder.svg"];
    const selectedImage = images[currentImageIndex] || images[0] || "/placeholder.svg";
    
    // Optimize Amazon images for card context (1500px for sharp retina display)
    return getHighResAmazonImage(selectedImage, 'card');
  };

  const getProductImages = () => {
    // Get all available images for carousel, prioritizing higher quality versions
    const mainImage = (product as any).main_image;
    const standardImages = product.images || [product.image] || ["/placeholder.svg"];
    
    // Combine and deduplicate images
    const allImages = mainImage ? [mainImage, ...standardImages] : standardImages;
    const uniqueImages = [...new Set(allImages.filter(Boolean))];
    
    // Optimize all Amazon images to high-resolution
    return uniqueImages.map(img => getHighResAmazonImage(img, 'card'));
  };

  const getProductTitle = () => {
    return product.title || product.name || "Product";
  };

  const getProductPrice = () => {
    const price = typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0;
    // Zinc API returns prices in dollars, format directly
    return formatPrice(price);
  };

  const getRating = () => {
    return product.stars || product.rating || product.metadata?.stars || 0;
  };

  const getReviewCount = () => {
    return product.review_count || product.reviewCount || product.num_reviews || 
           product.metadata?.review_count || 0;
  };

  // Additional helper functions from other cards
  const getSalePrice = () => {
    return (product as any).sale_price || null;
  };

  const hasDiscount = () => {
    return getSalePrice() && getSalePrice()! < product.price;
  };

  const isFreeShipping = () => {
    return false; // Disabled as free shipping is not offered
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
          "group overflow-hidden cursor-pointer border-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-white rounded-xl h-full flex flex-col gpu-accelerated relative z-0",
          viewMode === "list" && "flex flex-row h-auto",
          isWishlisted && "border-2 border-pink-200 hover:border-pink-300",
          isMobile && "active:scale-[0.98] touch-manipulation mobile-card-hover"
        )}
        onClick={handleCardClick}
      >
      {/* Image Section - Airbnb Style with Enhanced Quality */}
      <div className={cn(
        "relative overflow-hidden group",
        viewMode === "list" ? "w-32 h-32 flex-shrink-0 rounded-l-xl" : 
        isInCategorySection ? "aspect-[4/3] rounded-t-xl" : "aspect-square rounded-t-xl"
      )}>
        <img
          src={getProductImage()}
          srcSet={getAmazonImageSrcSet(getProductImage())}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          alt={getProductTitle()}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            console.log('Image failed to load:', getProductImage());
            (e.target as HTMLImageElement).src = '/placeholder.svg';
          }}
          onLoad={() => console.log('Image loaded successfully:', getProductImage())}
        />
        
        

        {/* Heart Icon - Top Right (Lululemon Style - Simple Outline) - Hide in wishlist context since heart is at bottom */}
        {!hideTopRightAction && context !== 'wishlist' && (
          <div className="absolute top-3 right-3 z-50" onClick={e => e.stopPropagation()}>
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
                  "p-2 rounded-full shadow-sm transition-all backdrop-blur-sm",
                  isWishlisted 
                    ? "bg-foreground hover:bg-foreground/90" 
                    : "bg-white/90 hover:bg-white"
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
                className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors"
              >
                <Heart className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        )}

      </div>

      {/* Content Section - Clean Airbnb Style */}
      <div className={cn(
        "p-3 flex-1 flex flex-col justify-between",
        isInCategorySection && "max-h-36",
        isMobile && "p-2"
      )}>
        {/* Vendor Info for Local Products */}
        {isLocal && vendorInfo && (
          <div className="text-xs text-gray-500 flex items-center">
            <MapPin className="h-3 w-3 mr-1" />
            {vendorInfo.name} • {vendorInfo.location}
          </div>
        )}

        {/* Color Swatches - Lululemon Style */}
        <ColorSwatches 
          colors={(product as any).colors || []}
          maxVisible={5}
          className="mb-2"
        />

        {/* Title and Price - Single Row (Lululemon Style) */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-medium text-foreground text-sm leading-snug flex-1 line-clamp-2">
            {getProductTitle()}
          </h3>
          <span className="font-semibold text-foreground text-sm whitespace-nowrap shrink-0">
            {getProductPrice()}
          </span>
        </div>

        {/* Rating - Using Shared Component */}
        <ProductRating 
          rating={getRating()}
          reviewCount={getReviewCount()}
          size="sm"
          className="mb-2"
        />

        {/* Bottom Section: Action Buttons */}
        <div className="flex items-center justify-end pt-1 mt-auto">

          {/* Action Buttons - Bottom Right - Context Aware */}
          <div className="flex items-center gap-1 relative z-30">
            {/* Share Button - First */}
            <div onClick={(e) => e.stopPropagation()}>
              <SocialShareButton
                product={{
                  id: productId,
                  name: getProductTitle(),
                  image: getProductImage(),
                  price: product.price,
                  brand: product.brand || "",
                }}
                variant="ghost"
                size="sm"
                className={cn(
                  "rounded-full",
                  isMobile ? "min-w-[44px] min-h-[44px]" : "w-9 h-9"
                )}
              />
            </div>

            {/* Primary Action Button - Context Aware */}
            {context === 'wishlist' ? (
              // Wishlist context: Heart/Wishlist button prominent
              viewMode === "list" ? (
                user ? (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <WishlistSelectionPopoverButton
                      product={{
                        id: productId,
                        name: getProductTitle(),
                        image: getProductImage(),
                        price: product.price,
                        brand: product.brand || "",
                      }}
                      triggerClassName="min-w-[80px] h-8"
                      onAdded={handleWishlistAdded}
                    />
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWishlistClick();
                    }}
                    className="px-3 py-1.5 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors text-sm font-medium"
                  >
                    Add
                  </button>
                )
              ) : (
                user ? (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <WishlistSelectionPopoverButton
                      product={{
                        id: productId,
                        name: getProductTitle(),
                        image: getProductImage(),
                        price: product.price,
                        brand: product.brand || "",
                      }}
                      triggerClassName={cn(
                        "flex items-center justify-center rounded-full transition-all shadow-sm shrink-0",
                        isMobile ? "min-w-[44px] min-h-[44px] touch-target-44" : "w-9 h-9",
                        isWishlisted 
                          ? "bg-gray-900 text-white hover:bg-gray-800" 
                          : "bg-gray-900 text-white hover:bg-gray-800"
                      )}
                      onAdded={handleWishlistAdded}
                      isWishlisted={isWishlisted}
                    />
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWishlistClick();
                    }}
                    className={cn(
                      "flex items-center justify-center bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-all shadow-sm shrink-0",
                      isMobile ? "min-w-[44px] min-h-[44px] touch-target-44" : "w-9 h-9"
                    )}
                    aria-label="Add to wishlist"
                  >
                    <Heart className="h-4 w-4" />
                  </button>
                )
              )
            ) : (
              // Marketplace context: Cart button prominent
              viewMode === "list" ? (
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
                  className={cn(
                    "flex items-center justify-center bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors shadow-sm shrink-0",
                    isMobile ? "min-w-[44px] min-h-[44px] touch-target-44" : "w-9 h-9"
                  )}
                  aria-label="Add to cart"
                  title="Add to cart"
                >
                  <ShoppingCart className="h-4 w-4" />
                </button>
              )
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
