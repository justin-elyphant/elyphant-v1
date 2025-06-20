
import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Star, Minus, Plus, Heart, Share2, ShoppingCart, Zap } from "lucide-react";
import { Product } from "@/types/product";
import { useUnifiedWishlist } from "@/hooks/useUnifiedWishlist";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { triggerHapticFeedback, HapticPatterns } from "@/utils/haptics";
import { prefersReducedMotion, announceToScreenReader } from "@/utils/accessibility";

interface MobileProductSheetProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isWishlisted: boolean;
  onWishlistChange?: () => void;
}

const MobileProductSheet = ({
  product,
  open,
  onOpenChange,
  isWishlisted,
  onWishlistChange
}: MobileProductSheetProps) => {
  const [quantity, setQuantity] = useState(1);
  const [isHeartAnimating, setIsHeartAnimating] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  const { addToWishlist, removeFromWishlist } = useUnifiedWishlist();
  const { toast } = useToast();
  const reducedMotion = prefersReducedMotion();

  // Reset states when sheet opens/closes
  useEffect(() => {
    if (!open) {
      setQuantity(1);
      setIsHeartAnimating(false);
      setImageError(false);
      setIsZoomed(false);
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [open]);

  // Handle wishlist toggle
  const handleWishlistToggle = async () => {
    if (!product) return;
    
    setIsHeartAnimating(true);
    triggerHapticFeedback(isWishlisted ? HapticPatterns.wishlistRemove : HapticPatterns.wishlistAdd);
    
    try {
      if (isWishlisted) {
        await removeFromWishlist(product.product_id || product.id || '');
        announceToScreenReader(`${product.title || product.name} removed from wishlist`);
      } else {
        await addToWishlist(product);
        announceToScreenReader(`${product.title || product.name} added to wishlist`);
      }
      
      // Call the parent's wishlist change handler
      if (onWishlistChange) {
        onWishlistChange();
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      toast({
        title: "Error",
        description: "Failed to update wishlist",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => setIsHeartAnimating(false), 300);
    }
  };

  // Handle add to cart
  const handleAddToCart = () => {
    triggerHapticFeedback(HapticPatterns.addToCart);
    announceToScreenReader(`Added ${quantity} ${product.title || product.name} to cart`);
    toast({
      title: "Added to Cart",
      description: `${quantity}x ${product.title || product.name}`,
    });
  };

  // Handle buy now
  const handleBuyNow = () => {
    triggerHapticFeedback(HapticPatterns.buttonTap);
    announceToScreenReader(`Proceeding to checkout with ${product.title || product.name}`);
    // Navigate to checkout logic would go here
  };

  // Handle share
  const handleShare = async () => {
    triggerHapticFeedback(HapticPatterns.shareAction);
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title || product.name || "Check out this product",
          text: `Check out this product: ${product.title || product.name}`,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled sharing or error occurred
        console.log('Share cancelled or failed:', error);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Product link copied to clipboard",
      });
    }
  };

  // Handle image error
  const handleImageError = () => {
    setImageError(true);
  };

  // Handle image zoom (pinch-to-zoom simulation)
  const handleImageInteraction = (event: React.TouchEvent | React.MouseEvent) => {
    if (event.type === 'touchstart' && 'touches' in event && event.touches.length === 2) {
      // Pinch zoom detected
      setIsZoomed(true);
    } else if (event.type === 'click') {
      // Toggle zoom on click/tap
      setIsZoomed(!isZoomed);
      setScale(isZoomed ? 1 : 2);
    }
  };

  // Quantity controls
  const increaseQuantity = () => {
    if (quantity < 10) {
      setQuantity(prev => prev + 1);
      triggerHapticFeedback(HapticPatterns.buttonTap);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
      triggerHapticFeedback(HapticPatterns.buttonTap);
    }
  };

  if (!product) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] p-0 rounded-t-xl overflow-hidden safe-area-bottom"
      >
        {/* Pull indicator */}
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-2 mb-4" />
        
        <div className="flex flex-col h-full">
          {/* Product Image */}
          <div className="relative bg-gray-50 flex-shrink-0" style={{ height: '40vh' }}>
            {imageError ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <div className="text-4xl mb-2">📷</div>
                  <div className="text-sm">Image not available</div>
                </div>
              </div>
            ) : (
              <img
                src={product.image}
                alt={product.title || product.name || "Product"}
                className={cn(
                  "w-full h-full object-contain transition-transform duration-300",
                  isZoomed && "cursor-zoom-out",
                  !isZoomed && "cursor-zoom-in"
                )}
                style={{
                  transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
                }}
                onError={handleImageError}
                onClick={handleImageInteraction}
                onTouchStart={handleImageInteraction}
              />
            )}
            
            {/* Action buttons overlay */}
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full bg-white/90 backdrop-blur-sm shadow-sm border-0"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "rounded-full bg-white/90 backdrop-blur-sm shadow-sm border-0",
                  isWishlisted && "bg-red-50 text-red-600",
                  isHeartAnimating && !reducedMotion && "animate-pulse"
                )}
                onClick={handleWishlistToggle}
              >
                <Heart className={cn("h-4 w-4", isWishlisted && "fill-current")} />
              </Button>
            </div>
          </div>

          {/* Product Details - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              <SheetHeader>
                <SheetTitle className="text-xl font-semibold text-left">
                  {product.title || product.name}
                </SheetTitle>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-green-600">
                    ${product.price?.toFixed(2)}
                  </div>
                  {product.rating && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{product.rating}</span>
                      {product.reviewCount && (
                        <span>({product.reviewCount})</span>
                      )}
                    </div>
                  )}
                </div>
                {product.vendor && (
                  <div className="text-sm text-muted-foreground">
                    By {product.vendor}
                  </div>
                )}
              </SheetHeader>

              <Separator />

              {/* Quantity Selector */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Quantity</label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={decreaseQuantity}
                    disabled={quantity <= 1}
                    className="h-10 w-10 rounded-full"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-lg font-medium min-w-[2rem] text-center">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={increaseQuantity}
                    disabled={quantity >= 10}
                    className="h-10 w-10 rounded-full"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Product Description */}
              {product.description && (
                <div className="space-y-2">
                  <h4 className="font-medium">Description</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Actions - Fixed */}
          <div className="border-t bg-white p-4 space-y-3 safe-area-bottom">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleAddToCart}
                className="flex-1 h-12"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
              <Button
                onClick={handleBuyNow}
                className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Zap className="h-4 w-4 mr-2" />
                Buy Now
              </Button>
            </div>
            <div className="text-xs text-center text-muted-foreground">
              Free shipping on orders over $35
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileProductSheet;
