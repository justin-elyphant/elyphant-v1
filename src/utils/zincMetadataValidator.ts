/**
 * ========================================================================
 * ZINC METADATA VALIDATOR - PROTECTIVE MONITORING
 * ========================================================================
 * 
 * Validates and monitors Zinc product metadata throughout the pipeline
 * to prevent metadata loss that causes ZMA fulfillment failures
 * 
 * Phase 5 Implementation - Protective Monitoring
 * ========================================================================
 */

import { Product } from "@/types/product";
import { CartItem } from "@/contexts/CartContext";

export interface ZincMetadataValidation {
  isValid: boolean;
  hasProductSource: boolean;
  hasZincFlag: boolean;
  hasRetailer: boolean;
  hasVendor: boolean;
  issues: string[];
  recommendations: string[];
}

/**
 * Validate Zinc metadata for a single product
 */
export function validateZincMetadata(product: Product): ZincMetadataValidation {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  const hasProductSource = product.productSource === 'zinc_api';
  const hasZincFlag = product.isZincApiProduct === true;
  const hasRetailer = product.retailer === 'Amazon';
  const hasVendor = product.vendor === 'Amazon' || product.vendor === 'Amazon via Zinc';
  
  // Check primary indicators
  if (!hasProductSource) {
    issues.push('Missing productSource=zinc_api');
    recommendations.push('Set productSource to "zinc_api" in product converter');
  }
  
  if (!hasZincFlag) {
    issues.push('Missing isZincApiProduct=true');
    recommendations.push('Set isZincApiProduct to true in product converter');
  }
  
  // Check secondary indicators
  if (!hasRetailer && !hasVendor) {
    issues.push('Missing Amazon retailer/vendor identification');
    recommendations.push('Set retailer="Amazon" or vendor="Amazon via Zinc"');
  }
  
  const isValid = hasProductSource && hasZincFlag && (hasRetailer || hasVendor);
  
  return {
    isValid,
    hasProductSource,
    hasZincFlag,
    hasRetailer,
    hasVendor,
    issues,
    recommendations
  };
}

/**
 * Validate Zinc metadata for cart items
 */
export function validateCartZincMetadata(cartItems: CartItem[]): {
  validItems: CartItem[];
  invalidItems: CartItem[];
  totalIssues: number;
  summary: string;
} {
  const validItems: CartItem[] = [];
  const invalidItems: CartItem[] = [];
  let totalIssues = 0;
  
  cartItems.forEach(item => {
    const validation = validateZincMetadata(item.product);
    
    if (validation.isValid) {
      validItems.push(item);
    } else {
      invalidItems.push(item);
      totalIssues += validation.issues.length;
      
      console.warn(`[ZINC METADATA] Product ${item.product.product_id} has invalid metadata:`, {
        issues: validation.issues,
        recommendations: validation.recommendations,
        currentMetadata: {
          productSource: item.product.productSource,
          isZincApiProduct: item.product.isZincApiProduct,
          retailer: item.product.retailer,
          vendor: item.product.vendor
        }
      });
    }
  });
  
  const summary = `${validItems.length}/${cartItems.length} items valid, ${totalIssues} total issues`;
  
  return {
    validItems,
    invalidItems,
    totalIssues,
    summary
  };
}

/**
 * Log comprehensive metadata for debugging
 */
export function logZincMetadataDebug(products: Product[], context: string): void {
  console.group(`[ZINC METADATA DEBUG] ${context}`);
  
  products.forEach(product => {
    const validation = validateZincMetadata(product);
    
    console.log(`Product: ${product.title} (${product.product_id})`, {
      validation: validation.isValid ? '✅ VALID' : '❌ INVALID',
      metadata: {
        productSource: product.productSource,
        isZincApiProduct: product.isZincApiProduct,
        retailer: product.retailer,
        vendor: product.vendor
      },
      issues: validation.issues,
      recommendations: validation.recommendations
    });
  });
  
  console.groupEnd();
}

/**
 * Check if a product will be detected as Zinc in checkout
 */
export function willBeDetectedAsZinc(product: Product): boolean {
  // Mirror the detection logic from UnifiedCheckoutForm
  return (
    product.productSource === 'zinc_api' ||
    product.isZincApiProduct === true ||
    product.retailer === 'Amazon' ||
    product.vendor === 'Amazon' ||
    product.vendor === 'Amazon via Zinc' ||
    (product.retailer && product.retailer.toLowerCase().includes('amazon')) ||
    (product.vendor && (product.vendor.toLowerCase().includes('amazon') || product.vendor.toLowerCase().includes('zinc')))
  );
}

/**
 * Audit the entire pipeline for metadata preservation
 */
export function auditZincMetadataPipeline(
  searchResults: Product[],
  cartItems: CartItem[],
  context: string = 'Pipeline Audit'
): void {
  console.group(`[ZINC PIPELINE AUDIT] ${context}`);
  
  // Audit search results
  if (searchResults.length > 0) {
    console.log('🔍 Search Results Audit:');
    logZincMetadataDebug(searchResults, 'Search Results');
  }
  
  // Audit cart items
  if (cartItems.length > 0) {
    console.log('🛒 Cart Items Audit:');
    const cartValidation = validateCartZincMetadata(cartItems);
    console.log('Cart Validation Summary:', cartValidation.summary);
    
    if (cartValidation.invalidItems.length > 0) {
      console.warn('⚠️ INVALID CART ITEMS DETECTED:', 
        cartValidation.invalidItems.map(item => item.product.product_id)
      );
    }
  }
  
  console.groupEnd();
}