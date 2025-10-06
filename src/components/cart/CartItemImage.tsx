
import React, { useEffect, useState } from "react";
import { resolveOrderItemImage } from "@/services/orderImageResolutionService";

import type { CartItem } from "@/contexts/CartContext";

interface CartItemImageProps {
  item: CartItem;
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

const CartItemImage: React.FC<CartItemImageProps> = ({ item, size = 'md', className = "" }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const product = item.product;
  const productName = product?.title || product?.name || "Product";
  const cleanedName = productName.replace(/,?\s*\d+\s*(EA|ea|each|pack|ct|count|piece|pc|pcs|unit|units)\.?$/i, '').trim();

  useEffect(() => {
    let cancelled = false;

    const loadImage = async () => {
      setIsLoading(true);
      setImageError(false);

      try {
        // Enrich the item so the resolver can use familiar fields
        const enriched = {
          ...item,
          product_name: productName,
          name: productName,
          product_id: product?.product_id || (product as any)?.asin,
          retailer: product?.retailer || product?.vendor || 'amazon',
          image: product?.image,
          image_url: (product as any)?.image_url,
          images: product?.images
        } as any;

        const result = await resolveOrderItemImage(enriched);
        if (!cancelled) {
          setImageSrc(result.imageUrl);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("[CartItemImage] Failed to resolve image:", error);
        if (!cancelled) {
          setImageSrc(null);
          setIsLoading(false);
        }
      }
    };

    loadImage();
    return () => { cancelled = true; };
  }, [item, productName, product?.product_id]);

  return (
    <div className={`${sizeClasses[size]} bg-muted rounded-md overflow-hidden flex items-center justify-center relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-muted/50 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {imageSrc && !imageError ? (
        <img
          src={imageSrc}
          alt={cleanedName}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
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

export default CartItemImage;
