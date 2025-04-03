
import { Product } from "@/contexts/ProductContext";
import { useEffect, useState } from "react";

export const useProductImages = (product: Product | null) => {
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    if (!product) return;

    let imageArray: string[] = [];
    
    // 1. Check if product has an 'images' array with content
    if (product.images && product.images.length > 0) {
      imageArray = product.images;
      console.log("Using product.images array:", imageArray);
    } 
    // 2. If no images array or it's empty, use the single image
    else if (product.image) {
      imageArray = [product.image];
      console.log("Using single product.image:", imageArray);
    } 
    // 3. Fallback to placeholder if no images are available
    else {
      imageArray = ["/placeholder.svg"];
      console.log("Using placeholder image");
    }
    
    setImages(imageArray);
  }, [product]);

  return images;
};
