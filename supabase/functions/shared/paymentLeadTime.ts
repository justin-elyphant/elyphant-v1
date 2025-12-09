/**
 * Payment Lead Time System
 * 
 * Centralizes the two-stage order processing configuration for scheduled and auto-gift orders.
 * This system addresses the cash flow timing between Stripe payouts (~2 days) and ZMA funding needs.
 * 
 * Two-Stage Processing Flow:
 * 1. Payment Capture: CAPTURE_LEAD_DAYS before scheduled delivery, payment is captured from customer
 * 2. Zinc Submission: On delivery date, order is submitted to Zinc for fulfillment
 * 
 * This lead time ensures Stripe payouts arrive in the bank before ZMA funds are needed for Zinc.
 */

export const PAYMENT_LEAD_TIME_CONFIG = {
  /** Days before delivery to capture payment (Stage 1) */
  CAPTURE_LEAD_DAYS: 4,
  
  /** Order status after payment is captured but before Zinc submission */
  CAPTURED_STATUS: 'payment_confirmed',
  
  /** Stripe standard payout timeline in business days (for reference) */
  STRIPE_PAYOUT_DAYS: 2,
  
  /** Days before event to send notification to user */
  NOTIFICATION_LEAD_DAYS: 7,
} as const;

export type PaymentLeadTimeConfig = typeof PAYMENT_LEAD_TIME_CONFIG;

/**
 * Calculates the date when payment should be captured
 * @param deliveryDate - The scheduled delivery/event date
 * @returns Date when payment should be captured
 */
export function getCaptureDate(deliveryDate: Date): Date {
  const captureDate = new Date(deliveryDate);
  captureDate.setDate(captureDate.getDate() - PAYMENT_LEAD_TIME_CONFIG.CAPTURE_LEAD_DAYS);
  return captureDate;
}

/**
 * Checks if an order is ready for payment capture (Stage 1)
 * @param deliveryDate - The scheduled delivery date
 * @param today - Current date (defaults to now)
 * @returns True if payment should be captured
 */
export function isReadyForCapture(deliveryDate: Date, today: Date = new Date()): boolean {
  const captureDate = getCaptureDate(deliveryDate);
  return today >= captureDate;
}

/**
 * Checks if an order is ready for Zinc submission (Stage 2)
 * @param deliveryDate - The scheduled delivery date  
 * @param today - Current date (defaults to now)
 * @returns True if order should be submitted to Zinc
 */
export function isReadyForSubmission(deliveryDate: Date, today: Date = new Date()): boolean {
  const deliveryDateOnly = new Date(deliveryDate);
  deliveryDateOnly.setHours(0, 0, 0, 0);
  const todayOnly = new Date(today);
  todayOnly.setHours(0, 0, 0, 0);
  return todayOnly >= deliveryDateOnly;
}

/**
 * Calculates days until a date
 * @param targetDate - The target date
 * @param from - Date to calculate from (defaults to now)
 * @returns Number of days until target date (can be negative if in past)
 */
export function getDaysUntil(targetDate: Date, from: Date = new Date()): number {
  return Math.ceil((targetDate.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}
