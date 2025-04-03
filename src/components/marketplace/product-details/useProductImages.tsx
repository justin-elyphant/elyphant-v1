
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
      imageArray = [product.image];
      
      // Generate a couple of variations for better UX
      if (product.image.includes('amazon.com')) {
        // For Amazon images, add variation parameters
        imageArray.push(`${product.image}?view=2`);
        imageArray.push(`${product.image}?view=3`);
      }
      
      console.log("Using single product.image with variations:", imageArray);
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
