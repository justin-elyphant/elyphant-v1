import React from "react";
import ProductCarousel from "./ProductCarousel";
import { cn } from "@/lib/utils";

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
}

const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({ 
  images, 
  productName 
}) => {
  return (
    <div className="bg-white rounded-lg overflow-hidden sticky top-24">
      <ProductCarousel 
        images={images}
        productName={productName}
      />
    </div>
  );
};

export default ProductImageGallery;
