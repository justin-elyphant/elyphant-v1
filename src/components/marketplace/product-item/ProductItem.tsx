
import React from "react";
import { Product } from "@/contexts/ProductContext";
import { cn } from "@/lib/utils";
import ProductDetails from "./ProductDetails";
import ProductImage from "./ProductImage";
import WishlistButton from "./WishlistButton";
import { getBasePrice } from "./productUtils";
import { useIsMobile } from "@/hooks/use-mobile";

interface ProductItemProps {
  product: Product;
  viewMode: "grid" | "list";
  onProductClick?: (productId: string) => void;
  onWishlistClick?: (e: React.MouseEvent) => void; 
  isFavorited?: boolean;
  useMock?: boolean;
  statusBadge?: { badge: string; color: string } | null;
}

const ProductItem = ({ 
  product, 
  viewMode, 
  onProductClick, 
  onWishlistClick,
  isFavorited = false,
  useMock = false,
  statusBadge = null
}: ProductItemProps) => {
  const isMobile = useIsMobile();
  
  const handleClick = () => {
    if (onProductClick) {
      onProductClick(product.product_id || product.id || "");
    }
  };

  // Base price display logic
  const basePrice = getBasePrice(product);
  
  return (
    <div 
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition-all hover:shadow-md",
        viewMode === "list" ? "flex-row" : ""
      )}
    >
      <div
        className={cn(
          "cursor-pointer relative",
          viewMode === "list" ? "w-1/3" : "w-full"
        )}
        onClick={handleClick}
        data-testid="product-item"
      >
        <ProductImage 
          product={product}
          aspectRatio="square" 
          className="h-full w-full object-cover transition-all"
          useMock={useMock}
        />
        
        {/* Status badge */}
        {statusBadge && (
          <div className="absolute top-2 left-2 z-10">
            <div className={cn("text-xs font-medium px-2 py-1 rounded-full", statusBadge.color)}>
              {statusBadge.badge}
            </div>
          </div>
        )}
      </div>
      
      {/* Wishlist button - increased touch target size for mobile */}
      <div className={cn(
        "absolute right-2 top-2 z-10",
        isMobile && "right-1.5 top-1.5" 
      )}>
        <WishlistButton 
          onWishlistClick={onWishlistClick}
          isFavorited={isFavorited}
          productId={product.product_id || product.id || ""}
          productName={product.title || product.name || ""}
          productImage={product.image}
          productPrice={product.price}
          productBrand={product.brand}
        />
      </div>
      
      {/* Product details section with mobile optimizations */}
      <div 
        className={cn(
          "flex flex-col",
          isMobile ? "p-2.5" : "p-3", // Adjusted padding for mobile
          viewMode === "list" ? "w-2/3" : "w-full"
        )}
      >
        <ProductDetails
          product={product}
          onClick={handleClick}
          basePrice={basePrice}
          viewMode={viewMode}
        />
      </div>
    </div>
  );
};

export default ProductItem;
