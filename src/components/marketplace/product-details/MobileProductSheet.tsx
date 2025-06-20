
import React, { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Heart, Share2, ShoppingBag, Minus, Plus, Star } from "lucide-react";
import { Product } from "@/types/product";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { triggerHapticFeedback, HapticPatterns } from "@/utils/haptics";
import WishlistSelectionPopoverButton from "@/components/gifting/wishlist/WishlistSelectionPopoverButton";
import { useAuth } from "@/contexts/auth";
import ProductCarousel from "./ProductCarousel";

interface MobileProductSheetProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isWishlisted?: boolean;
  onWishlistChange?: () => void;
}

const MobileProductSheet = ({
  product,
  open,
  onOpenChange,
  isWishlisted = false,
  onWishlistChange
}: MobileProductSheetProps) => {
  const [quantity, setQuantity] = useState(1);
  const { addToCart, getItemCount } = useCart();
  const { user } = useAuth();

  const increaseQuantity = () => setQuantity(prev => Math.min(prev + 1, 10));
  const decreaseQuantity = () => setQuantity(prev => Math.max(prev - 1, 1));

  // Process images for carousel
  const processedImages = useMemo(() => {
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      return product.images.filter(Boolean);
    }
    return product.image ? [product.image] : [];
  }, [product]);

  const handleAddToCart = () => {
    try {
      // Normalize product object to ensure it has the required product_id field
      const normalizedProduct = {
        ...product,
        product_id: product.product_id || product.id || String(Math.random()), // Fallback ID if none exists
        title: product.title || product.name || "Unknown Product",
        name: product.name || product.title || "Unknown Product"
      };

      console.log('MobileProductSheet - Adding to cart:', {
        originalProduct: product,
        normalizedProduct: normalizedProduct,
        quantity: quantity,
        hasProductId: !!normalizedProduct.product_id
      });

      // Validate required fields
      if (!normalizedProduct.product_id) {
        console.error('MobileProductSheet - No product ID found');
        toast.error('Unable to add item to cart - product ID missing');
        return;
      }

      if (!normalizedProduct.price) {
        console.error('MobileProductSheet - No product price found');
        toast.error('Unable to add item to cart - price missing');
        return;
      }
      
      triggerHapticFeedback(HapticPatterns.addToCart);
      
      // Add item to cart with the specified quantity
      addToCart(normalizedProduct, quantity);
      
      const itemCount = getItemCount();
      console.log('MobileProductSheet - Cart updated, new item count:', itemCount);
      
      toast.success(`Added ${quantity} ${normalizedProduct.title}(s) to cart`);
    } catch (error) {
      console.error('MobileProductSheet - Error adding to cart:', error);
      toast.error('Failed to add item to cart. Please try again.');
    }
  };

  const handleShare = () => {
    triggerHapticFeedback(HapticPatterns.buttonTap);
    if (navigator.share) {
      navigator.share({
        title: product.title || product.name || "Check out this product",
        text: `Check out this product: ${product.title || product.name}`,
        url: window.location.href,
      });
    }
  };

  const handleWishlistAdded = () => {
    if (onWishlistChange) {
      onWishlistChange();
    }
  };

  // Format rating display
  const renderRating = () => {
    const rating = product.rating || product.stars || 0;
    const reviewCount = product.reviewCount || product.num_reviews || 0;
    
    if (!rating && !reviewCount) return null;

    return (
      <div className="flex items-center gap-2 mt-2">
        <div className="flex items-center">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < Math.floor(rating) 
                  ? "fill-yellow-400 text-yellow-400" 
                  : "fill-gray-200 text-gray-200"
              }`}
            />
          ))}
          <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
        </div>
        {reviewCount > 0 && (
          <span className="text-sm text-gray-500">({reviewCount.toLocaleString()})</span>
        )}
      </div>
    );
  };

  // Format brand/vendor display
  const renderBrandInfo = () => {
    const brand = product.brand;
    if (brand && brand !== "Amazon via Zinc") {
      return (
        <div className="text-sm text-gray-600 mt-1">
          by {brand}
        </div>
      );
    }
    return (
      <div className="text-sm text-gray-600 mt-1">
        Sold by Amazon
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-left">{product.title || product.name}</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-6">
          {/* Product Images - Use Carousel for multiple images */}
          <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden">
            {processedImages.length > 0 ? (
              processedImages.length === 1 ? (
                <img
                  src={processedImages[0]}
                  alt={product.title || product.name || "Product"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ProductCarousel
                  images={processedImages}
                  productName={product.title || product.name || "Product"}
                />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <span>No Image Available</span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-2xl font-bold">${product.price?.toFixed(2)}</div>
                {renderBrandInfo()}
                {renderRating()}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleShare}
                  className="flex-shrink-0"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                
                {user ? (
                  <WishlistSelectionPopoverButton
                    product={{
                      id: String(product.product_id || product.id),
                      name: product.title || product.name || "",
                      image: product.image || "",
                      price: product.price,
                      brand: product.brand || "",
                    }}
                    triggerClassName="p-2"
                    onAdded={handleWishlistAdded}
                  />
                ) : (
                  <Button
                    variant="outline"
                    size="icon"
                    className="flex-shrink-0"
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Product Description */}
            {product.description && (
              <div className="space-y-3">
                <h4 className="font-medium text-base">Description</h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* Product Features */}
            {product.features && Array.isArray(product.features) && product.features.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-base">Features</h4>
                <ul className="text-sm space-y-1">
                  {product.features.slice(0, 5).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-green-500 mt-1 flex-shrink-0">•</span>
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Product Details */}
            {product.product_details && Array.isArray(product.product_details) && product.product_details.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-base">Product Details</h4>
                <ul className="text-sm space-y-1">
                  {product.product_details.slice(0, 5).map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-green-500 mt-1 flex-shrink-0">•</span>
                      <span className="text-gray-600">{String(detail)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Quantity:</span>
            <div className="flex items-center border rounded-md">
              <Button
                variant="ghost"
                size="sm"
                onClick={decreaseQuantity}
                disabled={quantity <= 1}
                className="h-8 w-8 p-0"
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="px-3 py-1 text-sm font-medium min-w-[2rem] text-center">
                {quantity}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={increaseQuantity}
                disabled={quantity >= 10}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Add to Cart Button */}
          <Button 
            onClick={handleAddToCart}
            className="w-full h-12 text-base font-medium"
            size="lg"
          >
            <ShoppingBag className="h-5 w-5 mr-2" />
            Add to Cart
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileProductSheet;
