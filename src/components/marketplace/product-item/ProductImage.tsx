
import React, { useState } from "react";
import { ImageOff } from "lucide-react";
import { getExactProductImage } from "../zinc/utils/images/productImageUtils";

interface ProductImageProps {
  product: {
    name: string;
    category?: string;
    image?: string;
  };
}

const ProductImage = ({ product }: ProductImageProps) => {
  const [imageError, setImageError] = useState(false);
  const [fallbackImageError, setFallbackImageError] = useState(false);
  
  const handleImageError = () => {
    console.log(`Image failed to load for product: ${product.name}`);
    setImageError(true);
  };

  const handleFallbackImageError = () => {
    console.log(`Fallback image also failed for: ${product.name}`);
    setFallbackImageError(true);
  };

  const getProductImage = () => {
    // If we have a valid image that's not a placeholder or unsplash, use it
    if (product.image && product.image !== '/placeholder.svg' && !product.image.includes('unsplash.com')) {
      return product.image;
    }
    
    // Otherwise, get an Amazon image based on product name and category
    return getExactProductImage(product.name, product.category || 'Electronics');
  };

  if (imageError && fallbackImageError) {
    return (
      <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
        <ImageOff className="h-8 w-8 text-gray-400" />
      </div>
    );
  }

  return (
    <>
      {imageError ? (
        <img 
          src={getExactProductImage(product.name, product.category || 'Electronics')}
          alt={product.name}
          className="w-full h-48 object-cover"
          onError={handleFallbackImageError}
        />
      ) : (
        <img 
          src={getProductImage()} 
          alt={product.name} 
          className="w-full h-48 object-cover"
          onError={handleImageError}
        />
      )}
    </>
  );
};

export default ProductImage;
