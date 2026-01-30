/**
 * Product source detection utilities for intelligent pricing
 * Detects product sources to apply correct pricing format
 */

import { formatProductPrice } from '@/utils/productPricing';

/**
 * Product source types supported by the unified pricing system
 */
export type ProductSource = 'zinc_api' | 'shopify' | 'vendor_portal' | 'manual';

/**
 * Detect product source based on product data patterns
 */
export function detectProductSource(product: {
  price?: number;
  image_url?: string;
  imageUrl?: string;
  vendor?: string;
  retailer?: string;
  productSource?: string;
  isZincApiProduct?: boolean;
}): ProductSource {
  // Use explicit product source if available
  if (product.productSource) {
    return product.productSource as ProductSource;
  }
  
  // Legacy compatibility for zinc products
  if (product.isZincApiProduct) {
    return 'zinc_api';
  }
  
  // Detect by vendor/retailer info (explicit labels only)
  if (product.vendor === 'Amazon' || product.retailer === 'Amazon') {
    return 'zinc_api';
  }
  
  if (product.vendor === 'Shopify' || product.retailer === 'Shopify') {
    return 'shopify';
  }
  
  // Default to manual - prices are stored in dollars, no conversion needed
  // REMOVED: Image URL detection and price magnitude heuristics
  // These caused false positives (e.g., $119 knife showing as $1.19)
  return 'manual';
}

/**
 * Format price with intelligent source detection
 */
export function formatPriceWithDetection(product: {
  price?: number;
  image_url?: string;
  imageUrl?: string;
  vendor?: string;
  retailer?: string;
  productSource?: string;
  isZincApiProduct?: boolean;
  skipCentsDetection?: boolean;
}, price?: number): string {
  const productSource = detectProductSource(product);
  const priceToFormat = price ?? (Number(product.price) || 0);
  
  return formatProductPrice({
    price: priceToFormat,
    productSource,
    skipCentsDetection: product.skipCentsDetection
  } as any, priceToFormat);
}

/**
 * Enhance wishlist item with detected product source
 */
export function enhanceWishlistItemWithSource(item: any): any {
  // Use database product_source if available, otherwise detect
  const productSource = item.product_source || detectProductSource(item);
  
  return {
    ...item,
    productSource,
    // Preserve original data for comparison
    _originalPrice: item.price,
    _detectedSource: productSource
  };
}