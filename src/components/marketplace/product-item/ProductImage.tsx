
import React from "react";
import { cn } from "@/lib/utils";
import { Product } from "@/contexts/ProductContext";
import { getProductFallbackImage, isValidImageUrl } from "./productImageUtils";

interface ProductImageProps {
  src?: string;
  alt?: string;
  className?: string;
  aspectRatio?: "square" | "video" | "wide";
  product?: Product | {
    name: string;
    title?: string; // Added title as optional property
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
  useMock = true // Changed default to true to always use mockup fallbacks
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
    // Use name or title, ensuring we handle the possibility that title might not exist
    imageAlt = product.name || (product as any).title || "Product";
  }
  
  // Pre-check if image source is valid
  const hasValidImage = isValidImageUrl(imageSource);
  
  // Generate a placeholder image based on the product name
  const productName = product ? (product.name || (product as any).title || "Product") : (alt || "Product");
  const productCategory = product?.category || "";
  const placeholderImage = getProductFallbackImage(productName, productCategory);
  
  // Use placeholder if image is null, empty, has an error, or is not valid
  const finalImageSource = imgError || !hasValidImage ? placeholderImage : imageSource;
  
  // For debugging purposes
  console.log(`ProductImage: ${imageAlt} - Using image: ${finalImageSource} (original: ${imageSource}, valid: ${hasValidImage}, error: ${imgError})`);
  
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
