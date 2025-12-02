import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, CreditCard, Calendar, Gift } from "lucide-react";
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
import ReviewsSection from "./ReviewsSection";
import SizeGuideContent from "./SizeGuideContent";
import ScheduleGiftModal from "./ScheduleGiftModal";
import WishlistSelectionPopoverButton from "@/components/gifting/wishlist/WishlistSelectionPopoverButton";
import { useProfile } from "@/contexts/profile/ProfileContext";

interface ProductDetailsSidebarProps {
  product: Product;
  user: any;
  context?: string;
  // Variation props from parent
  hasVariations: boolean;
  handleVariationChange: (newSelections: any, newProductId: string) => void;
  getEffectiveProductId: () => string;
  getVariationDisplayText: () => string;
  isVariationComplete: () => boolean;
}

const ProductDetailsSidebar: React.FC<ProductDetailsSidebarProps> = ({ 
  product, 
  user,
  context = 'marketplace',
  hasVariations,
  handleVariationChange,
  getEffectiveProductId,
  getVariationDisplayText,
  isVariationComplete
}) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [showScheduleGiftModal, setShowScheduleGiftModal] = useState(false);
  
  // Get user's saved sizes from profile.metadata.sizes (cast to any for JSONB access)
  const userSizes = (profile as any)?.metadata?.sizes;
  
  const productId = String(product.product_id || product.id);
  const productName = product.title || product.name || "";
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
    
    // Add to cart with variation info
    const cartProduct = {
      ...product,
      product_id: effectiveProductId,
      variationText: variationText || undefined
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
  
  // 2. Buy Now
  const handleBuyNow = () => {
    addToCart(product);
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
  
  // 4. Create Auto-Gift
  const handleAutoGift = () => {
    if (!user) {
      toast.error("Please sign in to create auto-gifts");
      navigate("/auth");
      return;
    }
    // Navigate to auto-gifting with product context
    navigate("/dashboard?tab=auto-gifts", { 
      state: { 
        preselectedProduct: product 
      } 
    });
    toast.info("Set up auto-gifting for this product", {
      description: "Complete the setup to automatically send this gift"
    });
  };
  
  return (
    <>
      <div className="space-y-6 bg-white rounded-lg p-6 sticky top-24">
        {/* Product Title */}
        <div>
          <h1 className="text-2xl font-bold text-elyphant-black leading-tight">
            {productName}
          </h1>
          {product.brand && (
            <p className="text-sm text-elyphant-grey-text mt-1">
              {product.brand}
            </p>
          )}
        </div>
        
        {/* Price & Rating */}
        <ProductPriceAndRating product={product} />
        
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
                name: productName,
                image: productImage,
                price: productPrice,
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
          
          {/* Position 3: Create Auto-Gift - SECONDARY */}
          <Button 
            variant="outline"
            className="w-full border-2 border-elyphant-grey-text text-elyphant-black font-medium h-12 hover:bg-gray-50"
            onClick={handleAutoGift}
          >
            <Gift className="h-5 w-5 mr-2" />
            Create Auto-Gift
          </Button>
          
          {/* Position 4: Add to Cart - TERTIARY */}
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
          
          <AccordionItem value="reviews" className="border-b-0">
            <AccordionTrigger className="text-base font-semibold text-elyphant-black hover:no-underline">
              Reviews ({product.reviewCount || product.num_reviews || product.metadata?.review_count || 0})
            </AccordionTrigger>
            <AccordionContent>
              <ReviewsSection product={product} />
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="size" className="border-b-0">
            <AccordionTrigger className="text-base font-semibold text-elyphant-black hover:no-underline">
              Size Guide
            </AccordionTrigger>
            <AccordionContent>
              <SizeGuideContent category={product.category} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
      
      {/* Gift Scheduling Modal */}
      <ScheduleGiftModal
        open={showScheduleGiftModal}
        onOpenChange={setShowScheduleGiftModal}
        product={product}
      />
    </>
  );
};

export default ProductDetailsSidebar;
