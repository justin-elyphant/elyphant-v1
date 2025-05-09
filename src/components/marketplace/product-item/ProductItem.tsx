
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
}

const ProductItem = ({ 
  product, 
  viewMode, 
  onProductClick, 
  onWishlistClick,
  isFavorited = false,
  useMock = false
}: ProductItemProps) => {
  const isMobile = useIsMobile();
  
  const handleClick = () => {
    if (onProductClick) {
      onProductClick(product.product_id);
    }
  };

  // Base price display logic
  const basePrice = getBasePrice(product);
  
  // Adjust list mode layout for mobile
  const listModeLayout = isMobile 
    ? "flex-col" // Stack vertically on mobile in list mode
    : "flex-row"; // Side by side on desktop in list mode
  
  return (
    <div 
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition-all hover:shadow-md",
        viewMode === "list" ? listModeLayout : ""
      )}
    >
      <div
        className={cn(
          "cursor-pointer",
          viewMode === "list" && !isMobile ? "w-1/3" : "w-full",
          viewMode === "list" && isMobile ? "aspect-square" : ""
        )}
        onClick={handleClick}
        data-testid="product-item"
      >
        <ProductImage 
          product={product}
          aspectRatio={viewMode === "list" && !isMobile ? "wide" : "square"}
          className="h-full w-full object-cover transition-all"
          useMock={useMock}
        />
      </div>
      
      {/* Wishlist button */}
      <div className="absolute right-2 top-2 z-10">
        <WishlistButton 
          onWishlistClick={onWishlistClick}
          isFavorited={isFavorited}
          productId={product.product_id}
          productName={product.title || ""}
          productImage={product.image}
          productPrice={product.price}
          productBrand={product.brand}
        />
      </div>
      
      {/* Product details section */}
      <div 
        className={cn(
          "flex flex-col p-3",
          viewMode === "list" && !isMobile ? "w-2/3" : "w-full"
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
