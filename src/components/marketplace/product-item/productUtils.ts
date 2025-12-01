
import { Product } from "@/types/product";
import { formatPrice } from "@/lib/utils";

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
 * Format product price using the unified pricing system
 */
export const formatProductPrice = (price: number, product?: any): string => {
  const options = product ? {
    productSource: product.productSource || (product.isZincApiProduct ? 'zinc_api' : undefined),
    skipCentsDetection: product.skipCentsDetection || false
  } : {};
  
  return formatPrice(price, options);
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
  const id = product.product_id || product.id;
  return id ? String(id) : "";
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
 * PHASE 3: Prefer main_image over images[0] per Zinc guidance
 */
export const getProductImages = (product: Product): string[] => {
  if (!product) return [];
  
  const results: string[] = [];
  
  // CRITICAL: Prefer main_image first (per Zinc API guidance)
  if (product.main_image && typeof product.main_image === 'string') {
    results.push(product.main_image);
  }
  
  // Then add additional images from images array
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    const filteredImages = product.images
      .filter(img => img && typeof img === 'string' && img !== product.main_image);
    results.push(...filteredImages);
  }
  
  // Fallback to single image field if nothing else
  if (results.length === 0 && product.image && typeof product.image === 'string') {
    results.push(product.image);
  }
  
  // Return array or empty array
  return results.length > 0 ? results : [];
};

/**
 * Standardize a product object to ensure consistent structure
 */
export const standardizeProduct = (product: any): any => {
  if (!product) return {};
  
    // ENHANCED: Smart price conversion with Zinc metadata preservation
    let normalizedPrice = 19.99;
    if (product.price) {
      const rawPrice = typeof product.price === 'number' ? product.price : parseFloat(product.price);
      
      if (rawPrice > 0) {
        // ENHANCED: More comprehensive Zinc product detection for pricing
        const isZincProduct = 
          product.retailer === 'Amazon' || 
          product.retailer === 'amazon' ||
          product.vendor === 'Amazon' || 
          product.vendor === 'Amazon via Zinc' ||
          product.source === 'zinc' ||
          product.productSource === 'zinc_api' ||
          product.isZincApiProduct === true;
        
        if (isZincProduct && Number.isInteger(rawPrice) && rawPrice >= 100) {
          // Convert from cents to dollars for Zinc API products
          normalizedPrice = rawPrice / 100;
        } else {
          normalizedPrice = rawPrice;
        }
      } else {
        normalizedPrice = 19.99; // fallback
      }
    }
  
  // Process images first to ensure we have them for the image field
  const processedImages = (() => {
    const results: string[] = [];

    const tryPush = (val: any) => {
      if (typeof val === 'string' && val && val !== 'null' && val !== 'undefined') {
        results.push(val);
      }
    };

    // If images array exists, normalize it (can contain strings or objects)
    if (Array.isArray(product.images) && product.images.length > 0) {
      for (const entry of product.images) {
        if (typeof entry === 'string') {
          // Skip known placeholders
          if (entry.includes('placeholder')) continue;
          tryPush(entry);
        } else if (entry && typeof entry === 'object') {
          // Common keys seen from Amazon/Zinc and other feeds
          const objKeys = [
            'hiRes', 'large', 'medium', 'small',
            'image', 'image_url', 'url', 'src', 'link', 'href',
            'main_image', 'thumbnail', 'thumb'
          ];
          for (const k of objKeys) {
            const val = entry[k];
            if (typeof val === 'string' && !val.includes('placeholder')) { tryPush(val); break; }
          }
        }
      }
    }

    // If still empty, use single-image fields (prefer real images over placeholders)
    if (results.length === 0) {
      const singles = [product.main_image, product.image, product.image_url, product.imageUrl];
      for (const s of singles) {
        if (typeof s === 'string' && s && !s.includes('placeholder')) {
          tryPush(s);
        }
      }
    }

    // Final fallback
    return results.length > 0 ? results : ["/placeholder.svg"];
  })();

  return {
    // Spread the original product first
    ...product,
    
    // Then set our standardized fields (these will override the spread)
    // Required fields with fallbacks
    product_id: product.product_id || product.id || `product-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    id: product.id || product.product_id || `product-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: product.title || product.name || "Unnamed Product",
    name: product.name || product.title || "Unnamed Product",
    price: normalizedPrice, // This must come AFTER the spread to override
    image: processedImages[0] || "/placeholder.svg", // Use first image from processed images array
    images: processedImages, // Set the images array
    
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
    brand: product.brand || 
           product.brand_name || 
           product.manufacturer || 
           product.vendor_name ||
           extractBrandFromTitle(product.title || product.name || "") || 
           "",
    
    // NEW: Preserve enhanced Zinc API variation fields
    variant_specifics: product.variant_specifics || undefined,
    all_variants: product.all_variants || undefined,
    main_image: product.main_image || product.image,
    feature_bullets: product.feature_bullets || undefined,
    product_description: product.product_description || product.description,
    categories: product.categories || undefined,
    authors: product.authors || undefined,
    original_retail_price: product.original_retail_price || undefined,
    question_count: product.question_count || undefined,
    asin: product.asin || undefined,
    handmade: product.handmade || undefined,
    digital: product.digital || undefined,
    hasVariations: product.hasVariations || Boolean(product.all_variants && product.all_variants.length > 0),
    
    // CRITICAL: Enhanced Zinc API product identification with multiple detection paths
    isZincApiProduct: (() => {
      const retailerCheck = product.retailer === 'Amazon' || product.retailer === 'amazon';
      const vendorCheck = product.vendor === 'Amazon' || product.vendor === 'Amazon via Zinc';
      const sourceCheck = product.source === 'zinc' || product.productSource === 'zinc_api';
      const existingCheck = product.isZincApiProduct === true;
      return retailerCheck || vendorCheck || sourceCheck || existingCheck;
    })(),
    productSource: (() => {
      // Preserve existing productSource if valid
      if (product.productSource && ['zinc_api', 'shopify', 'vendor_portal', 'manual'].includes(product.productSource)) {
        return product.productSource;
      }
      
      // Detect source from multiple indicators
      if (product.retailer === 'Amazon' || product.retailer === 'amazon' || 
          product.vendor === 'Amazon' || product.vendor === 'Amazon via Zinc' ||
          product.source === 'zinc' || product.isZincApiProduct === true) {
        return 'zinc_api';
      } else if (product.retailer === 'Shopify' || product.vendor === 'Shopify') {
        return 'shopify';
      } else if (product.fromVendor || product.vendorId) {
        return 'vendor_portal';
      } else {
        return 'manual';
      }
    })()
  };
};
