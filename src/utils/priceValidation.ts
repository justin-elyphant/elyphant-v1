/**
 * Comprehensive price validation and standardization utilities
 * Ensures consistent price handling across the entire application
 */

import { formatPrice, validateAndNormalizePrice } from "@/lib/utils";

export interface PriceValidationResult {
  isValid: boolean;
  normalizedPrice: number | null;
  originalValue: any;
  errors: string[];
  warnings: string[];
  source?: string;
}

/**
 * Comprehensive price validation with detailed reporting
 */
export function validatePriceData(
  priceData: any, 
  source: string = 'unknown'
): PriceValidationResult {
  const result: PriceValidationResult = {
    isValid: false,
    normalizedPrice: null,
    originalValue: priceData,
    errors: [],
    warnings: [],
    source
  };

  // Check for null/undefined
  if (priceData === null || priceData === undefined) {
    result.errors.push('Price data is null or undefined');
    return result;
  }

  // Convert to number
  const numPrice = Number(priceData);
  if (isNaN(numPrice)) {
    result.errors.push(`Cannot convert "${priceData}" to number`);
    return result;
  }

  // Check for negative prices
  if (numPrice < 0) {
    result.errors.push(`Negative price not allowed: ${numPrice}`);
    return result;
  }

  // Check for unreasonably high prices (might indicate cents instead of dollars)
  if (numPrice > 100000) {
    result.warnings.push(`Very high price detected: ${numPrice}. May need conversion.`);
  }

  // Normalize the price
  result.normalizedPrice = validateAndNormalizePrice(priceData);
  result.isValid = result.normalizedPrice !== null;

  // Additional validation warnings
  if (result.normalizedPrice && result.normalizedPrice > 10000) {
    result.warnings.push('Price above $10,000 detected');
  }

  if (result.normalizedPrice && result.normalizedPrice < 0.01) {
    result.warnings.push('Price below $0.01 detected');
  }

  return result;
}

/**
 * Validates an array of products for price consistency
 */
export function validateProductPrices(products: any[]): {
  validProducts: any[];
  invalidProducts: any[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
    warnings: number;
  };
} {
  const validProducts: any[] = [];
  const invalidProducts: any[] = [];
  let totalWarnings = 0;

  products.forEach(product => {
    const priceValidation = validatePriceData(product.price || product.product?.price, 'product');
    
    if (priceValidation.isValid) {
      validProducts.push({
        ...product,
        price: priceValidation.normalizedPrice,
        priceValidation
      });
    } else {
      invalidProducts.push({
        ...product,
        priceValidation
      });
    }

    totalWarnings += priceValidation.warnings.length;
  });

  return {
    validProducts,
    invalidProducts,
    summary: {
      total: products.length,
      valid: validProducts.length,
      invalid: invalidProducts.length,
      warnings: totalWarnings
    }
  };
}

/**
 * Safe price formatter that handles validation internally
 */
export function safeFormatPrice(
  price: any, 
  source: string = 'unknown',
  fallback: string = "Price not available"
): string {
  const validation = validatePriceData(price, source);
  
  if (!validation.isValid) {
    console.warn(`[Price Validation] ${source}:`, validation.errors.join(', '));
    return fallback;
  }

  if (validation.warnings.length > 0) {
    console.info(`[Price Validation] ${source} warnings:`, validation.warnings.join(', '));
  }

  return formatPrice(validation.normalizedPrice);
}

/**
 * Development utility to scan components for price inconsistencies
 */
export function createPriceConsistencyChecker() {
  if (process.env.NODE_ENV !== 'development') {
    return () => {};
  }

  return function checkPriceConsistency(componentName: string, priceData: any) {
    const validation = validatePriceData(priceData, componentName);
    
    if (!validation.isValid || validation.warnings.length > 0) {
      console.group(`[Price Consistency] ${componentName}`);
      console.log('Original value:', validation.originalValue);
      console.log('Errors:', validation.errors);
      console.log('Warnings:', validation.warnings);
      console.log('Normalized:', validation.normalizedPrice);
      console.groupEnd();
    }
  };
}