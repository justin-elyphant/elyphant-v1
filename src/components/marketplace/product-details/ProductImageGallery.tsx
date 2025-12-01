import React from "react";
import ProductCarousel from "./ProductCarousel";
import { cn } from "@/lib/utils";

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
  isLoading?: boolean;
}

const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({ 
  images, 
  productName,
  isLoading = false
}) => {
  return (
    <div className="bg-white rounded-lg overflow-hidden sticky top-24">
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-elyphant-black"></div>
        </div>
      )}
      <ProductCarousel 
        images={images}
        productName={productName}
      />
    </div>
  );
};

export default ProductImageGallery;
