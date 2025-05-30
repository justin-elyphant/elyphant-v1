
import { Product } from "@/contexts/ProductContext";

/**
 * Format a product price to display as currency
 */
export const formatProductPrice = (price: number): string => {
  if (isNaN(price)) return "0.00";
  return price.toFixed(2);
};

/**
 * Get the base price for a product
 */
export const getBasePrice = (product: Product): number => {
  if (!product) return 0;
  
  // Return the price directly if available
  if (product.price) {
    return product.price;
  }
  
  // Fallback to 0 if no price is found
  return 0;
};

/**
 * Get the product ID, handling different ID field names
 */
export const getProductId = (product: Product): string => {
  if (!product) return "";
  return product.product_id || product.id || "";
};

/**
 * Get the product name, handling different name field names
 */
export const getProductName = (product: Product): string => {
  if (!product) return "";
  return product.title || product.name || "";
};

/**
 * Get the product category, handling different category field names
 */
export const getProductCategory = (product: Product): string => {
  if (!product) return "";
  return product.category || product.category_name || "";
};

/**
 * Get all product images as an array
 */
export const getProductImages = (product: Product): string[] => {
  if (!product) return [];
  
  // If product has an images array, return it
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    return product.images.filter(img => img && typeof img === 'string');
  }
  
  // If product has a single image, return it as an array
  if (product.image && typeof product.image === 'string') {
    return [product.image];
  }
  
  // Fallback to empty array
  return [];
};

/**
 * Standardize a product object to ensure consistent structure
 */
export const standardizeProduct = (product: any): any => {
  if (!product) return {};
  
  return {
    // Required fields with fallbacks
    product_id: product.product_id || product.id || `product-${Math.random().toString(36).substr(2, 9)}`,
    id: product.id || product.product_id || `product-${Math.random().toString(36).substr(2, 9)}`,
    title: product.title || product.name || "Unnamed Product",
    name: product.name || product.title || "Unnamed Product",
    price: parseFloat(product.price) || 19.99,
    image: product.image || "/placeholder.svg",
    
    // Optional fields
    description: product.description || "",
    category: product.category || product.category_name || "General",
    category_name: product.category_name || product.category || "General",
    vendor: product.vendor || product.retailer || "Amazon",
    retailer: product.retailer || product.vendor || "Amazon",
    rating: product.rating || product.stars || 4.5,
    stars: product.stars || product.rating || 4.5,
    reviewCount: product.reviewCount || product.num_reviews || 10,
    num_reviews: product.num_reviews || product.reviewCount || 10,
    
    // Additional fields
    brand: product.brand || "",
    images: Array.isArray(product.images) ? product.images : [product.image || "/placeholder.svg"],
    ...product
  };
};
