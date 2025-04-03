
import { Product } from "@/contexts/ProductContext";
import { useEffect, useState } from "react";
import { createImageVariations } from "./imageUtils";

/**
 * Custom hook to manage product images with improved organization
 */
export const useProductImages = (product: Product | null) => {
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    if (!product) return;

    // Log initial product image data for debugging
    console.log("useProductImages processing product:", {
      name: product.name,
      hasImagesArray: !!product.images,
      imagesLength: product.images?.length || 0,
      image: product.image
    });
    
    // Process images from the product
    const processedImages = getProcessedImages(product);
    
    // Set the final image array
    console.log("Final image array length:", processedImages.length);
    setImages(processedImages);
  }, [product]);

  return images;
};

/**
 * Process and return images from a product
 */
function getProcessedImages(product: Product): string[] {
  // Case 1: Product has an 'images' array with content
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    // Filter out any invalid image URLs and placeholders
    const filteredImages = product.images.filter(img => 
      !!img && img !== '/placeholder.svg' && !img.includes('unsplash.com')
    );
    
    // If we have valid images after filtering, use them
    if (filteredImages.length > 0) {
      // Ensure no duplicate images in the array
      const uniqueImages = Array.from(new Set(filteredImages));
      console.log("Using product.images array:", uniqueImages);
      return uniqueImages;
    }
  } 
  
  // Case 2: Product only has a single image
  if (product.image && product.image !== '/placeholder.svg' && !product.image.includes('unsplash.com')) {
    // Generate variations without adding generic fallbacks
    const imageVariations = createImageVariations(product.image, product.name);
    console.log("Using single product.image with enhanced variations:", imageVariations);
    return imageVariations;
  }
  
  // Case 3: Fallback to placeholder only if no valid product images
  console.log("Using placeholder image");
  return ["/placeholder.svg"];
}
