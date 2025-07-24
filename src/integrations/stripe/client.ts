
/*
 * ========================================================================
 * ⚠️  DEPRECATED STRIPE CLIENT - USE StripeClientManager INSTEAD ⚠️
 * ========================================================================
 * 
 * ❌ DEPRECATED: This file is deprecated as of 2025-01-24
 * ✅ USE INSTEAD: StripeClientManager from UnifiedPaymentService
 * 
 * MIGRATION STATUS - Phase 2 Complete:
 * ✅ GroupGiftContributionModal: Updated to use StripeClientManager
 * ✅ All payment forms: Now use centralized Stripe client
 * ✅ Edge functions: Use StripeClientManager consistently
 * 
 * 🔄 MIGRATION PATH FOR REMAINING CODE:
 * - Replace: import { stripePromise } from '@/integrations/stripe/client'
 * - With: import { stripeClientManager } from '@/services/payment/StripeClientManager'
 * - Update: stripePromise → stripeClientManager.getStripePromise()
 * 
 * 📅 SCHEDULED FOR REMOVAL: Phase 4 of UnifiedPaymentService implementation
 * ========================================================================
 */

import { stripeClientManager } from '@/services/payment/StripeClientManager';
import { supabase } from "@/integrations/supabase/client";

// ⚠️  DEPRECATED: Export for backward compatibility only
// ✅ NEW CODE: Use stripeClientManager.getStripePromise() instead
console.warn('DEPRECATED: Using legacy stripePromise. Please migrate to StripeClientManager.');
export const stripePromise = stripeClientManager.getStripePromise();

// Function to create a payment session for autogifting
export const createPaymentSession = async (amount: number, eventId: string) => {
  try {
    const { data } = await supabase.functions.invoke('create-payment-session', {
      body: { 
        amount, 
        eventId,
        paymentType: 'autogift'
      }
    });
    
    return data;
  } catch (error) {
    console.error('Error creating payment session:', error);
    throw error;
  }
};

// Function to create a direct purchase checkout session
export const createCheckoutSession = async (productId: number, price: number, productName: string, productImage?: string) => {
  try {
    const { data } = await supabase.functions.invoke('create-payment-session', {
      body: { 
        amount: price,
        productId,
        productName,
        productImage,
        paymentType: 'direct-purchase'
      }
    });
    
    return data;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};
