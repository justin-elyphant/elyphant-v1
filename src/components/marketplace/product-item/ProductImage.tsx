
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
    
    // If useMock is true, use our local mock images instead of API calls
    if (useMock) {
      const mockUrl = getMockImageForCategory(product.name, product.category || 'Electronics');
      setImageUrl(mockUrl);
      console.log(`ProductImage: Using mock image URL for ${product.name}: ${mockUrl}`);
    } else {
      // Get a fresh image URL directly from Amazon/Zinc
      const directImageUrl = getExactProductImage(product.name, product.category || 'Electronics');
      setImageUrl(directImageUrl);
      console.log(`ProductImage: Initial image URL for ${product.name}: ${directImageUrl}`);
    }
  }, [product.name, product.category, useMock]);
  
  const handleImageError = () => {
    console.log(`Image failed to load for product: ${product.name}`);
    setImageError(true);
    
    // Try one more time with a different category
    const alternativeCategory = product.category === 'Electronics' ? 'Home' : 'Electronics';
    const fallbackUrl = useMock 
      ? getMockImageForCategory(product.name, alternativeCategory)
      : getExactProductImage(product.name, alternativeCategory);
    setImageUrl(fallbackUrl);
  };

  const handleFallbackImageError = () => {
    console.log(`Fallback image also failed for: ${product.name}`);
    setFallbackImageError(true);
  };

  // Get a consistent mock image based on category
  const getMockImageForCategory = (name: string, category?: string): string => {
    const normalizedCategory = category?.toLowerCase() || '';
    
    // Collection thumbnails
    if (normalizedCategory.includes('summer')) {
      return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&h=300&fit=crop";
    }
    if (normalizedCategory.includes('office')) {
      return "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=500&h=300&fit=crop";
    }
    if (normalizedCategory.includes('electronics')) {
      return "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=500&h=300&fit=crop";
    }
    if (normalizedCategory.includes('pet')) {
      return "https://images.unsplash.com/photo-1560743641-3914f2c45636?w=500&h=300&fit=crop";
    }
    if (normalizedCategory.includes('home') || normalizedCategory.includes('decor')) {
      return "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&h=300&fit=crop";
    }
    
    // Occasion thumbnails
    if (normalizedCategory.includes('birthday')) {
      return "https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=300&h=300&fit=crop";
    }
    if (normalizedCategory.includes('wedding')) {
      return "https://images.unsplash.com/photo-1525328437458-0c4d4db7cab4?w=300&h=300&fit=crop";
    }
    if (normalizedCategory.includes('anniversary')) {
      return "https://images.unsplash.com/photo-1537274942065-eda9d00a6293?w=300&h=300&fit=crop";
    }
    if (normalizedCategory.includes('graduation')) {
      return "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=300&h=300&fit=crop";
    }
    if (normalizedCategory.includes('baby')) {
      return "https://images.unsplash.com/photo-1544126592-55d068bdcbe9?w=300&h=300&fit=crop";
    }
    if (normalizedCategory.includes('pet')) {
      return "https://images.unsplash.com/photo-1560743641-3914f2c45636?w=300&h=300&fit=crop";
    }
    
    // General fallback
    return "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=500&h=300&fit=crop";
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
