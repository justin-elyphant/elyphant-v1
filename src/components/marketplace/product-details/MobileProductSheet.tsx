
import React, { useState, useRef, useCallback, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Share2, Heart, ShoppingCart, RefreshCw } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { triggerHapticFeedback, HapticPatterns } from "@/utils/haptics";
import { prefersReducedMotion, announceToScreenReader } from "@/utils/accessibility";
import { Product } from "@/types/product";

interface MobileProductSheetProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToWishlist?: (productId: string) => void;
  onShare?: (product: Product) => void;
  isWishlisted?: boolean;
}

const MobileProductSheet: React.FC<MobileProductSheetProps> = ({
  product,
  open,
  onOpenChange,
  onAddToWishlist,
  onShare,
  isWishlisted = false
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  
  const sheetRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = prefersReducedMotion();
  
  // Get product images
  const images = product?.images && product.images.length > 0 
    ? product.images 
    : product?.image 
      ? [product.image] 
      : ['/placeholder.svg'];
  
  const validImages = images.filter((_, index) => !imageErrors[index]);

  // Reset state when product changes
  useEffect(() => {
    if (product) {
      setCurrentImageIndex(0);
      setImageErrors({});
      setIsZoomed(false);
      setZoomLevel(1);
    }
  }, [product?.product_id]);

  // Handle image error
  const handleImageError = useCallback((index: number) => {
    setImageErrors(prev => ({ ...prev, [index]: true }));
    announceToScreenReader(`Image ${index + 1} failed to load`, 'assertive');
  }, []);

  // Pull to refresh handler
  const handlePullToRefresh = useCallback(async () => {
    if (isRefreshing || !product) return;
    
    setIsRefreshing(true);
    triggerHapticFeedback(HapticPatterns.pullRefresh);
    
    try {
      // Simulate refresh - in real implementation, this would refetch product data
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Product details refreshed");
      announceToScreenReader("Product details have been refreshed");
    } catch (error) {
      toast.error("Failed to refresh product details");
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, product]);

  // Handle close with haptic feedback
  const handleClose = useCallback(() => {
    triggerHapticFeedback(HapticPatterns.buttonTap);
    onOpenChange(false);
  }, [onOpenChange]);

  // Handle wishlist toggle
  const handleWishlistToggle = useCallback(() => {
    if (!product) return;
    
    triggerHapticFeedback(isWishlisted ? HapticPatterns.wishlistRemove : HapticPatterns.wishlistAdd);
    onAddToWishlist?.(product.product_id);
    
    const message = isWishlisted 
      ? `Removed ${product.name || product.title} from wishlist`
      : `Added ${product.name || product.title} to wishlist`;
    
    toast.success(message);
    announceToScreenReader(message);
  }, [product, isWishlisted, onAddToWishlist]);

  // Handle share
  const handleShare = useCallback(() => {
    if (!product) return;
    
    triggerHapticFeedback(HapticPatterns.shareAction);
    onShare?.(product);
  }, [product, onShare]);

  // Pinch to zoom handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      // Store initial pinch distance
      if (imageContainerRef.current) {
        imageContainerRef.current.dataset.initialPinchDistance = distance.toString();
      }
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && imageContainerRef.current) {
      e.preventDefault();
      
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      const initialDistance = parseFloat(imageContainerRef.current.dataset.initialPinchDistance || '0');
      
      if (initialDistance > 0) {
        const scale = Math.max(1, Math.min(3, currentDistance / initialDistance));
        setZoomLevel(scale);
        setIsZoomed(scale > 1);
        
        // Calculate zoom center point
        const rect = imageContainerRef.current.getBoundingClientRect();
        const centerX = ((touch1.clientX + touch2.clientX) / 2 - rect.left) / rect.width * 100;
        const centerY = ((touch1.clientY + touch2.clientY) / 2 - rect.top) / rect.height * 100;
        
        setZoomPosition({ x: centerX, y: centerY });
      }
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (imageContainerRef.current) {
      delete imageContainerRef.current.dataset.initialPinchDistance;
    }
    
    // Reset zoom if scale is less than 1.2
    if (zoomLevel < 1.2) {
      setZoomLevel(1);
      setIsZoomed(false);
    }
  }, [zoomLevel]);

  if (!product) return null;

  const productName = product.name || product.title || 'Unknown Product';
  const productPrice = product.price || 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        ref={sheetRef}
        side="bottom" 
        className="h-[90vh] rounded-t-xl safe-area-bottom"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <SheetHeader className="flex-row items-center justify-between py-4 border-b">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold truncate">{productName}</h2>
            <p className="text-sm text-muted-foreground">
              By {product.brand || product.vendor || 'Unknown Brand'}
            </p>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="touch-target-44 ml-2"
            aria-label="Close product details"
          >
            <X className="h-5 w-5" />
          </Button>
        </SheetHeader>

        {/* Pull to refresh indicator */}
        {isRefreshing && (
          <div className="flex items-center justify-center py-2 border-b bg-blue-50">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm text-blue-600">Refreshing...</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {/* Image Carousel */}
          <div className="relative">
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
              setApi={(api) => {
                if (api) {
                  api.on('select', () => {
                    setCurrentImageIndex(api.selectedScrollSnap());
                    triggerHapticFeedback(HapticPatterns.imageSwipe);
                  });
                }
              }}
            >
              <CarouselContent>
                {validImages.map((image, index) => (
                  <CarouselItem key={`${image}-${index}`}>
                    <div 
                      ref={imageContainerRef}
                      className="aspect-square relative overflow-hidden bg-gray-50 rounded-lg"
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                    >
                      <img
                        src={image}
                        alt={`${productName} - Image ${index + 1}`}
                        className={cn(
                          "w-full h-full object-contain",
                          !reducedMotion && "transition-transform duration-200"
                        )}
                        style={isZoomed ? {
                          transform: `scale(${zoomLevel})`,
                          transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`
                        } : {}}
                        onError={() => handleImageError(index)}
                        loading={index === 0 ? "eager" : "lazy"}
                      />
                      
                      {/* Image counter */}
                      <Badge 
                        variant="secondary" 
                        className="absolute top-3 left-3 bg-black/70 text-white"
                      >
                        {currentImageIndex + 1} of {validImages.length}
                      </Badge>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              
              {validImages.length > 1 && (
                <>
                  <CarouselPrevious className="absolute left-3 top-1/2 -translate-y-1/2" />
                  <CarouselNext className="absolute right-3 top-1/2 -translate-y-1/2" />
                </>
              )}
            </Carousel>

            {/* Larger navigation dots */}
            {validImages.length > 1 && (
              <div className="flex justify-center mt-4 gap-2">
                {validImages.map((_, index) => (
                  <button
                    key={index}
                    className={cn(
                      "w-3 h-3 rounded-full transition-all touch-target-44",
                      index === currentImageIndex
                        ? "bg-purple-600 scale-125"
                        : "bg-gray-300 hover:bg-gray-400"
                    )}
                    onClick={() => setCurrentImageIndex(index)}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-green-600">
                ${productPrice.toFixed(2)}
              </div>
              
              {product.rating && (
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500">★</span>
                  <span className="text-sm font-medium">{product.rating}</span>
                  {product.reviewCount && (
                    <span className="text-sm text-muted-foreground">
                      ({product.reviewCount})
                    </span>
                  )}
                </div>
              )}
            </div>

            {product.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                size="icon"
                onClick={handleWishlistToggle}
                className={cn(
                  "touch-target-44",
                  isWishlisted && "text-red-500 border-red-200 bg-red-50"
                )}
                aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart className={cn("h-5 w-5", isWishlisted && "fill-current")} />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                onClick={handleShare}
                className="touch-target-44"
                aria-label="Share product"
              >
                <Share2 className="h-5 w-5" />
              </Button>
              
              <Button 
                className="flex-1 touch-target-44"
                onClick={() => {
                  triggerHapticFeedback(HapticPatterns.addToCart);
                  toast.success("Added to cart!");
                }}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileProductSheet;
