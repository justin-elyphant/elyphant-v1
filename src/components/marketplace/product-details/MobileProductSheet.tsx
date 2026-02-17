
import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Heart, Share, Plus, Minus } from "lucide-react";
import { Product } from "@/types/product";
import { useIsMobile } from "@/hooks/use-mobile";
import { triggerHapticFeedback, HapticPatterns } from "@/utils/haptics";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import { productCatalogService } from "@/services/ProductCatalogService";
import ProductCarousel from "./ProductCarousel";
import ProductRating from "@/components/shared/ProductRating";
import { formatPrice } from "@/lib/utils";

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
  const [enhancedProduct, setEnhancedProduct] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [currentProductId, setCurrentProductId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const { user } = useAuth();

  useEffect(() => {
    const newProductId = product.product_id || product.id;
    
    if (newProductId !== currentProductId) {
      console.log('Product changed, resetting mobile sheet state:', { 
        old: currentProductId, 
        new: newProductId 
      });
      
      setCurrentProductId(newProductId);
      setEnhancedProduct(null);
      setQuantity(1);
      setIsLoadingDetails(false);
    }
  }, [product.product_id, product.id, currentProductId]);

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!open || !product.product_id) return;
      
      const productId = product.product_id || product.id;
      
      const shouldFetchDetails = !enhancedProduct || 
                                enhancedProduct.product_id !== productId ||
                                (!enhancedProduct.product_description && !enhancedProduct.images?.length);
      
      if (!shouldFetchDetails) {
        console.log('Enhanced product data already available');
        return;
      }
      
      try {
        setIsLoadingDetails(true);
        console.log(`Fetching enhanced details for product: ${productId}`);
        
        const detailedProduct = await productCatalogService.getProductDetail(productId);
        
        if (detailedProduct) {
          console.log('Enhanced product details fetched:', detailedProduct);
          setEnhancedProduct({
            ...product,
            ...detailedProduct,
            images: detailedProduct.images?.length > 0 ? detailedProduct.images : [product.image],
            product_description: detailedProduct.product_description || product.description,
            feature_bullets: detailedProduct.feature_bullets || [],
            product_details: detailedProduct.product_details || []
          });
        }
      } catch (error) {
        console.error('Error fetching product details:', error);
        setEnhancedProduct({
          ...product,
          images: [product.image]
        });
      } finally {
        setIsLoadingDetails(false);
      }
    };

    fetchProductDetails();
  }, [open, product.product_id, product.id, product, enhancedProduct]);

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

  const displayProduct = enhancedProduct || product;

  const productImages = displayProduct?.images?.length > 0 
    ? displayProduct.images 
    : [product.image];

  let description = displayProduct?.product_description || displayProduct?.description || "";
  if ((!description || description.trim() === "") && displayProduct?.title) {
    const productType = displayProduct.title.split(' ').slice(1).join(' ');
    const brand = displayProduct.title.split(' ')[0];
    description = `The ${brand} ${productType} is a high-quality product designed for performance and reliability. This item features premium materials and exceptional craftsmanship for long-lasting use.`;
  }

  const features = displayProduct?.feature_bullets || displayProduct?.product_details || [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] flex flex-col">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="text-left">
            {product.title || product.name}
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4">
          <div className="relative">
            <ProductCarousel 
              images={productImages}
              productName={product.title || product.name || "Product"}
            />
            
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
                <Share className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{formatPrice(product.price, {
                productSource: product.productSource || (product.isZincApiProduct ? 'zinc_api' : 'manual'),
                skipCentsDetection: product.skipCentsDetection || false
              })}</div>
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
            
            {isLoadingDetails && (
              <div className="text-sm text-muted-foreground animate-pulse">
                Loading product details...
              </div>
            )}
            
            {description && (
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground max-h-32 overflow-y-auto">
                  {description}
                </p>
              </div>
            )}

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

        <div className="flex-shrink-0 pt-4 border-t space-y-3">
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

          <Button 
            className="w-full h-12 text-lg font-semibold"
            onClick={() => {
              if (isMobile) triggerHapticFeedback(HapticPatterns.addToCart);
            }}
          >
            Add to Cart • {formatPrice(product.price * quantity)}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileProductSheet;
