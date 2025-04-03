
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
      // For Amazon images, only use the original image from the array to avoid mixing products
      const isAmazonImage = filteredImages[0]?.includes('amazon.com') || filteredImages[0]?.includes('m.media-amazon.com');
      
      if (isAmazonImage) {
        // For Amazon, just use the first image and maybe one category-specific image
        const baseImage = filteredImages[0];
        const result = [baseImage];
        
        // Try to add a category-specific image if applicable
        if (product.category) {
          const specificImage = getExactProductImage(product.name, product.category);
          if (specificImage && !result.includes(specificImage)) {
            result.push(specificImage);
          }
        }
        
        console.log("Using Amazon product with minimal variations:", result);
        return result;
      }
      
      // For non-Amazon images, use the array as-is
      console.log("Using product.images array:", filteredImages);
      return filteredImages;
    }
  } 
  
  // Case 2: Product only has a single image
  if (product.image && product.image !== '/placeholder.svg' && !product.image.includes('unsplash.com')) {
    // For Amazon images, be very conservative with variations
    const isAmazonImage = product.image.includes('amazon.com') || product.image.includes('m.media-amazon.com');
    
    if (isAmazonImage) {
      // For Amazon, just use the original image plus maybe one category image
      const result = [product.image];
      
      // Try to add a category-specific image if we have one
      if (product.category) {
        const specificImage = getExactProductImage(product.name, product.category);
        if (specificImage && !result.includes(specificImage)) {
          result.push(specificImage);
        }
      }
      
      console.log("Using single Amazon image with minimal variations:", result);
      return result;
    }
    
    // For non-Amazon images, generate variations more safely
    const imageVariations = generateImageVariations(product.image, product.name);
    console.log("Using single product.image with variations:", imageVariations);
    return imageVariations;
  }
  
  // Case 3: Fallback to placeholder only if no valid product images
  console.log("Using placeholder image");
  return ["/placeholder.svg"];
}
