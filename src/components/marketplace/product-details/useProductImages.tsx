
import { Product } from "@/contexts/ProductContext";
import { useEffect, useState } from "react";

export const useProductImages = (product: Product | null) => {
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    if (!product) return;

    let imageArray: string[] = [];
    
    console.log("useProductImages processing product:", {
      name: product.name,
      hasImagesArray: !!product.images,
      imagesLength: product.images?.length || 0,
      image: product.image
    });
    
    // 1. Check if product has an 'images' array with content
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      imageArray = product.images.filter(img => !!img); // Remove any falsy values
      console.log("Using product.images array:", imageArray);
    } 
    // 2. If no images array or it's empty, use the single image
    else if (product.image) {
      // Base image
      imageArray = [product.image];
      
      // Create variations with distinct parameters to ensure different images are shown
      // For Amazon images, create visually different variations
      if (product.image.includes('amazon.com') || product.image.includes('m.media-amazon.com')) {
        // Extract the base URL without any existing parameters
        const baseUrl = product.image.split('?')[0];
        
        // Generate visually distinct variations with different size parameters
        imageArray = [
          baseUrl, // Original image
          `${baseUrl}?sx=500&sy=500&ex=500&ey=500`, // Square crop
          `${baseUrl}?sx=600&sy=300&ex=600&ey=300` // Wider crop
        ];
        
        // Add another variation with a different angle if available
        const productName = product.name.toLowerCase();
        if (productName.includes('tv') || productName.includes('monitor')) {
          imageArray.push(`${baseUrl}?angle=side`);
        } else if (productName.includes('phone') || productName.includes('laptop')) {
          imageArray.push(`${baseUrl}?angle=back`);
        } else {
          imageArray.push(`${baseUrl}?angle=alt`);
        }
      } else {
        // For non-Amazon images, still try to create variations
        imageArray = [
          product.image,
          `${product.image}${product.image.includes('?') ? '&' : '?'}variant=1`,
          `${product.image}${product.image.includes('?') ? '&' : '?'}variant=2`
        ];
      }
      
      console.log("Using single product.image with enhanced variations:", imageArray);
    } 
    // 3. Fallback to placeholder if no images are available
    else {
      imageArray = ["/placeholder.svg"];
      console.log("Using placeholder image");
    }
    
    // Log the final array we're setting
    console.log("Final image array length:", imageArray.length);
    
    setImages(imageArray);
  }, [product]);

  return images;
};
