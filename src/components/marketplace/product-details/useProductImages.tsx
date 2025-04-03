
import { Product } from "@/contexts/ProductContext";
import { useEffect, useState } from "react";
import { processImages } from "./carousel/utils/imageUtils";
import { getExactProductImage } from "../zinc/utils/images/productImageUtils";
import { searchProducts, fetchProductDetails } from "../zinc/zincService";

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
    
    async function loadAndSetImages() {
      // Try to fetch additional images for Amazon products
      if (product.vendor === "Amazon via Zinc" && product.image && product.image.includes('amazon.com')) {
        try {
          // If it's an Amazon product, try to fetch more details using the product's ID
          const productIdToUse = String(product.id); // Convert the numeric ID to string
          
          console.log("Fetching additional product details for Amazon product:", productIdToUse);
          const details = await fetchProductDetails(productIdToUse);
          
          if (details && details.images && details.images.length > 0) {
            console.log("Found additional images from product details:", details.images.length);
            setImages([...new Set(details.images)]);
            return;
          }
        } catch (error) {
          console.error("Error fetching additional product images:", error);
        }
      }
      
      // Process images from the product if we couldn't fetch additional ones
      const processedImages = getProcessedImages(product);
      
      // Ensure we have unique images by using Set
      const uniqueImages = Array.from(new Set(processedImages));
      
      // Set the final image array
      console.log("Final unique image array length:", uniqueImages.length);
      setImages(uniqueImages);
    }
    
    loadAndSetImages();
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
      console.log("Using product.images array:", filteredImages);
      return filteredImages;
    }
  } 
  
  // Case 2: Product only has a single image
  if (product.image && product.image !== '/placeholder.svg' && !product.image.includes('unsplash.com')) {
    // For Amazon products, try to add a category-specific image as well
    if (product.image.includes('amazon.com') || product.image.includes('m.media-amazon.com')) {
      const result = [product.image];
      
      // Try to add a category-specific image if applicable
      if (product.category) {
        const specificImage = getExactProductImage(product.name, product.category);
        if (specificImage && specificImage !== product.image) {
          result.push(specificImage);
        }
      }
      
      console.log("Using Amazon product image with category image:", result);
      return result;
    }
    
    // For non-Amazon images, just use the single image
    console.log("Using single product.image:", [product.image]);
    return [product.image];
  }
  
  // Case 3: Fallback to placeholder only if no valid product images
  console.log("Using placeholder image");
  return ["/placeholder.svg"];
}

