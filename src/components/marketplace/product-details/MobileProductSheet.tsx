import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Heart, Share2, Plus, Minus } from "lucide-react";
import { Product } from "@/types/product";
import { useIsMobile } from "@/hooks/use-mobile";
import { triggerHapticFeedback, HapticPatterns } from "@/utils/haptics";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { enhancedZincApiService } from "@/services/enhancedZincApiService";
import ProductCarousel from "./ProductCarousel";
import ProductRating from "@/components/shared/ProductRating";
import { formatProductPrice } from "../product-item/productUtils";

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
  const [enhancedProduct, setEnhancedProduct] = useState<any>(product);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const isMobile = useIsMobile();
  const { user } = useAuth();

  // Fetch enhanced product details when sheet opens
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!open || !product.product_id) return;
      
      // If we already have detailed data, don't fetch again
      if (enhancedProduct?.product_description || enhancedProduct?.images?.length > 1) {
        return;
      }
      
      try {
        setIsLoadingDetails(true);
        console.log(`Fetching enhanced details for product: ${product.product_id}`);
        
        const detailedProduct = await enhancedZincApiService.getProductDetails(product.product_id);
        
        if (detailedProduct) {
          console.log('Enhanced product details fetched:', detailedProduct);
          setEnhancedProduct({
            ...product,
            ...detailedProduct,
            // Ensure we keep the original image as fallback
            images: detailedProduct.images?.length > 0 ? detailedProduct.images : [product.image],
            product_description: detailedProduct.product_description || product.description,
            feature_bullets: detailedProduct.feature_bullets || [],
            product_details: detailedProduct.product_details || []
          });
        }
      } catch (error) {
        console.error('Error fetching product details:', error);
        // Keep the original product data on error
        setEnhancedProduct({
          ...product,
          images: [product.image]
        });
      } finally {
        setIsLoadingDetails(false);
      }
    };

    fetchProductDetails();
  }, [open, product.product_id, product]);

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

  // Generate images array for carousel
  const productImages = enhancedProduct?.images?.length > 0 
    ? enhancedProduct.images 
    : [product.image];

  // Generate description if none exists
  let description = enhancedProduct?.product_description || enhancedProduct?.description || "";
  if ((!description || description.trim() === "") && enhancedProduct?.title) {
    const productType = enhancedProduct.title.split(' ').slice(1).join(' ');
    const brand = enhancedProduct.title.split(' ')[0];
    description = `The ${brand} ${productType} is a high-quality product designed for performance and reliability. This item features premium materials and exceptional craftsmanship for long-lasting use.`;
  }

  const features = enhancedProduct?.feature_bullets || enhancedProduct?.product_details || [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] flex flex-col">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="text-left">
            {product.title || product.name}
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Product Images Carousel */}
          <div className="relative">
            <ProductCarousel 
              images={productImages}
              productName={product.title || product.name || "Product"}
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
              <div className="text-2xl font-bold">${formatProductPrice(product.price)}</div>
            </div>
            
            <ProductRating 
              rating={product.rating || product.stars} 
              reviewCount={product.reviewCount || product.num_reviews} 
              size="lg" 
            />
            
            {product.vendor && (
              <div className="text-sm text-muted-foreground">
                By {product.vendor}
              </div>
            )}
            
            <span className="text-green-600 text-sm block">Free shipping</span>
            
            {/* Loading indicator for details */}
            {isLoadingDetails && (
              <div className="text-sm text-muted-foreground animate-pulse">
                Loading product details...
              </div>
            )}
            
            {/* Description */}
            {description && (
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground max-h-32 overflow-y-auto">
                  {description}
                </p>
              </div>
            )}

            {/* Features */}
            {features.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Features</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground max-h-32 overflow-y-auto space-y-1">
                  {features.map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
              </div>
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
