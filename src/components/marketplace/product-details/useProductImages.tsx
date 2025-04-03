
import { Product } from "@/contexts/ProductContext";
import { useEffect, useState } from "react";
import { generateImageVariations } from "./carousel/utils/imageUtils";
import { getExactProductImage } from "../zinc/utils/images/productImageUtils";

/**
 * Custom hook to manage product images with improved organization and uniqueness
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
    
    // Ensure we have unique images by using Set
    const uniqueImages = Array.from(new Set(processedImages));
    
    // Set the final image array
    console.log("Final unique image array length:", uniqueImages.length);
    setImages(uniqueImages);
  }, [product]);

  return images;
};

/**
 * Process and return images from a product, ensuring uniqueness
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
      
      // If we have too few unique images, generate more variations
      if (uniqueImages.length < 3 && product.image) {
        const extraVariations = generateImageVariations(product.image, product.name)
          .filter(img => !uniqueImages.includes(img));
        uniqueImages.push(...extraVariations.slice(0, 4)); // Add up to 4 extras
      }
      
      // Try to add a category-specific image if we still need more
      if (uniqueImages.length < 3 && product.category) {
        const specificImage = getExactProductImage(product.name, product.category);
        if (specificImage && !uniqueImages.includes(specificImage)) {
          uniqueImages.push(specificImage);
        }
      }
      
      console.log("Using product.images array:", uniqueImages);
      return uniqueImages;
    }
  } 
  
  // Case 2: Product only has a single image
  if (product.image && product.image !== '/placeholder.svg' && !product.image.includes('unsplash.com')) {
    // Generate variations with distinct parameters to ensure uniqueness
    const imageVariations = generateImageVariations(product.image, product.name);
    
    // Try to add a category-specific image if we have one
    if (product.category) {
      const specificImage = getExactProductImage(product.name, product.category);
      if (specificImage && !imageVariations.includes(specificImage)) {
        imageVariations.push(specificImage);
      }
    }
    
    console.log("Using single product.image with enhanced variations:", imageVariations);
    return imageVariations;
  }
  
  // Case 3: Fallback to placeholder only if no valid product images
  console.log("Using placeholder image");
  return ["/placeholder.svg"];
}
