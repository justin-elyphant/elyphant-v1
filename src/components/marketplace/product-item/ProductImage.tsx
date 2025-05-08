
import React from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { cn } from "@/lib/utils";
import { getProductFallbackImage } from "./productImageUtils";

interface ProductImageProps {
  product: {
    image?: string;
    images?: string[];
    title?: string;
    name?: string;
    category?: string; 
  };
  aspectRatio?: "square" | "portrait" | "wide";
  className?: string;
  useMock?: boolean;
}

const ProductImage = ({ 
  product, 
  aspectRatio = "square", 
  className,
  useMock = false
}: ProductImageProps) => {
  // Determine the appropriate aspect ratio value
  const getAspectRatioValue = (ratio: string): number => {
    switch (ratio) {
      case "portrait": return 3/4;
      case "wide": return 16/9;
      case "square":
      default: return 1/1;
    }
  };

  // Get primary image with fallbacks
  const getPrimaryImage = (): string => {
    // If useMock is true, return a consistent mock image
    if (useMock) {
      return "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158";
    }
    
    // Check if product has an images array with valid items
    if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
      const validImage = product.images.find(img => img && typeof img === 'string' && img !== "/placeholder.svg");
      if (validImage) return validImage;
    }
    
    // Check for single image property
    if (product?.image && typeof product.image === 'string' && product.image !== "/placeholder.svg") {
      return product.image;
    }
    
    // Use a specific fallback based on product category and title
    const productName = product?.title || product?.name || "Product";
    const productCategory = product?.category || "Product";
    return getProductFallbackImage(productName, productCategory);
  };

  const imageUrl = getPrimaryImage();
  const productName = product?.title || product?.name || "Product";

  return (
    <AspectRatio 
      ratio={getAspectRatioValue(aspectRatio)} 
      className={cn("bg-slate-100 overflow-hidden rounded-md", className)}
    >
      <img
        src={imageUrl}
        alt={productName}
        className="h-full w-full object-cover transition-all hover:scale-105"
        onError={(e) => {
          // If image fails to load, use category-specific fallback
          const fallback = getProductFallbackImage(productName, product?.category || "");
          (e.target as HTMLImageElement).src = fallback;
        }}
      />
    </AspectRatio>
  );
};

export default ProductImage;
