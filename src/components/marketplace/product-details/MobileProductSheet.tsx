
import React, { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, Share2, Star } from "lucide-react";
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
  const { user } = useAuth();
  const [productData, setProductData] = useState(null);

  if (!product) return null;

  useEffect(() => {
    if (open) {
      setProductData(null);
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
        className="h-[90vh] overflow-y-auto rounded-t-xl p-0 touch-manipulation"
      >
        <div className="flex flex-col h-full">
          {/* Image Section */}
          <div className="relative bg-gray-50">
            <div className="relative aspect-square overflow-hidden">
              <img
                src={images[currentImageIndex] || "/placeholder.svg"}
                alt={product.title || product.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              
              {/* Navigation dots for multiple images */}
              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={cn(
                        "w-2 h-2 rounded-full transition-colors touch-target-44",
                        index === currentImageIndex ? "bg-white" : "bg-white/50"
                      )}
                      aria-label={`View image ${index + 1}`}
                    />
                  ))}
                </div>
              )}
              
              {/* Action buttons */}
              <div className="absolute top-4 right-4 flex gap-2">
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={handleShare}
                  className="rounded-full bg-white/90 backdrop-blur-sm touch-target-44"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Content Section with Actions at Top */}
          <div className="flex-1 flex flex-col">
            <div className="p-6 space-y-4">
              <SheetHeader>
                <SheetTitle className="text-xl font-semibold text-left">
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

              {/* Actions Section moved to top */}
              <div className="border-t border-b py-4 my-4">
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

            {/* Scrollable Content */}
            <ScrollArea className="flex-1 px-6 pb-6">
              <div className="space-y-4">
                {product.description && (
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                )}

                {productFeatures.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Features</h4>
                    <ul className="text-sm space-y-1">
                      {productFeatures.slice(0, 5).map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">•</span>
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {productDetails.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Product Details</h4>
                    <ul className="text-sm space-y-1">
                      {productDetails.slice(0, 10).map((detail, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">•</span>
                          <span className="text-muted-foreground">{detail}</span>
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
