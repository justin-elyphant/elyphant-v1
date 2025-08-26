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
  
  const imageUrl = product.image_url || product.imageUrl || '';
  const price = Number(product.price) || 0;
  
  // Detect Amazon/Zinc products by image URL patterns
  if (imageUrl.includes('amazon') || 
      imageUrl.includes('ssl-images-amazon') || 
      imageUrl.includes('m.media-amazon')) {
    return 'zinc_api';
  }
  
  // Detect by vendor/retailer info
  if (product.vendor === 'Amazon' || product.retailer === 'Amazon') {
    return 'zinc_api';
  }
  
  if (product.vendor === 'Shopify' || product.retailer === 'Shopify') {
    return 'shopify';
  }
  
  // Detect by price patterns (Amazon products often stored in cents)
  // Prices > $100 that are whole numbers are likely in cents format
  if (price > 100 && price === Math.floor(price)) {
    return 'zinc_api';
  }
  
  // Default to manual for other products
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