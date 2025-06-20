
import React, { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Heart, Share2, Plus, Minus } from "lucide-react";
import { Product } from "@/types/product";
import { useIsMobile } from "@/hooks/use-mobile";
import { triggerHapticFeedback, HapticPatterns } from "@/utils/haptics";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface MobileProductSheetProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isWishlisted: boolean;
  onWishlistChange: () => Promise<void>;
}

const MobileProductSheet: React.FC<MobileProductSheetProps> = ({
  product,
  open,
  onOpenChange,
  isWishlisted,
  onWishlistChange
}) => {
  const [quantity, setQuantity] = useState(1);
  const [isHeartAnimating, setIsHeartAnimating] = useState(false);
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { toast } = useToast();

  const increaseQuantity = () => {
    setQuantity(prev => Math.min(prev + 1, 10));
    if (isMobile) triggerHapticFeedback(HapticPatterns.buttonTap);
  };

  const decreaseQuantity = () => {
    setQuantity(prev => Math.max(prev - 1, 1));
    if (isMobile) triggerHapticFeedback(HapticPatterns.buttonTap);
  };

  const handleWishlistClick = async () => {
    if (!user) {
      toast("Please sign in to add items to your wishlist");
      return;
    }

    setIsHeartAnimating(true);
    
    try {
      await onWishlistChange();
      
      toast(isWishlisted 
        ? "Item removed from your wishlist" 
        : "Item added to your wishlist"
      );
    } catch (error) {
      console.error('Wishlist action failed:', error);
      toast("Failed to update wishlist");
    } finally {
      setTimeout(() => setIsHeartAnimating(false), 300);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        url: window.location.href,
      });
    }
    if (isMobile) triggerHapticFeedback(HapticPatterns.shareAction);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] flex flex-col">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="text-left">
            {product.title || product.name}
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Product Image */}
          <div className="relative bg-gray-50 rounded-lg aspect-square flex items-center justify-center">
            <img
              src={product.image}
              alt={product.title || product.name || "Product"}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            
            {/* Action buttons overlay */}
            <div className="absolute top-2 right-2 flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-white/90 backdrop-blur-sm"
                onClick={handleWishlistClick}
              >
                <Heart 
                  className={`h-4 w-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''} ${isHeartAnimating ? 'animate-pulse' : ''}`} 
                />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-white/90 backdrop-blur-sm"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">${product.price?.toFixed(2)}</div>
            </div>
            
            {product.vendor && (
              <div className="text-sm text-muted-foreground">
                By {product.vendor}
              </div>
            )}
            
            {product.description && (
              <p className="text-sm text-muted-foreground">
                {product.description}
              </p>
            )}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex-shrink-0 pt-4 border-t space-y-3">
          {/* Quantity Selector */}
          <div className="flex items-center justify-between">
            <span className="font-medium">Quantity:</span>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={decreaseQuantity}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="font-medium min-w-[2rem] text-center">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={increaseQuantity}
                disabled={quantity >= 10}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Add to Cart Button */}
          <Button 
            className="w-full h-12 text-lg font-semibold"
            onClick={() => {
              if (isMobile) triggerHapticFeedback(HapticPatterns.addToCart);
              // Add to cart logic here
            }}
          >
            Add to Cart • ${(product.price * quantity).toFixed(2)}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileProductSheet;
