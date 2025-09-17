/**
 * Utility functions for order-related operations
 */

/**
 * Formats an order ID to a short, user-friendly format
 * Always returns the last 6 characters for consistency
 */
export const formatOrderNumber = (orderId: string): string => {
  if (!orderId) return '';
  return orderId.slice(-6);
};

/**
 * Formats an order ID with a # prefix for display
 */
export const formatOrderNumberWithHash = (orderId: string): string => {
  return `#${formatOrderNumber(orderId)}`;
};