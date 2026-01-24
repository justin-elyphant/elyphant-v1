/**
 * Payment Lead Time System - Frontend Constants
 * 
 * Mirrors the edge function configuration for UI display consistency.
 * 
 * KEY CONCEPT: The scheduled date represents ARRIVAL, not Zinc submission.
 * 
 * Timeline for Feb 14 arrival:
 * 1. Feb 7 (T-7): Payment captured
 * 2. Feb 11 (T-3): Submitted to Zinc
 * 3. Feb 14 (T): Gift arrives
 */

export const PAYMENT_LEAD_TIME = {
  /** Days before Zinc submission to capture payment (Stage 1) */
  CAPTURE_LEAD_DAYS: 4,
  
  /** Days for Amazon Prime delivery (Zinc submission lead) */
  SHIPPING_BUFFER_DAYS: 3,
  
  /** Minimum days user must schedule ahead (CAPTURE + SHIPPING) */
  MIN_SCHEDULING_DAYS: 7,
  
  /** Order status after payment is captured but before Zinc submission */
  PAYMENT_CONFIRMED_STATUS: 'payment_confirmed',
  
  /** Stripe standard payout timeline in business days */
  STRIPE_PAYOUT_DAYS: 2,
  
  /** Days before event to send notification to user */
  NOTIFICATION_LEAD_DAYS: 7,
  
  /** ZMA buffer amount to maintain */
  ZMA_BUFFER_AMOUNT: 500,
  
  /** ZMA low balance warning threshold */
  ZMA_LOW_BALANCE_THRESHOLD: 1000,
  
  /** ZMA critical balance threshold - orders may be blocked */
  ZMA_CRITICAL_THRESHOLD: 500,
  
  /** Initial ZMA float for MVP */
  ZMA_INITIAL_FLOAT: 5000,
  
  /** Day of month for recommended transfer (1st-5th window) */
  MONTHLY_TRANSFER_DAY: 5,
} as const;

export type PaymentLeadTimeConfig = typeof PAYMENT_LEAD_TIME;
