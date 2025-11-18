import React, { useEffect, useState } from "react";
import { resolveOrderItemImage } from "@/services/orderImageResolutionService";

interface EnhancedOrderItemImageProps {
  item: any;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: "w-12 h-12",
  md: "w-16 h-16", 
  lg: "w-20 h-20"
};

const placeholderSizes = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base"
};

const EnhancedOrderItemImage: React.FC<EnhancedOrderItemImageProps> = ({
  item,
  size = 'md',
  className = ""
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const productName = (item as any).title || (item as any).product_name || item.name || "Product";
  const cleanedName = productName.replace(/,?\s*\d+\s*(EA|ea|each|pack|ct|count|piece|pc|pcs|unit|units)\.?$/i, '').trim();

  useEffect(() => {
    let cancelled = false;

    const loadImage = async () => {
      setIsLoading(true);
      setImageError(false);

      try {
        const result = await resolveOrderItemImage(item);
        
        if (!cancelled) {
          setImageSrc(result.imageUrl);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("[EnhancedOrderItemImage] Failed to resolve image:", error);
        if (!cancelled) {
          setImageSrc(null);
          setIsLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      cancelled = true;
    };
  }, [item]);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className={`${sizeClasses[size]} bg-muted rounded-lg flex items-center justify-center overflow-hidden relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-muted/50 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      )}
      
      {imageSrc && !imageError ? (
        <img 
          src={imageSrc} 
          alt={cleanedName}
          className="w-full h-full object-cover transition-opacity duration-200"
          onError={handleImageError}
          onLoad={() => setIsLoading(false)}
        />
      ) : (
        <div className={`${placeholderSizes[size]} bg-primary/10 rounded flex items-center justify-center`}>
          <span className="text-primary font-medium">
            {cleanedName.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
};

export default EnhancedOrderItemImage;