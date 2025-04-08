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
  
  const handleImageError = () => {
    console.log(`Image failed to load for product: ${product.name}`);
    setImageError(true);
  };

  const getProductImage = () => {
    // If we have a valid image that's not a placeholder or unsplash, use it
    if (product.image && product.image !== '/placeholder.svg' && !product.image.includes('unsplash.com')) {
      return product.image;
    }
    
    // Otherwise, get an Amazon image based on product name and category
    return getExactProductImage(product.name, product.category || 'Electronics');
  };

  return (
    <>
      {imageError ? (
        <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
          <img 
            src={getExactProductImage(product.name, product.category || 'Electronics')}
            alt={product.name}
            className="w-full h-48 object-cover"
            onError={() => console.log(`Fallback image also failed for: ${product.name}`)}
          />
        </div>
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
