/**
 * Utility functions for extracting variation options from product data
 * for use in filters and product selection
 */

import { Product } from "@/types/product";

export interface VariationOptions {
  [dimensionType: string]: string[];
}

/**
 * Extract all available variation options from a list of products
 * This creates filter options like Size: [S, M, L, XL] and Color: [Red, Blue, Green]
 */
export function extractVariationOptions(products: Product[]): VariationOptions {
  const variations: VariationOptions = {};
  
  products.forEach(product => {
    if (!product.all_variants || !Array.isArray(product.all_variants)) return;
    
    product.all_variants.forEach(variant => {
      if (!variant.variant_specifics || !Array.isArray(variant.variant_specifics)) return;
      
      variant.variant_specifics.forEach(spec => {
        const dimension = spec.dimension;
        const value = spec.value;
        
        if (!dimension || !value) return;
        
        if (!variations[dimension]) {
          variations[dimension] = [];
        }
        
        if (!variations[dimension].includes(value)) {
          variations[dimension].push(value);
        }
      });
    });
  });
  
  // Sort each dimension's options for consistent display
  Object.keys(variations).forEach(dimension => {
    variations[dimension].sort();
  });
  
  console.log('[variationExtraction] Extracted variations:', variations);
  
  return variations;
}

/**
 * Check if a product matches the selected variation filters
 */
export function productMatchesVariationFilters(
  product: Product, 
  selectedVariations: { [dimension: string]: string[] }
): boolean {
  if (!selectedVariations || Object.keys(selectedVariations).length === 0) {
    return true; // No variation filters applied
  }
  
  if (!product.all_variants || !Array.isArray(product.all_variants)) {
    return true; // Product has no variations, so it can't be filtered by them
  }
  
  // Check if any of the product's variants match the selected filters
  return product.all_variants.some(variant => {
    if (!variant.variant_specifics || !Array.isArray(variant.variant_specifics)) {
      return false;
    }
    
    // Check each selected dimension
    return Object.entries(selectedVariations).every(([dimension, selectedValues]) => {
      if (selectedValues.length === 0) return true; // No filter for this dimension
      
      // Find the variant's value for this dimension
      const variantSpec = variant.variant_specifics.find(spec => spec.dimension === dimension);
      if (!variantSpec) return false; // Variant doesn't have this dimension
      
      // Check if the variant's value is in the selected values
      return selectedValues.includes(variantSpec.value);
    });
  });
}