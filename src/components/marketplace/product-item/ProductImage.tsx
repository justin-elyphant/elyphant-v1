
import React, { useState } from "react";
import { ImageOff } from "lucide-react";
import { getProductFallbackImage } from "./productImageUtils";

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

  return (
    <>
      {imageError ? (
        <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
          <img 
            src={getProductFallbackImage(product.name, product.category)}
            alt={product.name}
            className="w-full h-48 object-cover"
            onError={() => console.log(`Fallback image also failed for: ${product.name}`)}
          />
        </div>
      ) : (
        <img 
          src={product.image || '/placeholder.svg'} 
          alt={product.name} 
          className="w-full h-48 object-cover"
          onError={handleImageError}
        />
      )}
    </>
  );
};

export default ProductImage;
