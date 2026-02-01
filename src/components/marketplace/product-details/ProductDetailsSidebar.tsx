import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { Product } from "@/types/product";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/auth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import ProductPriceAndRating from "./ProductPriceAndRating";
import MySizesSelector from "./MySizesSelector";
import VariationSelector from "./VariationSelector";
import ProductDetailsContent from "./ProductDetailsContent";
import TrustBadges from "@/components/marketplace/TrustBadges";

import UnifiedGiftSchedulingModal from "@/components/gifting/unified/UnifiedGiftSchedulingModal";
import WishlistSelectionPopoverButton from "@/components/gifting/wishlist/WishlistSelectionPopoverButton";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { getDisplayTitle, cleanTitle } from "@/utils/productTitleUtils";

interface ProductDetailsSidebarProps {
  product: Product;
  user: any;
  context?: string;
  // Variation props from parent
  hasVariations: boolean;
  selectedVariations: Record<string, string>;
  handleVariationChange: (newSelections: any, newProductId: string) => void;
  getEffectiveProductId: () => string;
  getVariationDisplayText: () => string;
  isVariationComplete: () => boolean;
  variantPrice?: number; // Override price for selected variant
}

const ProductDetailsSidebar: React.FC<ProductDetailsSidebarProps> = ({ 
  product, 
  user,
  context = 'marketplace',
  hasVariations,
  selectedVariations,
  handleVariationChange,
  getEffectiveProductId,
  getVariationDisplayText,
  isVariationComplete,
  variantPrice
}) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const isMobile = useIsMobile();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [showScheduleGiftModal, setShowScheduleGiftModal] = useState(false);
  const [showFullTitle, setShowFullTitle] = useState(false);
  
  // Get user's saved sizes from profile.metadata.sizes (cast to any for JSONB access)
  const userSizes = (profile as any)?.metadata?.sizes;
  
  const productId = String(product.product_id || product.id);
  const rawProductName = product.title || product.name || "";
  const cleanedTitle = cleanTitle(rawProductName);
  const displayTitle = isMobile 
    ? getDisplayTitle(rawProductName, { device: 'mobile', context: 'detail', brand: product.brand })
    : getDisplayTitle(rawProductName, { device: 'desktop', context: 'detail', brand: product.brand });
  const isTruncated = displayTitle.endsWith('...');
  const productImage = product.image || "";
  const productPrice = product.price || 0;
  
  // 1. Add to Cart - PHASE 6: Validate variations before adding
  const handleAddToCart = () => {
    // Validate variation selection
    if (hasVariations && !isVariationComplete()) {
      toast.error("Please select all product options", {
        description: "Choose size, color, and other options before adding to cart"
      });
      return;
    }
    
    // Get effective product ID (selected variant or base product)
    const effectiveProductId = getEffectiveProductId();
    const variationText = getVariationDisplayText();
    
    // Add to cart with variation info (including structured selectedVariations)
    const cartProduct = {
      ...product,
      product_id: effectiveProductId,
      variationText: variationText || undefined,
      selectedVariations: Object.keys(selectedVariations).length > 0 
        ? JSON.stringify(selectedVariations) 
        : undefined
    };
    
    addToCart(cartProduct);
    toast.success("Added to cart", {
      description: variationText ? `${variationText}` : "Continue shopping or checkout when ready",
      action: {
        label: "View Cart",
        onClick: () => navigate("/cart")
      }
    });
  };
  
  // 2. Buy Now - FIXED: Validate variations before purchase
  const handleBuyNow = () => {
    // Validate variation selection (same as Add to Cart)
    if (hasVariations && !isVariationComplete()) {
      toast.error("Please select all product options", {
        description: "Choose size, color, and other options before purchase"
      });
      return;
    }
    
    // Use effective product ID (selected variant or base product)
    const effectiveProductId = getEffectiveProductId();
    const variationText = getVariationDisplayText();
    
    const cartProduct = {
      ...product,
      product_id: effectiveProductId,
      variationText: variationText || undefined,
      selectedVariations: Object.keys(selectedVariations).length > 0 
        ? JSON.stringify(selectedVariations) 
        : undefined
    };
    
    addToCart(cartProduct);
    navigate("/checkout");
  };
  
  // 3. Schedule as Gift
  const handleScheduleGift = () => {
    if (!user) {
      toast.error("Please sign in to schedule gifts");
      navigate("/auth");
      return;
    }
    setShowScheduleGiftModal(true);
  };
  
  return (
    <>
      <div className="space-y-6 bg-white rounded-lg p-6 sticky top-24">
        {/* Product Title */}
        <div>
          <h1 className="text-2xl font-bold text-elyphant-black leading-tight">
            {showFullTitle ? cleanedTitle : displayTitle}
          </h1>
          {isTruncated && (
            <button
              onClick={() => setShowFullTitle(!showFullTitle)}
              className="text-sm text-elyphant-grey-text hover:text-elyphant-black flex items-center gap-1 mt-1 transition-colors"
            >
              {showFullTitle ? (
                <>Show less <ChevronUp className="h-3 w-3" /></>
              ) : (
                <>See full title <ChevronDown className="h-3 w-3" /></>
              )}
            </button>
          )}
          {product.brand && (
            <p className="text-sm text-elyphant-grey-text mt-1">
              {product.brand}
            </p>
          )}
          
          {/* Trust Badges - Carried over from product cards */}
          <TrustBadges 
            product={product} 
            size="md"
            className="mt-3"
            maxBadges={2}
          />
        </div>
        
        {/* Price & Rating - supports variant-specific pricing */}
        <ProductPriceAndRating product={product} variantPrice={variantPrice} />
        
        {/* Size Selector - NEW (My Sizes Integration) */}
        {userSizes && (
          <MySizesSelector 
            userSizes={userSizes}
            selectedSize={selectedSize}
            onSizeChange={setSelectedSize}
            productCategory={product.category}
          />
        )}
        
        {/* Variation Selector (existing component) */}
        {hasVariations && product.all_variants && (
          <div className="p-4 border rounded-lg bg-muted/30">
            <VariationSelector
              variants={product.all_variants}
              currentVariantSpecs={product.variant_specifics}
              onVariationChange={handleVariationChange}
            />
          </div>
        )}
        
        {/* 4 CTA BUTTONS - Wishlist-first hierarchy */}
        <div className="space-y-3">
          {/* Position 1: Add to Wishlist - PRIMARY (Black filled) */}
          {user && (
            <WishlistSelectionPopoverButton 
              product={{
                id: productId,
                selectedProductId: getEffectiveProductId(),
                variationText: getVariationDisplayText(),
                name: rawProductName,
                image: productImage,
                price: variantPrice || productPrice,
                brand: product.brand || "",
              }}
              triggerClassName="w-full h-12 bg-elyphant-black text-white hover:bg-elyphant-black/90 font-medium transition-colors"
              showText={true}
            />
          )}
          
          {/* Position 2: Schedule as Gift - SECONDARY */}
          <Button 
            variant="outline"
            className="w-full border-2 border-elyphant-grey-text text-elyphant-black font-medium h-12 hover:bg-gray-50"
            onClick={handleScheduleGift}
          >
            <Calendar className="h-5 w-5 mr-2" />
            Schedule as Gift
          </Button>
          
          {/* Position 3: Add to Cart - TERTIARY */}
          <Button 
            variant="outline"
            className="w-full border border-gray-300 bg-white text-elyphant-grey-text font-medium h-12 hover:border-gray-400"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Add to Cart
          </Button>
        </div>
        
        {/* Expandable Accordion Sections */}
        <Accordion type="single" collapsible className="border-t pt-6">
          <AccordionItem value="details" className="border-b-0">
            <AccordionTrigger className="text-base font-semibold text-elyphant-black hover:no-underline">
              Product Details
            </AccordionTrigger>
            <AccordionContent>
              <ProductDetailsContent product={product} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
      
      {/* Unified Gift Scheduling Modal */}
      <UnifiedGiftSchedulingModal
        open={showScheduleGiftModal}
        onOpenChange={setShowScheduleGiftModal}
        product={product}
        defaultMode="one-time"
        allowModeSwitch={true}
        hasVariations={hasVariations}
        getEffectiveProductId={getEffectiveProductId}
        getVariationDisplayText={getVariationDisplayText}
        isVariationComplete={isVariationComplete}
      />
    </>
  );
};

export default ProductDetailsSidebar;
