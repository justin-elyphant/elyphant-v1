
import React from "react";
import { cn } from "@/lib/utils";
import { Product } from "@/contexts/ProductContext";
import { getProductFallbackImage } from "./productImageUtils";

interface ProductImageProps {
  src?: string;
  alt?: string;
  className?: string;
  aspectRatio?: "square" | "video" | "wide";
  product?: Product | {
    name: string;
    category?: string;
    image?: string | null;
  };
  useMock?: boolean;
}

const ProductImage = ({ 
  src, 
  alt,
  product,
  className, 
  aspectRatio = "square",
  useMock = false
}: ProductImageProps) => {
  const [imgError, setImgError] = React.useState(false);
  
  const aspectRatioClasses = {
    square: "aspect-square",
    video: "aspect-video",
    wide: "aspect-[16/9]",
  };

  // Handle product prop if provided
  let imageSource = src || "";
  let imageAlt = alt || "";

  if (product) {
    // If product is provided, use its properties
    imageSource = product.image || "";
    imageAlt = product.name || product.title || "Product";
  }
  
  // Generate a placeholder image based on the product name
  const placeholderImage = useMock && product 
    ? getProductFallbackImage(product.name || product.title || "Product", product.category)
    : `https://placehold.co/600x600?text=${encodeURIComponent(imageAlt || "Product")}`;
  
  // Use placeholder if image is null, empty, or has an error
  const finalImageSource = imgError || !imageSource ? placeholderImage : imageSource;
  
  return (
    <div className={cn(
      "overflow-hidden bg-gray-100", 
      aspectRatioClasses[aspectRatio], 
      className
    )}>
      <img 
        src={finalImageSource} 
        alt={imageAlt} 
        onError={() => setImgError(true)}
        className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
    </div>
  );
};

export default ProductImage;
