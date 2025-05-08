
import React from "react";
import { cn } from "@/lib/utils";

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: "square" | "video" | "wide";
}

const ProductImage = ({ 
  src, 
  alt, 
  className, 
  aspectRatio = "square" 
}: ProductImageProps) => {
  const [imgError, setImgError] = React.useState(false);
  
  const aspectRatioClasses = {
    square: "aspect-square",
    video: "aspect-video",
    wide: "aspect-[16/9]",
  };
  
  // Generate a placeholder image based on the product name
  const placeholderImage = `https://placehold.co/600x600?text=${encodeURIComponent(alt || "Product")}`;
  
  const imageSource = imgError || !src ? placeholderImage : src;
  
  return (
    <div className={cn(
      "overflow-hidden bg-gray-100", 
      aspectRatioClasses[aspectRatio], 
      className
    )}>
      <img 
        src={imageSource} 
        alt={alt} 
        onError={() => setImgError(true)}
        className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
    </div>
  );
};

export default ProductImage;
