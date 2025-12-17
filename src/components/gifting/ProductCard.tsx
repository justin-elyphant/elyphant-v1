
import React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Truck } from "lucide-react";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useProductDataSync } from "@/hooks/useProductDataSync";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ProductCardImageSection from "./ProductCardImageSection";
import TrustBadges from "@/components/marketplace/TrustBadges";
import WishlistButton from "./WishlistButton";
import ProductPriceSection from "./ProductPriceSection";
import ProductRatingSection from "./ProductRatingSection";
import WishlistSelectionPopoverButton from "./wishlist/WishlistSelectionPopoverButton";
import { useUnifiedWishlistSystem } from "@/hooks/useUnifiedWishlistSystem";

interface ProductCardProps {
  product: any;
  isWishlisted?: boolean;
  isGifteeView?: boolean; 
  onToggleWishlist?: () => void;
  onClick?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isWishlisted = false,
  isGifteeView = true, 
  onToggleWishlist,
  onClick
}) => {
  const { addItem } = useRecentlyViewed();
  const { trackProductView } = useProductDataSync();
  const { isProductWishlisted, loadWishlists } = useUnifiedWishlistSystem();
  const isMobile = useIsMobile();

  // Use the unified wishlist system to determine if product is wishlisted
  const actuallyWishlisted = isProductWishlisted(String(product.product_id || product.id));

  React.useEffect(() => {
    console.log("[ProductCard] Rendering product", {
      id: product.product_id || product.id,
      title: product.title || product.name,
      isWishlisted: actuallyWishlisted,
      isBestSeller: product.isBestSeller,
      bestSellerType: product.bestSellerType,
      badgeText: product.badgeText,
      isMock: (product.retailer && typeof product.retailer === "string" && product.retailer.toLowerCase().includes("zinc")) ||
              (product.product_id && String(product.product_id).toUpperCase().startsWith("MOCK"))
    });
  }, [product, actuallyWishlisted]);

  const handleClick = () => {
    if (onClick) onClick();
    addItem({
      id: product.product_id || product.id || "",
      title: product.title || product.name || "",
      image: product.image || "",
      price: product.price
    });
    trackProductView(product);
  };

  const handleWishlistAdded = () => {
    console.log('[ProductCard] Wishlist added callback - reloading wishlists');
    // Reload wishlists to ensure state consistency
    loadWishlists();
    if (onToggleWishlist) {
      onToggleWishlist();
    }
  };

  // Helpers
  const getProductName = () => product.title || product.name || "";
  const getPrice = () => (typeof product.price === 'number' ? product.price.toFixed(2) : '0.00');
  const isRecentlyViewed = () => product.recentlyViewed;
  const isNewArrival = () => product.tags?.includes("new") || (product.id && Number(product.id) > 9000);
  const isBestSeller = () => product.isBestSeller || false;
  const isFreeShipping = () => product.prime || product.free_shipping || false;
  const getRating = () => product.rating || product.stars || 0;
  const hasDiscount = () => product.sale_price && product.sale_price < product.price;

  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all relative group hover:shadow-md cursor-pointer border-2",
        actuallyWishlisted && "border-pink-200 hover:border-pink-300",
        !actuallyWishlisted && "hover:border-gray-300"
      )}
      onClick={handleClick}
    >
      <div className="aspect-square relative overflow-hidden">
        <ProductCardImageSection product={product} productName={getProductName()} />

        {/* Trust Badges - Consolidated component */}
        <div className="absolute top-2 left-2 z-20">
          <TrustBadges product={product} size="sm" maxBadges={1} />
        </div>

        {/* Always popover-based wishlist - no more 1-click */}
        <div
          className="absolute top-2 right-2 z-30"
          onClick={e => e.stopPropagation()}
        >
          <WishlistSelectionPopoverButton
            product={{
              id: String(product.product_id || product.id),
              name: product.title || product.name || "",
              image: product.image || "",
              price: product.price,
              brand: product.brand
            }}
            triggerClassName={cn(
              "p-1.5 rounded-full transition-colors",
              actuallyWishlisted 
                ? "bg-pink-100 text-pink-500 hover:bg-pink-200" 
                : "bg-white/80 text-gray-400 hover:text-pink-500 hover:bg-white"
            )}
            isWishlisted={actuallyWishlisted}
            onAdded={handleWishlistAdded}
          />
        </div>
      </div>

      <div className={cn(
        "p-3", 
        isMobile && "p-2.5"
      )}>
        <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors">
          {getProductName()}
        </h3>

        {/* Refactored Price Section */}
        <ProductPriceSection
          price={product.price}
          salePrice={product.sale_price}
          hasDiscount={hasDiscount()}
        />

        {/* Refactored Rating Section */}
        <ProductRatingSection
          rating={getRating()}
          reviewCount={product.reviewCount || product.num_reviews || 0}
          isMobile={isMobile}
        />

        {isFreeShipping() && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center text-xs text-green-600 mt-1">
                  <Truck className="h-3 w-3 mr-1" />
                  <span>Free shipping</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Free shipping on this item</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {product.tags && product.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {product.tags.slice(0, 1).map((tag: string, i: number) => (
              <span 
                key={i} 
                className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-sm"
              >
                {tag}
              </span>
            ))}
            {product.tags.length > 1 && (
              <span className="text-xs text-gray-500">+{product.tags.length - 1}</span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default ProductCard;
