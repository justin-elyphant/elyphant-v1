/**
 * Payment Lead Time System - Frontend Constants
 * 
 * Mirrors the edge function configuration for UI display consistency.
 * This system manages the two-stage order processing for scheduled and auto-gift orders.
 * 
 * Flow:
 * 1. Scheduled orders have payment authorized at checkout
 * 2. PAYMENT_CAPTURE_LEAD_DAYS before delivery: payment is captured → status becomes PAYMENT_CONFIRMED
 * 3. On delivery date: order is submitted to Zinc → status becomes 'processing'
 */

export const PAYMENT_LEAD_TIME = {
  /** Days before delivery to capture payment (Stage 1) */
  CAPTURE_LEAD_DAYS: 4,
  
  /** Order status after payment is captured but before Zinc submission */
  PAYMENT_CONFIRMED_STATUS: 'payment_confirmed',
  
  /** Stripe standard payout timeline in business days */
  STRIPE_PAYOUT_DAYS: 2,
  
  /** Days before event to send notification to user */
  NOTIFICATION_LEAD_DAYS: 7,
  
  /** ZMA buffer amount to maintain */
  ZMA_BUFFER_AMOUNT: 500,
} as const;

export type PaymentLeadTimeConfig = typeof PAYMENT_LEAD_TIME;
