
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
      // For Amazon products, prioritize real Amazon images
      if (product.vendor === "Amazon via Zinc" || product.image?.includes('amazon.com')) {
        try {
          // Generate multiple category-specific images
          const mainCategoryImage = getExactProductImage(product.name, product.category);
          const variantImage = getExactProductImage(product.name + " variant", product.category);
          const accessoryImage = getExactProductImage(product.name + " detailed", product.category);
          
          // Create an array of images with the main image first
          const amazonImageArray = [
            product.image && !product.image.includes('unsplash.com') && !product.image.includes('placeholder') 
              ? product.image 
              : mainCategoryImage,
            mainCategoryImage,
            variantImage,
            accessoryImage
          ];
          
          // Filter out any duplicate images using Set
          const uniqueImageArray = [...new Set(amazonImageArray)];
          
          console.log("Generated Amazon image array:", uniqueImageArray);
          setImages(uniqueImageArray);
          return;
        } catch (error) {
          console.error("Error generating Amazon product images:", error);
        }
      }
      
      // Check if the product already has an images array
      if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        // Filter out any placeholder or unsplash images
        const filteredImages = product.images.filter(img => 
          !!img && img !== '/placeholder.svg' && !img.includes('unsplash.com')
        );
        
        // If we have filtered images, use them
        if (filteredImages.length > 0) {
          console.log("Using product.images array:", filteredImages);
          setImages(filteredImages);
          return;
        }
      }
      
      // If we get here, try to create category-specific images
      if (product.category) {
        const mainImage = product.image && !product.image.includes('unsplash.com') && !product.image.includes('placeholder')
          ? product.image
          : getExactProductImage(product.name, product.category);
          
        const additionalImages = [
          getExactProductImage(product.name + " variant", product.category),
          getExactProductImage(product.name + " detail", product.category)
        ];
        
        // Use Set to ensure unique images
        const uniqueImages = [...new Set([mainImage, ...additionalImages])];
        
        console.log("Generated category-based images:", uniqueImages);
        setImages(uniqueImages);
        return;
      }
      
      // Last resort - just use the single product image or placeholder
      const imageToUse = product.image && product.image !== '/placeholder.svg' && !product.image.includes('unsplash.com')
        ? product.image
        : getExactProductImage(product.name, "Electronics");
      
      console.log("Using single product image:", imageToUse);
      setImages([imageToUse]);
    }
    
    loadAndSetImages();
  }, [product]);

  return images;
};
