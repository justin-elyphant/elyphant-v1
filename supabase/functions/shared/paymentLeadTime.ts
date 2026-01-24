/**
 * Payment Lead Time System
 * 
 * Centralizes the order processing configuration for scheduled and auto-gift orders.
 * 
 * KEY CONCEPT: The `scheduled_delivery_date` stored in orders represents the 
 * desired ARRIVAL date, NOT the Zinc submission date.
 * 
 * Timeline for a Feb 14 arrival:
 * 1. Feb 7 (T-7): Payment captured (CAPTURE_LEAD_DAYS before Zinc submission)
 * 2. Feb 11 (T-3): Order submitted to Zinc (SHIPPING_BUFFER_DAYS before arrival)
 * 3. Feb 14 (T): Gift arrives at recipient
 * 
 * This ensures Stripe payouts (~2 days) arrive before ZMA funds are needed for Zinc.
 */

export const PAYMENT_LEAD_TIME_CONFIG = {
  /** Days before Zinc submission to capture payment (Stage 1) */
  CAPTURE_LEAD_DAYS: 4,
  
  /** Days for Amazon Prime delivery (submit to Zinc this many days before arrival) */
  SHIPPING_BUFFER_DAYS: 3,
  
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
 * Capture = CAPTURE_LEAD_DAYS before Zinc submission
 * Zinc submission = SHIPPING_BUFFER_DAYS before arrival
 * So: Capture = CAPTURE_LEAD_DAYS + SHIPPING_BUFFER_DAYS before arrival
 * @param arrivalDate - The scheduled arrival date
 * @returns Date when payment should be captured
 */
export function getCaptureDate(arrivalDate: Date): Date {
  const captureDate = new Date(arrivalDate);
  const totalLeadDays = PAYMENT_LEAD_TIME_CONFIG.CAPTURE_LEAD_DAYS + 
                        PAYMENT_LEAD_TIME_CONFIG.SHIPPING_BUFFER_DAYS;
  captureDate.setDate(captureDate.getDate() - totalLeadDays);
  return captureDate;
}

/**
 * Checks if an order is ready for payment capture (Stage 1)
 * @param arrivalDate - The scheduled arrival date
 * @param today - Current date (defaults to now)
 * @returns True if payment should be captured
 */
export function isReadyForCapture(arrivalDate: Date, today: Date = new Date()): boolean {
  const captureDate = getCaptureDate(arrivalDate);
  return today >= captureDate;
}

/**
 * Checks if an order is ready for Zinc submission (Stage 2)
 * Submit SHIPPING_BUFFER_DAYS before arrival
 * @param arrivalDate - The scheduled arrival date  
 * @param today - Current date (defaults to now)
 * @returns True if order should be submitted to Zinc
 */
export function isReadyForSubmission(arrivalDate: Date, today: Date = new Date()): boolean {
  const submitDate = new Date(arrivalDate);
  submitDate.setDate(submitDate.getDate() - PAYMENT_LEAD_TIME_CONFIG.SHIPPING_BUFFER_DAYS);
  submitDate.setHours(0, 0, 0, 0);
  const todayOnly = new Date(today);
  todayOnly.setHours(0, 0, 0, 0);
  return todayOnly >= submitDate;
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
