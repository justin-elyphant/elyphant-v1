
import React from "react";
import { Product } from "@/contexts/ProductContext";
import ProductImage from "./ProductImage";
import ProductRating from "./ProductRating";
import ProductDetails from "./ProductDetails";
import WishlistButton from "../WishlistButton";
import { useAuth } from "@/contexts/auth";

interface ProductItemProps {
  product: Product;
  viewMode: "grid" | "list";
  onProductClick: (productId: number) => void;
  onWishlistClick: (e: React.MouseEvent) => void;
  isFavorited: boolean;
}

const ProductItem = ({ 
  product, 
  viewMode, 
  onProductClick,
  onWishlistClick,
  isFavorited 
}: ProductItemProps) => {
  const { userData } = useAuth();

  return (
    <div 
      className={`group relative rounded-lg overflow-hidden border ${
        viewMode === 'grid' ? 'h-full flex flex-col' : 'flex'
      } bg-white hover:shadow-md transition-shadow cursor-pointer`}
      onClick={() => onProductClick(product.id)}
      data-testid={`product-item-${product.id}`}
    >
      <div className={viewMode === 'grid' ? 'relative' : 'w-1/4'}>
        <ProductImage 
          product={product} 
          className={`
            ${viewMode === 'grid' 
              ? 'w-full aspect-square object-cover' 
              : 'w-full h-full object-cover aspect-square'}
          `}
        />
        <WishlistButton 
          userData={userData}
          productId={product.id}
          productName={product.name}
          onWishlistClick={onWishlistClick}
          isFavorited={isFavorited}
        />
      </div>
      
      <ProductDetails 
        product={product} 
        viewMode={viewMode}
      />
    </div>
  );
};

export default ProductItem;
