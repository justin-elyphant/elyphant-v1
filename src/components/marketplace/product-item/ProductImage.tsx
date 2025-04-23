
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
    } else {
      // Get a fresh image URL directly from Amazon/Zinc
      const directImageUrl = getExactProductImage(product.name, product.category || 'Electronics');
      setImageUrl(directImageUrl);
    }
  }, [product.name, product.category, product.image, useMock]);
  
  const handleImageError = () => {
    setImageError(true);
    
    // Try one more time with a different category
    const alternativeCategory = product.category === 'Electronics' ? 'Home' : 'Electronics';
    const fallbackUrl = getExactProductImage(product.name, alternativeCategory);
    setImageUrl(fallbackUrl);
  };

  const handleFallbackImageError = () => {
    setFallbackImageError(true);
  };

  // Ultimate fallback - lifestyle images
  const getStyleFallbackImage = () => {
    const lifestyleImages = [
      "/lovable-uploads/f0a52aa3-9dcd-4367-9a66-0724e97f2641.png", // Assuming this is one of your lifestyle images
      "/lovable-uploads/f2de31b2-3028-48b8-b4ce-22ed58bbcf81.png", // Another one
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158", // Unsplash fallback
      "https://images.unsplash.com/photo-1531297484001-80022131f5a1", // Unsplash fallback
    ];
    
    // Get a consistent but random image for each product based on product name
    const nameHash = product.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const index = nameHash % lifestyleImages.length;
    
    return lifestyleImages[index];
  };

  if (imageError && fallbackImageError) {
    return (
      <div className="w-full h-full aspect-square">
        <img
          src={getStyleFallbackImage()}
          alt={`Lifestyle image for ${product.name}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className="aspect-square">
      {imageUrl && (
        <img 
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
          onError={imageError ? handleFallbackImageError : handleImageError}
          loading="lazy"
        />
      )}
    </div>
  );
};

export default ProductImage;
