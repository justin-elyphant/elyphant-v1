/**
 * Product pricing utilities for unified pricing strategy
 * Handles source-aware pricing logic across different product sources
 */

import { formatPrice } from "@/lib/utils";
import { Product } from "@/types/product";

/**
 * Get the pricing options for a product based on its source
 */
export function getProductPricingOptions(product: Product) {
  return {
    productSource: product.productSource || (product.isZincApiProduct ? 'zinc_api' : undefined),
    skipCentsDetection: product.skipCentsDetection || false
  };
}

/**
 * Format a product's price using source-aware logic
 */
export function formatProductPrice(product: Product, price?: number): string {
  const priceToFormat = price ?? product.price;
  const options = getProductPricingOptions(product);
  return formatPrice(priceToFormat, options);
}

/**
 * Determine if a product uses cents-based pricing (typically Zinc API)
 */
export function usesCentsPricing(product: Product): boolean {
  if (product.skipCentsDetection) return false;
  if (product.productSource) {
    return product.productSource === 'zinc_api';
  }
  // Legacy compatibility
  return product.isZincApiProduct || false;
}

/**
 * Standardize product pricing fields for consistent handling
 */
export function standardizeProductPricing(product: any): Partial<Product> {
  const updates: Partial<Product> = {};
  
  // Detect product source if not explicitly set
  if (!product.productSource) {
    if (product.isZincApiProduct || product.vendor === 'Amazon') {
      updates.productSource = 'zinc_api';
    } else if (product.retailer === 'Shopify' || product.vendor === 'Shopify') {
      updates.productSource = 'shopify';
    } else if (product.fromVendor || product.vendorId) {
      updates.productSource = 'vendor_portal';
    } else {
      updates.productSource = 'manual';
    }
  }
  
  return updates;
}