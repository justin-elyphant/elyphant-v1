
import React, {useEffect, useState} from "react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ProductCarousel from "./ProductCarousel";
import ProductInfoHeader from "./ProductInfoHeader";
import ProductInfoDetails from "./ProductInfoDetails";
import ProductDetailsActionsSection from "./ProductDetailsActionsSection";
import VariationSelector from "./VariationSelector";
import { getProductDetail } from "@/api/product";
import { Spinner } from '@/components/ui/spinner';
import { normalizeProduct, Product } from "@/contexts/ProductContext";
import { getProductName, getProductImages } from "../product-item/productUtils";
import { useProductVariations } from "@/hooks/useProductVariations";

interface ProductDetailsDialogProps {
  productId?: string | null;
  product?: Product | null; // Direct product object for pre-loaded data
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userData: any | null;
  source?: 'wishlist' | 'interests' | 'ai' | 'trending'; // Context for display
  onWishlistChange?: () => void;
}

const ProductDetailsDialog = ({ 
  productId, 
  product,
  open, 
  onOpenChange,
  userData,
  source,
  onWishlistChange
}: ProductDetailsDialogProps) => {
  const [productDetail, setProductDetail] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [quantity, setQuantity] = useState(1);
  const [isHeartAnimating, setIsHeartAnimating] = useState(false);
  
  // Use product variations hook
  const {
    hasVariations,
    selectedVariations,
    selectedProductId,
    handleVariationChange,
    getEffectiveProductId,
    isVariationComplete,
    getVariationDisplayText
  } = useProductVariations(productDetail || product);

  // Enhanced debug variation rendering
  useEffect(() => {
    console.log('[ProductDetailsDialog] Variation debug - productDetail:', productDetail);
    console.log('[ProductDetailsDialog] Variation debug - hasVariations:', hasVariations);
    
    if (productDetail) {
      console.log('[ProductDetailsDialog] Enhanced variation debug:', {
        hasVariations,
        hasAllVariants: Boolean(productDetail.all_variants),
        allVariantsLength: productDetail.all_variants?.length || 0,
        allVariantsData: productDetail.all_variants,
        shouldShowSelector: hasVariations && productDetail.all_variants,
        productTitle: productDetail.title || productDetail.name,
        conditionalCheck: hasVariations && productDetail.all_variants,
        renderingVariationSelector: hasVariations && productDetail.all_variants
      });
    } else {
      console.log('[ProductDetailsDialog] No productDetail available');
    }
  }, [hasVariations, productDetail]);

  const handleIncrease = () => {
    if (quantity < 10) {
      setQuantity(quantity + 1);
    }
  };

  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };
  
  useEffect(() => {
    if (product) {
      // Check if we have basic product data that needs enhancement
      const productId = product.product_id || product.id;
      const needsEnhancement = product && 
        (!product.images || product.images.length <= 1) && 
        productId && 
        String(productId).trim() !== "";
      
      if (needsEnhancement && open) {
        // Auto-fetch full details for products with limited data
        fetchProductDetail(String(productId), 'amazon');
      } else {
        // Use pre-loaded product data as-is
        setProductDetail(product);
        setLoading(false);
      }
    } else if (productId && open) {
      // Fetch product data if only ID provided
      fetchProductDetail(productId, 'amazon');
    }
  }, [product, productId, open]);

  const fetchProductDetail = async (productId: string, retailer: string) => {
    setLoading(true);
    try {
      const data = await getProductDetail(productId, retailer);
      if(!data) {
        console.error('Failed to fetch enhanced product details for:', productId);
        // If enhancement fails but we have a base product, fall back to it
        if (product) {
          console.log('Falling back to basic product data');
          setProductDetail(product);
        } else {
          toast.error('Product details not available', {duration: 3000});
        }
      } else {
        // Ensure the product data is normalized and preserve source context
        const enhancedProduct = {
          ...data,
          // Preserve original product_id for consistency
          product_id: productId,
          // Mark as Zinc API product to prevent price re-conversion
          isZincApiProduct: true,
          retailer: retailer || 'amazon'
        };
        
        // Log variation detection for debugging
        console.log('[ProductDetailsDialog] Enhanced product loaded:', {
          title: enhancedProduct.title,
          hasVariations: Boolean(enhancedProduct.all_variants && enhancedProduct.all_variants.length > 0),
          variationCount: enhancedProduct.all_variants?.length || 0,
          currentSpecs: enhancedProduct.variant_specifics?.length || 0,
          allVariantsData: enhancedProduct.all_variants,
          variantSpecificsData: enhancedProduct.variant_specifics
        });
        
        setProductDetail(enhancedProduct);
        console.log('Successfully enhanced product details:', enhancedProduct.title || enhancedProduct.name);
        console.log('Product price from API:', enhancedProduct.price, 'marked as Zinc API product:', enhancedProduct.isZincApiProduct);
      }
    } catch (error) {
      console.error('Error fetching product detail:', error);
      // Fall back to basic product data if available
      if (product) {
        console.log('API call failed, falling back to basic product data');
        setProductDetail(product);
      } else {
        toast.error('Unable to load product details', {duration: 3000});
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {loading ? "" : (productDetail ? getProductName(productDetail) : "")}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="text-sm text-muted-foreground line-clamp-2">
              {source && !loading && (
                <div className="mb-2 text-xs font-medium text-primary">
                  {source === 'ai' && "🤖 AI picked this for you"}
                  {source === 'trending' && "📈 Trending now"}
                  {source === 'interests' && "🎯 Based on your interests"}
                  {source === 'wishlist' && "❤️ From wishlist"}
                </div>
              )}
              {!loading && productDetail?.description && (
                <span>{productDetail.description}</span>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        {
          loading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : (
            productDetail ?
            <>
              <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 py-4">
                 {/* Image Gallery */}
                 <div className="relative overflow-hidden rounded-lg order-1 lg:order-1">
                   <ProductCarousel 
                     images={getProductImages(productDetail)} 
                     productName={getProductName(productDetail)} 
                   />
                 </div>
                 
                 {/* Product Info - Above the fold content */}
                 <div className="flex flex-col space-y-4 order-2 lg:order-2">
                   <ProductInfoHeader product={productDetail} />
                   
                   {/* Product Variations - Keep prominent */}
                   {hasVariations && productDetail.all_variants && (
                     <div className="p-4 border rounded-lg bg-muted/30">
                       <VariationSelector
                         variants={productDetail.all_variants}
                         currentVariantSpecs={productDetail.variant_specifics}
                         onVariationChange={handleVariationChange}
                       />
                     </div>
                   )}
                   
                   {/* Purchase Actions - Keep above the fold */}
                   <ProductDetailsActionsSection
                     product={productDetail}
                     quantity={quantity}
                     onIncrease={handleIncrease}
                     onDecrease={handleDecrease}
                     isHeartAnimating={isHeartAnimating}
                     reloadWishlists={onWishlistChange}
                     selectedProductId={getEffectiveProductId()}
                     variationText={getVariationDisplayText()}
                     isVariationComplete={isVariationComplete()}
                   />
                 </div>
                 
                 {/* Product Details - Below the fold */}
                 <div className="lg:col-span-2 order-3 border-t pt-6 mt-2">
                   <ProductInfoDetails product={productDetail} source={source} />
                 </div>
              </div>
            </>
            :
            <div className="text-center py-8">No Product Data</div>
          )
        }
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsDialog;
