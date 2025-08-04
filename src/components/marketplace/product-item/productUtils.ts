
import { Product } from "@/contexts/ProductContext";

/**
 * Extract brand name from product title using common patterns
 */
const extractBrandFromTitle = (title: string): string => {
  if (!title) return "";
  
  // Common brand patterns in product titles
  const brandPatterns = [
    // Look for brand names at the beginning of titles
    /^([A-Z][a-zA-Z0-9&\s]+?)[\s\-]/,
    // Look for brand names in parentheses
    /\(([A-Z][a-zA-Z0-9&\s]+?)\)/,
    // Look for "by [Brand]" patterns
    /by\s+([A-Z][a-zA-Z0-9&\s]+?)[\s\-]/i,
  ];
  
  for (const pattern of brandPatterns) {
    const match = title.match(pattern);
    if (match && match[1] && match[1].length > 1 && match[1].length < 30) {
      return match[1].trim();
    }
  }
  
  return "";
};

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
  
  // Smart price conversion - detect if price is in cents or dollars
  let normalizedPrice = 19.99;
  if (product.price) {
    const rawPrice = typeof product.price === 'number' ? product.price : parseFloat(product.price);
    
    // If price is suspiciously high (likely in cents), convert to dollars
    // Common pattern: 3999 cents = $39.99, but 39.99 dollars should stay as is
    if (rawPrice >= 1000) {
      normalizedPrice = rawPrice / 100;
    } else if (rawPrice > 0) {
      normalizedPrice = rawPrice;
    } else {
      normalizedPrice = 19.99; // fallback
    }
    
  }
  
  return {
    // Spread the original product first
    ...product,
    
    // Then set our standardized fields (these will override the spread)
    // Required fields with fallbacks
    product_id: product.product_id || product.id || `product-${Math.random().toString(36).substr(2, 9)}`,
    id: product.id || product.product_id || `product-${Math.random().toString(36).substr(2, 9)}`,
    title: product.title || product.name || "Unnamed Product",
    name: product.name || product.title || "Unnamed Product",
    price: normalizedPrice, // This must come AFTER the spread to override
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
    
    // Enhanced brand extraction - try multiple possible brand field names
    brand: (() => {
      const extractedBrand = product.brand || 
                           product.brand_name || 
                           product.manufacturer || 
                           product.vendor_name ||
                           extractBrandFromTitle(product.title || product.name || "") || 
                           "";
      if (extractedBrand) {
        console.log(`Brand extracted: "${extractedBrand}" for product: ${product.title || product.name}`);
      }
      return extractedBrand;
    })(),
    images: (() => {
      if (Array.isArray(product.images) && product.images.length > 0) {
        return product.images.filter(img => img && typeof img === 'string');
      }
      return [product.image || "/placeholder.svg"];
    })()
  };
};
