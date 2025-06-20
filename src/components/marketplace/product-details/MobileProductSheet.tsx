
import React, { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, Share2, Star, X } from "lucide-react";
import { Product } from "@/types/product";
import { useAuth } from "@/contexts/auth";
import ProductDetailsActionsSection from "./ProductDetailsActionsSection";
import { cn } from "@/lib/utils";
import { enhancedZincApiService } from "@/services/enhancedZincApiService";

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
  const { user } = useAuth();
  const [productData, setProductData] = useState(null);

  if (!product) return null;

  useEffect(() => {
    if (open) {
      setProductData(null);
      setCurrentImageIndex(0);
      fetchData();
    }
  }, [open, product]);
  
  const fetchData = async ()=>{
    const zincProductDetailData = await enhancedZincApiService.getProductDetail(product.product_id || product.id);
    console.log(zincProductDetailData);
    setProductData(zincProductDetailData);
  }

  product.description = product.description || productData?.product_description;

  const images = Array.isArray(productData?.images) ? productData?.images : [productData?.image].filter(Boolean);

  // Enhanced swipe detection
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentImageIndex < images.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
    }
    if (isRightSwipe && currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1);
    }
  };

  // Product features extraction
  const productFeatures = Array.isArray(productData?.feature_bullets)
    ? productData?.feature_bullets.map(detail => detail?.toString())
    : [];
  // Product details
  const productDetails = Array.isArray(productData?.product_details)
    ? productData?.product_details.map(detail => detail?.toString())
    : [];

  const handleShare = async () => {
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

  const increaseQuantity = () => setQuantity(prev => Math.min(prev + 1, 10));
  const decreaseQuantity = () => setQuantity(prev => Math.max(prev - 1, 1));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[95vh] overflow-hidden rounded-t-2xl p-0 touch-manipulation border-t-0"
      >
        <div className="flex flex-col h-full">
          {/* Enhanced Header with Close Button */}
          <div className="flex items-center justify-between p-4 border-b bg-white sticky top-0 z-50">
            <div className="w-8" /> {/* Spacer for centering */}
            <div className="w-12 h-1 bg-gray-300 rounded-full" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 p-0 rounded-full hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Enhanced Image Section with Swipe Support */}
          <div className="relative bg-gray-50">
            <div 
              className="relative aspect-square overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <img
                src={images[currentImageIndex] || "/placeholder.svg"}
                alt={product.title || product.name}
                className="w-full h-full object-cover transition-transform duration-300"
                loading="lazy"
              />
              
              {/* Image Counter */}
              {images.length > 1 && (
                <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                  {currentImageIndex + 1} / {images.length}
                </div>
              )}
              
              {/* Enhanced Navigation dots */}
              {images.length > 1 && (
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={cn(
                        "w-3 h-3 rounded-full transition-all duration-300 touch-target-44",
                        index === currentImageIndex 
                          ? "bg-white scale-110" 
                          : "bg-white/50 hover:bg-white/80"
                      )}
                      aria-label={`View image ${index + 1}`}
                    />
                  ))}
                </div>
              )}
              
              {/* Swipe Indicators */}
              {images.length > 1 && (
                <>
                  {currentImageIndex > 0 && (
                    <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white/70 text-xs">
                      ← Swipe
                    </div>
                  )}
                  {currentImageIndex < images.length - 1 && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/70 text-xs">
                      Swipe →
                    </div>
                  )}
                </>
              )}
              
              {/* Action buttons */}
              <div className="absolute top-4 right-4 flex gap-2">
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={handleShare}
                  className="rounded-full bg-white/90 backdrop-blur-sm touch-target-44 w-10 h-10"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Content Section with improved spacing */}
          <div className="flex-1 flex flex-col bg-white">
            <div className="p-6 space-y-4">
              <SheetHeader>
                <SheetTitle className="text-xl font-semibold text-left leading-tight">
                  {product.title || product.name}
                </SheetTitle>
              </SheetHeader>

              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-green-600">
                  ${product.price?.toFixed(2)}
                </div>
                {product.rating && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
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

              {/* Actions Section - Enhanced for mobile */}
              <div className="border-t border-b py-6 my-4 bg-gray-50 -mx-6 px-6">
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

            {/* Scrollable Content with better mobile optimization */}
            <ScrollArea className="flex-1 px-6 pb-8">
              <div className="space-y-6">
                {product.description && (
                  <div>
                    <h4 className="font-semibold mb-3 text-lg">Description</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                )}

                {productFeatures.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 text-lg">Key Features</h4>
                    <ul className="text-sm space-y-2">
                      {productFeatures.slice(0, 5).map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="text-green-500 mt-1 text-base">•</span>
                          <span className="text-muted-foreground leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {productDetails.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 text-lg">Product Details</h4>
                    <ul className="text-sm space-y-2">
                      {productDetails.slice(0, 8).map((detail, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="text-green-500 mt-1 text-base">•</span>
                          <span className="text-muted-foreground leading-relaxed">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileProductSheet;
