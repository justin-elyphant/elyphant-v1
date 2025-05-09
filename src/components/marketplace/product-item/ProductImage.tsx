
import React, { useState } from "react";
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
  const [imageError, setImageError] = useState(false);

  // Determine the appropriate aspect ratio value
  const getAspectRatioValue = (ratio: string): number => {
    switch (ratio) {
      case "portrait": return 3/4;
      case "wide": return 16/9;
      case "square":
      default: return 1/1;
    }
  };

  // Get primary image with fallbacks - optimized for performance
  const getPrimaryImage = (): string => {
    // If we already had an error loading the image, go directly to fallback
    if (imageError) {
      const productName = product?.title || product?.name || "Product";
      const productCategory = product?.category || "Product";
      return getProductFallbackImage(productName, productCategory);
    }
    
    // If useMock is true, return a consistent mock image
    if (useMock) {
      return "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158";
    }
    
    // Fast path: Check for single image property first (most common case)
    if (product?.image && typeof product.image === 'string' && product.image !== "/placeholder.svg") {
      console.log("Using product image:", product.image);
      return product.image;
    }
    
    // Check if product has an images array with valid items
    if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
      const validImage = product.images.find(img => img && typeof img === 'string' && img !== "/placeholder.svg");
      if (validImage) {
        console.log("Using image from array:", validImage);
        return validImage;
      }
    }
    
    // Use a specific fallback based on product category and title
    const productName = product?.title || product?.name || "Product";
    const productCategory = product?.category || "Product";
    const fallback = getProductFallbackImage(productName, productCategory);
    console.log("Using fallback image:", fallback);
    return fallback;
  };

  const imageUrl = getPrimaryImage();
  const productName = product?.title || product?.name || "Product";

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error("Image failed to load:", imageUrl);
    setImageError(true);
    // If image fails to load, use category-specific fallback
    const fallback = getProductFallbackImage(productName, product?.category || "");
    (e.target as HTMLImageElement).src = fallback;
  };

  return (
    <AspectRatio 
      ratio={getAspectRatioValue(aspectRatio)} 
      className={cn("bg-slate-100 overflow-hidden rounded-t-md", className)}
    >
      <img
        src={imageUrl}
        alt={productName}
        className="h-full w-full object-cover transition-all hover:scale-105"
        onError={handleImageError}
        loading="lazy" 
      />
    </AspectRatio>
  );
};

export default ProductImage;
