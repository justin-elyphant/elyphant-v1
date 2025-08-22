/**
 * ========================================================================
 * ZINC METADATA MONITORING HOOK - REACT INTEGRATION
 * ========================================================================
 * 
 * React hook for monitoring and validating Zinc product metadata
 * throughout the component lifecycle
 * 
 * Phase 5 Implementation - Protective Monitoring (React Integration)
 * ========================================================================
 */

import { useEffect, useCallback } from 'react';
import { Product } from '@/types/product';
import { CartItem } from '@/contexts/CartContext';
import { 
  validateZincMetadata,
  validateCartZincMetadata,
  logZincMetadataDebug,
  auditZincMetadataPipeline,
  willBeDetectedAsZinc
} from '@/utils/zincMetadataValidator';

interface UseZincMetadataMonitoringOptions {
  enableDebugLogging?: boolean;
  enableAuditMode?: boolean;
  logMissingMetadata?: boolean;
}

/**
 * Hook for monitoring Zinc metadata in components
 */
export function useZincMetadataMonitoring(
  products: Product[] = [],
  cartItems: CartItem[] = [],
  options: UseZincMetadataMonitoringOptions = {}
) {
  const {
    enableDebugLogging = process.env.NODE_ENV === 'development',
    enableAuditMode = false,
    logMissingMetadata = true
  } = options;

  /**
   * Validate products and log issues
   */
  const validateProducts = useCallback((products: Product[], context: string) => {
    if (products.length === 0) return { valid: 0, invalid: 0, issues: [] };

    const validProducts: Product[] = [];
    const invalidProducts: Product[] = [];
    const allIssues: string[] = [];

    products.forEach(product => {
      const validation = validateZincMetadata(product);
      
      if (validation.isValid) {
        validProducts.push(product);
      } else {
        invalidProducts.push(product);
        allIssues.push(...validation.issues.map(issue => 
          `${product.product_id}: ${issue}`
        ));
        
        if (logMissingMetadata) {
          console.warn(`[ZINC METADATA] ${context} - Invalid product ${product.product_id}:`, {
            issues: validation.issues,
            recommendations: validation.recommendations
          });
        }
      }
    });

    if (enableDebugLogging && products.length > 0) {
      console.log(`[ZINC METADATA] ${context} validation:`, {
        total: products.length,
        valid: validProducts.length,
        invalid: invalidProducts.length,
        issues: allIssues.length
      });
    }

    return {
      valid: validProducts.length,
      invalid: invalidProducts.length,
      issues: allIssues,
      validProducts,
      invalidProducts
    };
  }, [enableDebugLogging, logMissingMetadata]);

  /**
   * Validate cart items and log issues
   */
  const validateCart = useCallback((cartItems: CartItem[], context: string) => {
    if (cartItems.length === 0) return { valid: 0, invalid: 0, issues: [] };

    const validation = validateCartZincMetadata(cartItems);
    
    if (enableDebugLogging) {
      console.log(`[ZINC METADATA] ${context} cart validation:`, validation.summary);
    }

    if (validation.invalidItems.length > 0 && logMissingMetadata) {
      console.warn(`[ZINC METADATA] ${context} - Cart has invalid items:`, 
        validation.invalidItems.map(item => ({
          product_id: item.product.product_id,
          title: item.product.title,
          metadata: {
            productSource: item.product.productSource,
            isZincApiProduct: item.product.isZincApiProduct,
            retailer: item.product.retailer,
            vendor: item.product.vendor
          }
        }))
      );
    }

    return {
      valid: validation.validItems.length,
      invalid: validation.invalidItems.length,
      issues: validation.totalIssues,
      validItems: validation.validItems,
      invalidItems: validation.invalidItems
    };
  }, [enableDebugLogging, logMissingMetadata]);

  /**
   * Check detection compatibility
   */
  const checkDetectionCompatibility = useCallback((products: Product[], context: string) => {
    const detectionResults = products.map(product => ({
      product_id: product.product_id,
      willBeDetected: willBeDetectedAsZinc(product),
      hasValidMetadata: validateZincMetadata(product).isValid
    }));

    const mismatchedProducts = detectionResults.filter(
      result => result.willBeDetected !== result.hasValidMetadata
    );

    if (mismatchedProducts.length > 0 && enableDebugLogging) {
      console.warn(`[ZINC METADATA] ${context} - Detection/validation mismatch:`, 
        mismatchedProducts
      );
    }

    return {
      totalProducts: products.length,
      willBeDetected: detectionResults.filter(r => r.willBeDetected).length,
      hasValidMetadata: detectionResults.filter(r => r.hasValidMetadata).length,
      mismatches: mismatchedProducts.length
    };
  }, [enableDebugLogging]);

  /**
   * Monitor products when they change
   */
  useEffect(() => {
    if (products.length > 0) {
      const validation = validateProducts(products, 'Products Monitor');
      
      if (enableAuditMode) {
        logZincMetadataDebug(products, 'Products Monitor Audit');
      }
    }
  }, [products, validateProducts, enableAuditMode]);

  /**
   * Monitor cart when it changes
   */
  useEffect(() => {
    if (cartItems.length > 0) {
      const validation = validateCart(cartItems, 'Cart Monitor');
      
      if (enableAuditMode) {
        const cartProducts = cartItems.map(item => item.product);
        auditZincMetadataPipeline([], cartItems, 'Cart Monitor Audit');
      }
    }
  }, [cartItems, validateCart, enableAuditMode]);

  /**
   * Manual validation functions for components
   */
  const manualValidation = {
    validateProducts: (products: Product[], context = 'Manual') => 
      validateProducts(products, context),
    
    validateCart: (cartItems: CartItem[], context = 'Manual') => 
      validateCart(cartItems, context),
    
    checkDetection: (products: Product[], context = 'Manual') =>
      checkDetectionCompatibility(products, context),
    
    auditPipeline: (searchResults: Product[], cartItems: CartItem[], context = 'Manual') =>
      auditZincMetadataPipeline(searchResults, cartItems, context)
  };

  return {
    validateProducts: manualValidation.validateProducts,
    validateCart: manualValidation.validateCart,
    checkDetection: manualValidation.checkDetection,
    auditPipeline: manualValidation.auditPipeline,
    
    // Quick status checks
    hasValidProducts: products.length > 0 && products.every(p => validateZincMetadata(p).isValid),
    hasValidCart: cartItems.length > 0 && validateCartZincMetadata(cartItems).invalidItems.length === 0,
    
    // Utility functions
    willProductBeDetected: (product: Product) => willBeDetectedAsZinc(product),
    isProductValid: (product: Product) => validateZincMetadata(product).isValid
  };
}

/**
 * Simplified hook for component-level validation
 */
export function useZincValidation(products: Product[] = []) {
  return useZincMetadataMonitoring(products, [], {
    enableDebugLogging: false,
    enableAuditMode: false,
    logMissingMetadata: false
  });
}