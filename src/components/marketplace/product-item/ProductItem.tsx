
import React from "react";
import { Product } from "@/contexts/ProductContext";
import { cn } from "@/lib/utils";
import ProductDetails from "./ProductDetails";
import ProductImage from "./ProductImage";
import WishlistButton from "./WishlistButton";
import { getBasePrice } from "./productUtils";

interface ProductItemProps {
  product: Product;
  viewMode: "grid" | "list";
  onProductClick?: (productId: string) => void;
  onWishlistClick?: (e: React.MouseEvent) => void; 
  isFavorited?: boolean;
  useMock?: boolean; // Add the useMock prop
}

const ProductItem = ({ 
  product, 
  viewMode, 
  onProductClick, 
  onWishlistClick,
  isFavorited = false,
  useMock = false // Default to false
}: ProductItemProps) => {
  const handleClick = () => {
    if (onProductClick) {
      onProductClick(product.product_id);
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
          "cursor-pointer",
          viewMode === "list" ? "w-1/3" : "w-full"
        )}
        onClick={handleClick}
        data-testid="product-item"
      >
        <ProductImage 
          product={product}
          aspectRatio="square" 
          className="h-full w-full object-cover transition-all"
          useMock={useMock} // Pass the useMock prop to ProductImage
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
