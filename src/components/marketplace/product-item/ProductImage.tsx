
import React, { useState, useEffect } from "react";
import { ImageOff } from "lucide-react";
import { getExactProductImage } from "../zinc/utils/images/productImageUtils";

interface ProductImageProps {
  product: {
    name: string;
    category?: string;
    image?: string;
  };
  useMock?: boolean;
}

const ProductImage = ({ product, useMock = false }: ProductImageProps) => {
  const [imageError, setImageError] = useState(false);
  const [fallbackImageError, setFallbackImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  useEffect(() => {
    // Reset state when product changes
    setImageError(false);
    setFallbackImageError(false);
    
    // Always prioritize the provided image URL if available
    if (product.image && product.image !== "/placeholder.svg") {
      setImageUrl(product.image);
      console.log(`ProductImage: Using provided image URL for ${product.name}: ${product.image}`);
    } else {
      // Get a fresh image URL directly from Amazon/Zinc
      const directImageUrl = getExactProductImage(product.name, product.category || 'Electronics');
      setImageUrl(directImageUrl);
      console.log(`ProductImage: Initial image URL for ${product.name}: ${directImageUrl}`);
    }
  }, [product.name, product.category, product.image, useMock]);
  
  const handleImageError = () => {
    console.log(`Image failed to load for product: ${product.name}`);
    setImageError(true);
    
    // Try one more time with a different category
    const alternativeCategory = product.category === 'Electronics' ? 'Home' : 'Electronics';
    const fallbackUrl = getExactProductImage(product.name, alternativeCategory);
    setImageUrl(fallbackUrl);
  };

  const handleFallbackImageError = () => {
    console.log(`Fallback image also failed for: ${product.name}`);
    setFallbackImageError(true);
  };

  if (imageError && fallbackImageError) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <ImageOff className="h-8 w-8 text-gray-400" />
      </div>
    );
  }

  return (
    <>
      {imageUrl && (
        <img 
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
          onError={imageError ? handleFallbackImageError : handleImageError}
          loading="lazy"
        />
      )}
    </>
  );
};

export default ProductImage;
