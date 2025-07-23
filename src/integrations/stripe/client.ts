
/*
 * ========================================================================
 * DEPRECATED STRIPE CLIENT - USE StripeClientManager INSTEAD
 * ========================================================================
 * 
 * This file is kept for backward compatibility during Week 5 migration.
 * All new code should use StripeClientManager from UnifiedPaymentService.
 * 
 * MIGRATION PATH:
 * - Week 5: Components updated to use stripeClientManager
 * - Future: This file will be removed
 * ========================================================================
 */

import { stripeClientManager } from '@/services/payment/StripeClientManager';
import { supabase } from "@/integrations/supabase/client";

// Export for backward compatibility - NEW CODE: Use stripeClientManager.getStripePromise() instead
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
