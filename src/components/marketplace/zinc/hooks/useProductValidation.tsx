
import { useCallback } from "react";
import { ZincProduct } from "../types";
import { getExactProductImage } from "../utils/images/productImageUtils";
import { isProductRelevantToSearch } from "../utils/productConverter";

/**
 * Hook for validating product data and ensuring consistency
 */
export const useProductValidation = () => {
  /**
   * Ensure a product has valid images and metadata
   */
  const validateProductImages = useCallback((product: ZincProduct, query: string): ZincProduct => {
    // Make a copy to avoid mutating the original
    const validatedProduct = { ...product };
    
    // Check if image is valid
    if (!validatedProduct.image || validatedProduct.image === "null" || validatedProduct.image === "undefined") {
      // Generate a fallback image based on product name and category
      validatedProduct.image = getExactProductImage(validatedProduct.title || "", validatedProduct.category || "");
      console.log(`Added fallback image for product: ${validatedProduct.title}`);
    }
    
    // Check if images array is valid
    if (!validatedProduct.images || !Array.isArray(validatedProduct.images) || validatedProduct.images.length === 0) {
      validatedProduct.images = [validatedProduct.image];
      console.log(`Created images array for product: ${validatedProduct.title}`);
    } else {
      // Filter out any null/undefined entries
      validatedProduct.images = validatedProduct.images.filter(img => img && img !== "null" && img !== "undefined");
      
      // If filtering removed all images, use the main image
      if (validatedProduct.images.length === 0) {
        validatedProduct.images = [validatedProduct.image];
        console.log(`Restored images array with main image for product: ${validatedProduct.title}`);
      }
    }
    
    // Normalize price to be a reasonable value
    if (typeof validatedProduct.price === 'number' && validatedProduct.price > 1000) {
      // If price is unreasonably high for common items, adjust it
      const lowerTitle = (validatedProduct.title || "").toLowerCase();
      if (lowerTitle.includes("hat") || lowerTitle.includes("cap") || lowerTitle.includes("padres")) {
        validatedProduct.price = validatedProduct.price / 100;
        console.log(`Adjusted unreasonable price for ${validatedProduct.title}: ${product.price} -> ${validatedProduct.price}`);
      }
    }
    
    // For Padres hat searches, explicitly set the category to ensure proper filtering
    if (query.includes("padres") && (query.includes("hat") || query.includes("cap"))) {
      validatedProduct.category = "Baseball Team Apparel";
    }
    
    return validatedProduct;
  }, []);

  /**
   * Filter out irrelevant products and log statistics
   */
  const filterRelevantProducts = useCallback((
    products: ZincProduct[], 
    query: string,
    maxResults: number
  ): ZincProduct[] => {
    // Filter out irrelevant products
    const filteredResults = products.filter(product => 
      isProductRelevantToSearch(product, query)
    );
    
    console.log(`Filtered from ${products.length} to ${filteredResults.length} relevant results`);
    
    // Return limited number of results
    return filteredResults.slice(0, maxResults);
  }, []);

  /**
   * Validate a batch of products
   */
  const validateProducts = useCallback((
    products: ZincProduct[],
    query: string,
    maxResults: number
  ): ZincProduct[] => {
    if (!products || products.length === 0) {
      return [];
    }

    // First validate each product's images and metadata
    const validatedProducts = products.map(product => validateProductImages(product, query));
    
    // Then filter out irrelevant products
    return filterRelevantProducts(validatedProducts, query, maxResults);
  }, [validateProductImages, filterRelevantProducts]);

  return {
    validateProductImages,
    filterRelevantProducts,
    validateProducts
  };
};
