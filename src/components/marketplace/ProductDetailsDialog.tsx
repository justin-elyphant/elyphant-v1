
import React, { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Product } from "@/types/product";
import { useIsMobile } from "@/hooks/use-mobile";
import ProductDetailsImageSection from "./product-details/ProductDetailsImageSection";
import ProductDetailsActionsSection from "./product-details/ProductDetailsActionsSection";
import MobileProductSheet from "./product-details/MobileProductSheet";
import ProductCarousel from "./product-details/ProductCarousel";
import { useUnifiedWishlist } from "@/hooks/useUnifiedWishlist";
import { enhancedZincApiService } from "@/services/enhancedZincApiService";
import { Star } from "lucide-react";

interface ProductDetailsDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userData: any;
  onWishlistChange?: () => void;
}

const ProductDetailsDialog = ({
  product,
  open,
  onOpenChange,
  userData,
  onWishlistChange
}: ProductDetailsDialogProps) => {
  console.log("dialog origin products : ", product);
  const [quantity, setQuantity] = useState(1);
  const [isHeartAnimating, setIsHeartAnimating] = useState(false);
  const isMobile = useIsMobile();
  const [productData, setProductData] = useState(null);

  // Use unified wishlist system directly
  const { wishlists, loadWishlists } = useUnifiedWishlist();

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

  // Process images for carousel - handle both single and multiple images
  const processedImages = useMemo(() => {
    if (!productData) return [product?.image].filter(Boolean);
    
    // Handle array of images from Zinc API
    if (Array.isArray(productData.images) && productData.images.length > 0) {
      return productData.images.filter(Boolean);
    }
    
    // Handle single main_image
    if (productData.main_image) {
      return [productData.main_image];
    }
    
    // Fallback to product image
    return [product?.image].filter(Boolean);
  }, [productData, product]);

  // Always recalculate isWishlisted live
  const isWishlisted =
    !!product &&
    wishlists.some(list =>
      Array.isArray(list.items) &&
      list.items.some(item => item.product_id === (product.product_id || product.id))
    );

  // Handle wishlist changes and notify parent
  const handleWishlistChange = async () => {
    console.log('ProductDetailsDialog - Wishlist changed, reloading data');
    await loadWishlists();
    if (onWishlistChange) {
      onWishlistChange();
    }
  };

  // Update quantity
  const increaseQuantity = () => setQuantity(prev => Math.min(prev + 1, 10));
  const decreaseQuantity = () => setQuantity(prev => Math.max(prev - 1, 1));

  if (!product) return null;

  // Use mobile sheet on mobile devices for better UX
  if (isMobile) {
    return (
      <MobileProductSheet
        product={product}
        open={open}
        onOpenChange={onOpenChange}
        isWishlisted={isWishlisted}
        onWishlistChange={handleWishlistChange}
      />
    );
  }

  // Share function
  const handleShareProduct = () => {
    if (navigator.share) {
      navigator.share({
        title: product.title || product.name || "Check out this product",
        text: `Check out this product: ${product.title || product.name}`,
        url: window.location.href,
      });
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

  // Get product description with proper fallback
  const productDescription = productData?.product_description || 
                            productData?.description || 
                            product.description || 
                            "No description available for this product.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px] p-0 overflow-y-auto max-h-[90vh]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Product Images - Use ProductCarousel for multiple images */}
          <div className="relative bg-gray-50 flex items-center justify-center min-h-[300px] md:min-h-[500px]">
            {processedImages.length > 0 ? (
              <ProductCarousel
                images={processedImages}
                productName={product.title || product.name || "Product"}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <span>No Image Available</span>
              </div>
            )}

            {/* Action Buttons Overlay */}
            <ProductDetailsImageSection
              product={product}
              productData={productData}
              isHeartAnimating={isHeartAnimating}
              onShare={handleShareProduct}
              isWishlisted={isWishlisted}
              reloadWishlists={handleWishlistChange}
            />
          </div>

          {/* Product Details Section */}
          <div className="p-6 overflow-y-auto max-h-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold mb-1">
                {product.title || product.name}
              </DialogTitle>
              <div className="flex items-center justify-between mt-2">
                <div className="text-lg font-bold">${product.price?.toFixed(2)}</div>
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
              <div className="text-sm text-muted-foreground">
                {product.vendor && `By ${product.vendor}`}
              </div>
            </DialogHeader>
            <Separator className="my-4" />
            
            {/* Product Description - Fixed display */}
            <div className="mb-6">
              <p className="text-sm text-muted-foreground">
                {productDescription}
              </p>
            </div>
            
            {productFeatures.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium mb-2">Features</h4>
                <ul className="text-sm list-disc pl-4 space-y-1">
                  {productFeatures.map((feature, idx) => (
                    <li key={idx}>{feature}</li>
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
            <ProductDetailsActionsSection
              product={product}
              quantity={quantity}
              onIncrease={increaseQuantity}
              onDecrease={decreaseQuantity}
              isHeartAnimating={isHeartAnimating}
              isWishlisted={isWishlisted}
              reloadWishlists={handleWishlistChange}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsDialog;
