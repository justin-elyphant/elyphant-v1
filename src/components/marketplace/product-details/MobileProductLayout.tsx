import React from "react";
import { cn } from "@/lib/utils";
import ProductCarousel from "./ProductCarousel";
import ProductInfoHeader from "./ProductInfoHeader";
import ProductInfoDetails from "./ProductInfoDetails";
import ProductDetailsActionsSection from "./ProductDetailsActionsSection";
import VariationSelector from "./VariationSelector";
import WishlistStatusBanner from "./WishlistStatusBanner";
import { getProductName, getProductImages } from "../product-item/productUtils";

interface MobileProductLayoutProps {
  productDetail: any;
  hasVariations: boolean;
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  isHeartAnimating: boolean;
  onWishlistChange?: () => void;
  handleVariationChange: (newSelections: any, newProductId: string) => void;
  getEffectiveProductId: () => string;
  getVariationDisplayText: () => string;
  isVariationComplete: () => boolean;
  source?: 'wishlist' | 'interests' | 'ai' | 'trending';
  context?: 'marketplace' | 'wishlist';
  isInWishlist?: boolean;
  wishlistCount?: number;
}

const MobileProductLayout: React.FC<MobileProductLayoutProps> = ({
  productDetail,
  hasVariations,
  quantity,
  onIncrease,
  onDecrease,
  isHeartAnimating,
  onWishlistChange,
  handleVariationChange,
  getEffectiveProductId,
  getVariationDisplayText,
  isVariationComplete,
  source,
  context = 'marketplace',
  isInWishlist = false,
  wishlistCount = 0
}) => {
  return (
    <div className="space-y-4 ios-typography-optimize">
      {/* Mobile Image Gallery - Full width */}
      <div className="relative -mx-4 ios-product-card-optimize">
        <ProductCarousel 
          images={getProductImages(productDetail)} 
          productName={getProductName(productDetail)}
        />
      </div>
      
      {/* Product Info */}
      <div className="space-y-4">
        {/* Wishlist Status Banner - Show when in wishlist context */}
        {context === 'wishlist' && isInWishlist && (
          <WishlistStatusBanner 
            isInWishlist={isInWishlist}
            wishlistCount={wishlistCount}
          />
        )}
        
        <ProductInfoHeader product={productDetail} />
        
        {/* Variations - Mobile optimized */}
        {hasVariations && productDetail.all_variants && (
          <div className="marketplace-touch-target bg-muted/30 rounded-lg p-4 border">
            <VariationSelector
              variants={productDetail.all_variants}
              currentVariantSpecs={productDetail.variant_specifics}
              onVariationChange={handleVariationChange}
            />
          </div>
        )}
      </div>
      
      {/* Purchase Actions - Sticky on mobile */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t -mx-4 px-4 py-3 mobile-safe-area">
        <ProductDetailsActionsSection
          product={productDetail}
          quantity={quantity}
          onIncrease={onIncrease}
          onDecrease={onDecrease}
          isHeartAnimating={isHeartAnimating}
          reloadWishlists={onWishlistChange}
          selectedProductId={getEffectiveProductId()}
          variationText={getVariationDisplayText()}
          isVariationComplete={isVariationComplete()}
          context={context}
        />
      </div>
      
      {/* Product Details - Collapsible on mobile */}
      <div className="border-t pt-4 mt-6">
        <ProductInfoDetails product={productDetail} source={source} />
      </div>
    </div>
  );
};

export default MobileProductLayout;