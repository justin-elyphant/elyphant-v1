/**
 * Order utilities for handling different line_items storage formats
 * 
 * The orders table stores line_items in two formats:
 * 1. Legacy: Direct array of items []
 * 2. Current: Object wrapper { items: [], subtotal, shipping, tax, gifting_fee }
 * 
 * These utilities safely extract data from either format.
 */

/**
 * Safely extracts the line items array from an order's line_items field.
 * Handles both legacy array format and current object wrapper format.
 */
export function getOrderLineItems(order: any): any[] {
  if (!order) return [];
  
  const lineItems = order.line_items;
  
  // Already an array (legacy format)
  if (Array.isArray(lineItems)) {
    return lineItems;
  }
  
  // Object wrapper format (current format from stripe-webhook-v2)
  if (lineItems && typeof lineItems === 'object' && Array.isArray(lineItems.items)) {
    return lineItems.items;
  }
  
  // JSON string (edge case from some DB drivers)
  if (typeof lineItems === 'string') {
    try {
      const parsed = JSON.parse(lineItems);
      return getOrderLineItems({ line_items: parsed });
    } catch {
      return [];
    }
  }
  
  // Single object - wrap in array
  if (lineItems && typeof lineItems === 'object') {
    return [lineItems];
  }
  
  return [];
}

/**
 * Extracts pricing breakdown from an order's line_items field.
 * Returns values in DOLLARS (not cents).
 */
export function getOrderLineItemsPricing(order: any): {
  subtotal: number;
  shipping: number;
  tax: number;
  giftingFee: number;
  hasStoredPricing: boolean;
} {
  const defaultResult = {
    subtotal: 0,
    shipping: 0,
    tax: 0,
    giftingFee: 0,
    hasStoredPricing: false
  };
  
  if (!order?.line_items) return defaultResult;
  
  const lineItems = order.line_items;
  
  // Object wrapper format with pricing (current format)
  if (typeof lineItems === 'object' && !Array.isArray(lineItems)) {
    // Values are stored in DOLLARS (converted from cents at write time in stripe-webhook-v2)
    const hasPricing = lineItems.subtotal !== undefined || lineItems.shipping !== undefined;
    
    if (hasPricing) {
      return {
        subtotal: lineItems.subtotal || 0,
        shipping: lineItems.shipping || 0,
        tax: lineItems.tax || 0,
        giftingFee: lineItems.gifting_fee || 0,
        hasStoredPricing: true
      };
    }
  }
  
  return defaultResult;
}
