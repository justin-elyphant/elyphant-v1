import { useState, useEffect, useMemo } from 'react';
import { Product } from '@/types/product';
import { fetchProductDetails } from '../zinc/services/productDetailsService';

export const useProductImages = (product: Product) => {
  const [images, setImages] = useState<string[]>([product?.image]);

  useEffect(() => {
    const fetchImages = async () => {
      // If the product already has multiple images, use those
      if (product.images && product.images.length > 0) {
        setImages(product.images);
        return;
      }

      // If the product is from Amazon/Zinc, try to fetch additional images
      if (product.vendor === 'Amazon via Zinc' && product.id) {
        try {
          const detailedProduct = await fetchProductDetails(product.id.toString());
          
          if (detailedProduct && detailedProduct.images && detailedProduct.images.length > 0) {
            console.log(`Found ${detailedProduct.images.length} images for product ${product.id}`);
            setImages(detailedProduct.images);
            return;
          }
        } catch (error) {
          console.error(`Error fetching product images for ${product.id}:`, error);
        }
      }
      
      // Fallback to just using the main image
      setImages([product.image]);
    };

    fetchImages();
  }, [product.id, product.image, product.images, product.vendor]);

  return images;
};
