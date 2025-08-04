/*
 * 🛡️ CHECKOUT SYSTEM PROTECTION UTILITIES
 * 
 * This file contains safeguards and validation functions to protect
 * the checkout system from accidental modifications that could break
 * critical payment and pricing functionality.
 */

import { CartItem } from '@/contexts/CartContext';

export interface CheckoutValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

/**
 * Validates that pricing integration is working correctly
 */
export const validatePricingIntegration = (
  giftingFee: number,
  giftingFeeName: string,
  giftingFeeDescription: string,
  subtotal: number
): CheckoutValidationResult => {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Critical: Gifting fee should not be 0 when there's a subtotal
  if (subtotal > 0 && giftingFee === 0) {
    errors.push('Gifting fee is $0.00 - pricing integration may be broken');
  }

  // Warning: Using default values suggests integration issues
  if (giftingFeeName === 'Gifting Fee' && giftingFee > 0) {
    warnings.push('Using default fee name instead of configured pricing settings');
  }

  if (!giftingFeeDescription && giftingFee > 0) {
    warnings.push('Missing fee description from pricing settings');
  }

  // Critical: Fee should be reasonable percentage of subtotal (5-25%)
  if (giftingFee > 0) {
    const feePercentage = (giftingFee / subtotal) * 100;
    if (feePercentage < 5 || feePercentage > 25) {
      warnings.push(`Gifting fee percentage (${feePercentage.toFixed(1)}%) seems unusual`);
    }
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors
  };
};

/**
 * Validates checkout data completeness
 */
export const validateCheckoutData = (
  items: CartItem[],
  subtotal: number,
  totalAmount: number
): CheckoutValidationResult => {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (items.length === 0) {
    errors.push('No items in cart');
  }

  if (subtotal <= 0) {
    errors.push('Invalid subtotal amount');
  }

  if (totalAmount <= subtotal) {
    warnings.push('Total amount seems too low (no fees/taxes added?)');
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors
  };
};

/**
 * Development mode logger for checkout protection
 */
export const logCheckoutValidation = (
  component: string,
  validationResult: CheckoutValidationResult
): void => {
  if (process.env.NODE_ENV !== 'development') return;

  if (validationResult.errors.length > 0) {
    console.error(`🚨 CHECKOUT ERRORS in ${component}:`, validationResult.errors);
  }

  if (validationResult.warnings.length > 0) {
    console.warn(`⚠️ CHECKOUT WARNINGS in ${component}:`, validationResult.warnings);
  }

  if (validationResult.isValid && validationResult.warnings.length === 0) {
    console.log(`✅ CHECKOUT VALIDATION passed for ${component}`);
  }
};