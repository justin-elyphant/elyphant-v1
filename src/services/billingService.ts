/**
 * Billing Service - Handles billing information capture and management
 * 
 * This service extracts billing information from Stripe payment methods
 * and formats it for order creation and Zinc API integration.
 */

import { PaymentMethod } from '@stripe/stripe-js';

export interface BillingInfo {
  cardholderName: string;
  billingAddress?: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

/**
 * Extracts billing information from a Stripe PaymentMethod
 */
export const extractBillingInfoFromPaymentMethod = (paymentMethod: PaymentMethod): BillingInfo => {
  const billing = paymentMethod.billing_details;
  
  // Get cardholder name from payment method
  const cardholderName = billing?.name || 'Card Holder';
  
  // Extract billing address if available
  let billingAddress = undefined;
  if (billing?.address) {
    billingAddress = {
      name: cardholderName,
      address: billing.address.line1 || '',
      city: billing.address.city || '',
      state: billing.address.state || '',
      zipCode: billing.address.postal_code || '',
      country: billing.address.country || 'US'
    };
  }
  
  return {
    cardholderName,
    billingAddress
  };
};

/**
 * Creates billing info from manual input (for cases where Stripe doesn't provide complete info)
 */
export const createBillingInfo = (cardholderName: string, billingAddress?: {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
}): BillingInfo => {
  return {
    cardholderName,
    billingAddress: billingAddress ? {
      name: cardholderName,
      address: billingAddress.address,
      city: billingAddress.city,
      state: billingAddress.state,
      zipCode: billingAddress.zipCode,
      country: billingAddress.country || 'US'
    } : undefined
  };
};