
import React, { useEffect, useState, useRef, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, Share2, Star, X, RefreshCw, AlertCircle } from "lucide-react";
import { Product } from "@/types/product";
import { useAuth } from "@/contexts/auth";
import ProductDetailsActionsSection from "./ProductDetailsActionsSection";
import { cn } from "@/lib/utils";
import { enhancedZincApiService } from "@/services/enhancedZincApiService";
import { triggerHapticFeedback, HapticPatterns } from "@/utils/haptics";
import { toast } from "sonner";

interface MobileProductSheetProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isWishlisted?: boolean;
  onWishlistChange?: () => void;
}

const MobileProductSheet: React.FC<MobileProductSheetProps> = ({
  product,
  open,
  onOpenChange,
  isWishlisted = false,
  onWishlistChange
}) => {
  const [quantity, setQuantity] = useState(1);
  const [isHeartAnimating, setIsHeartAnimating] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [productData, setProductData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState<Record<number, boolean>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomCenter, setZoomCenter] = useState({ x: 50, y: 50 });
  const [isZooming, setIsZooming] = useState(false);
  
  const imageRef = useRef<HTMLImageElement>(null);
  const pullStartY = useRef<number>(0);
  const isPulling = useRef<boolean>(false);
  const { user } = useAuth();

  if (!product) return null;

  useEffect(() => {
    if (open) {
      setProductData(null);
      setCurrentImageIndex(0);
      setImageError({});
      setZoomLevel(1);
      setIsZooming(false);
      fetchData();
    }
  }, [open, product]);
  
  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
      triggerHapticFeedback(HapticPatterns.pullRefresh);
    } else {
      setIsLoading(true);
    }
    
    try {
      const zincProductDetailData = await enhancedZincApiService.getProductDetail(product.product_id || product.id);
      console.log(zincProductDetailData);
      setProductData(zincProductDetailData);
      
      if (isRefresh) {
        toast.success("Product details updated");
      }
    } catch (error) {
      console.error("Failed to fetch product data:", error);
      toast.error("Failed to load product details");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [product]);

  product.description = product.description || productData?.product_description;

  const images = Array.isArray(productData?.images) ? productData?.images : [productData?.image].filter(Boolean);

  // Enhanced swipe detection with momentum
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    
    // Pull to refresh detection
    if (e.targetTouches[0].clientY < 100) {
      pullStartY.current = e.targetTouches[0].clientY;
      isPulling.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
    
    // Handle pull to refresh
    if (isPulling.current && e.targetTouches[0].clientY > pullStartY.current + 100) {
      if (!isRefreshing) {
        fetchData(true);
      }
      isPulling.current = false;
    }
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentImageIndex < images.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
      triggerHapticFeedback(HapticPatterns.cardTap);
    }
    if (isRightSwipe && currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1);
      triggerHapticFeedback(HapticPatterns.cardTap);
    }
    
    isPulling.current = false;
  };

  // Pinch to zoom functionality
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.max(1, Math.min(3, zoomLevel + delta));
      setZoomLevel(newZoom);
      setIsZooming(newZoom > 1);
    }
  };

  const handleImageError = (index: number) => {
    setImageError(prev => ({ ...prev, [index]: true }));
    console.error(`Image at index ${index} failed to load`);
  };

  const handleImageRetry = (index: number) => {
    setImageError(prev => ({ ...prev, [index]: false }));
    triggerHapticFeedback(HapticPatterns.buttonTap);
  };

  // Product features extraction
  const productFeatures = Array.isArray(productData?.feature_bullets)
    ? productData?.feature_bullets.map(detail => detail?.toString())
    : [];
  const productDetails = Array.isArray(productData?.product_details)
    ? productData?.product_details.map(detail => detail?.toString())
    : [];

  const handleShare = async () => {
    triggerHapticFeedback(HapticPatterns.buttonTap);
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title || product.name,
          text: `Check out this product: ${product.title || product.name}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    }
  };

  const handleClose = () => {
    triggerHapticFeedback(HapticPatterns.buttonTap);
    onOpenChange(false);
  };

  const increaseQuantity = () => setQuantity(prev => Math.min(prev + 1, 10));
  const decreaseQuantity = () => setQuantity(prev => Math.max(prev - 1, 1));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[95vh] overflow-hidden rounded-t-2xl p-0 touch-manipulation border-t-0 safe-area-bottom"
        role="dialog"
        aria-labelledby="product-sheet-title"
        aria-describedby="product-sheet-description"
      >
        <div className="flex flex-col h-full">
          {/* Enhanced Header with Close Button and Pull-to-Refresh Indicator */}
          <div className="flex items-center justify-between p-4 border-b bg-white sticky top-0 z-50 safe-area-top">
            <div className="w-8" />
            <div className="flex flex-col items-center gap-1">
              <div className="w-12 h-1 bg-gray-300 rounded-full" />
              {isRefreshing && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  <span>Refreshing...</span>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="w-11 h-11 p-0 rounded-full hover:bg-gray-100 touch-target-44"
              aria-label={`Close ${product.title || product.name} details`}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Enhanced Image Section with Zoom and Error Handling */}
          <div className="relative bg-gray-50">
            <div 
              className="relative aspect-square overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onWheel={handleWheel}
              role="img"
              aria-label={`Product images for ${product.title || product.name}`}
            >
              {imageError[currentImageIndex] ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-500">
                  <AlertCircle className="h-12 w-12 mb-2" />
                  <p className="text-sm mb-3">Failed to load image</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleImageRetry(currentImageIndex)}
                    className="touch-target-44"
                  >
                    Retry
                  </Button>
                </div>
              ) : (
                <img
                  ref={imageRef}
                  src={images[currentImageIndex] || "/placeholder.svg"}
                  alt={`${product.title || product.name} - Image ${currentImageIndex + 1} of ${images.length}`}
                  className={cn(
                    "w-full h-full object-cover transition-transform duration-300",
                    isZooming && "cursor-zoom-out"
                  )}
                  style={{
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: `${zoomCenter.x}% ${zoomCenter.y}%`
                  }}
                  loading="lazy"
                  onError={() => handleImageError(currentImageIndex)}
                  onLoad={() => setImageError(prev => ({ ...prev, [currentImageIndex]: false }))}
                />
              )}
              
              {/* Enhanced Image Counter with better visibility */}
              {images.length > 1 && (
                <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-full text-sm backdrop-blur-sm font-medium">
                  {currentImageIndex + 1} of {images.length}
                </div>
              )}
              
              {/* Zoom indicator */}
              {isZooming && (
                <div className="absolute top-4 right-16 bg-black/70 text-white px-3 py-2 rounded-full text-xs backdrop-blur-sm">
                  {Math.round(zoomLevel * 100)}%
                </div>
              )}
              
              {/* Enhanced Navigation dots with better contrast and size */}
              {images.length > 1 && (
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-3">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentImageIndex(index);
                        triggerHapticFeedback(HapticPatterns.buttonTap);
                      }}
                      className={cn(
                        "w-4 h-4 rounded-full transition-all duration-300 touch-target-44 border-2",
                        index === currentImageIndex 
                          ? "bg-white border-white scale-125 shadow-lg" 
                          : "bg-transparent border-white/60 hover:border-white/80 hover:bg-white/20"
                      )}
                      aria-label={`View image ${index + 1} of ${images.length}`}
                      aria-current={index === currentImageIndex ? "true" : "false"}
                    />
                  ))}
                </div>
              )}
              
              {/* Enhanced Swipe Indicators */}
              {images.length > 1 && (
                <>
                  {currentImageIndex > 0 && (
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/80 text-sm font-medium bg-black/50 px-2 py-1 rounded">
                      ← Swipe
                    </div>
                  )}
                  {currentImageIndex < images.length - 1 && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/80 text-sm font-medium bg-black/50 px-2 py-1 rounded">
                      Swipe →
                    </div>
                  )}
                </>
              )}
              
              {/* Action buttons with improved accessibility */}
              <div className="absolute top-4 right-4 flex gap-2">
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={handleShare}
                  className="rounded-full bg-white/90 backdrop-blur-sm touch-target-44 w-11 h-11"
                  aria-label={`Share ${product.title || product.name}`}
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Content Section with improved accessibility */}
          <div className="flex-1 flex flex-col bg-white">
            <div className="p-6 space-y-4">
              <SheetHeader>
                <SheetTitle id="product-sheet-title" className="text-xl font-semibold text-left leading-tight">
                  {product.title || product.name}
                </SheetTitle>
              </SheetHeader>

              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-green-600" role="text" aria-label={`Price: $${product.price?.toFixed(2)}`}>
                  ${product.price?.toFixed(2)}
                </div>
                {product.rating && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground" role="group" aria-label="Product rating">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                    <span>{product.rating}</span>
                    {product.reviewCount && (
                      <span>({product.reviewCount} reviews)</span>
                    )}
                  </div>
                )}
              </div>

              {product.vendor && (
                <div className="text-sm text-muted-foreground">
                  By {product.vendor}
                </div>
              )}

              {/* Actions Section with enhanced accessibility */}
              <div className="border-t border-b py-6 my-4 bg-gray-50 -mx-6 px-6" role="group" aria-label="Product actions">
                <ProductDetailsActionsSection
                  product={product}
                  quantity={quantity}
                  onIncrease={increaseQuantity}
                  onDecrease={decreaseQuantity}
                  isHeartAnimating={isHeartAnimating}
                  isWishlisted={isWishlisted}
                  reloadWishlists={onWishlistChange}
                />
              </div>
            </div>

            {/* Scrollable Content with loading state */}
            <ScrollArea className="flex-1 px-6 pb-8" role="region" aria-label="Product details">
              {isLoading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6" id="product-sheet-description">
                  {product.description && (
                    <section>
                      <h4 className="font-semibold mb-3 text-lg">Description</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {product.description}
                      </p>
                    </section>
                  )}

                  {productFeatures.length > 0 && (
                    <section>
                      <h4 className="font-semibold mb-3 text-lg">Key Features</h4>
                      <ul className="text-sm space-y-2" role="list">
                        {productFeatures.slice(0, 5).map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-3" role="listitem">
                            <span className="text-green-500 mt-1 text-base" aria-hidden="true">•</span>
                            <span className="text-muted-foreground leading-relaxed">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {productDetails.length > 0 && (
                    <section>
                      <h4 className="font-semibold mb-3 text-lg">Product Details</h4>
                      <ul className="text-sm space-y-2" role="list">
                        {productDetails.slice(0, 8).map((detail, idx) => (
                          <li key={idx} className="flex items-start gap-3" role="listitem">
                            <span className="text-green-500 mt-1 text-base" aria-hidden="true">•</span>
                            <span className="text-muted-foreground leading-relaxed">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileProductSheet;
