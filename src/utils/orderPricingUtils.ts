/**
 * Order pricing utilities for handling legacy orders and pricing calculations
 */



export interface OrderPricingBreakdown {
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  gifting_fee: number;
  gifting_fee_name: string;
  gifting_fee_description: string;
  beta_credits_applied: number;
  total: number;
}

/**
 * Get complete pricing breakdown for an order, with backward compatibility for legacy orders
 * @param order - The order object
 * @param legacyBetaCredit - Optional fallback beta credit amount from beta_credits table
 */
export const getOrderPricingBreakdown = (order: any, legacyBetaCredit?: number): OrderPricingBreakdown => {
  // Extract pricing from line_items JSONB if available
  const lineItems = order.line_items || {};
  
  // Values in line_items JSONB are stored in DOLLARS (not cents)
  // New format: { items: [...], subtotal: 26.97, shipping: 6.99, tax: 2.36, gifting_fee: 3.70 }
  // Legacy format: just an array of items
  const shippingFromLineItems = lineItems.shipping ?? null;
  const taxFromLineItems = lineItems.tax ?? null;
  const subtotalFromLineItems = lineItems.subtotal ?? null;
  const giftingFeeFromLineItems = lineItems.gifting_fee ?? null;
  const betaCreditsFromLineItems = lineItems.beta_credits_applied ?? null;
  
  // Use line_items value first, then fallback to legacy beta_credits table lookup
  const betaCreditsApplied = betaCreditsFromLineItems ?? legacyBetaCredit ?? 0;
  
  // Helper: compute displayed total accounting for beta credits
  // Legacy orders store total_amount as the gross (pre-credit) amount
  const computeDisplayTotal = (grossTotal: number, credits: number): number => {
    return credits > 0 ? Math.max(0, grossTotal - credits) : grossTotal;
  };

  // For new orders with complete pricing data from line_items JSONB
  if (subtotalFromLineItems !== null && giftingFeeFromLineItems !== null) {
    const grossTotal = order.total || order.total_amount;
    // If beta_credits_applied was already in line_items, the stored total is likely already net
    // Only adjust if we're using the fallback (legacy credit)
    const displayTotal = betaCreditsFromLineItems !== null 
      ? grossTotal 
      : computeDisplayTotal(grossTotal, betaCreditsApplied);
    return {
      subtotal: subtotalFromLineItems,
      shipping_cost: shippingFromLineItems || 0,
      tax_amount: taxFromLineItems || 0,
      gifting_fee: giftingFeeFromLineItems,
      gifting_fee_name: 'Elyphant Gifting Fee',
      gifting_fee_description: 'Platform service fee',
      beta_credits_applied: betaCreditsApplied,
      total: displayTotal
    };
  }
  
  // For orders with explicit columns (legacy format)
  if (order.subtotal !== undefined && order.gifting_fee !== undefined) {
    const grossTotal = order.total || order.total_amount;
    return {
      subtotal: order.subtotal,
      shipping_cost: order.shipping_cost || shippingFromLineItems || 0,
      tax_amount: order.tax_amount || taxFromLineItems || 0,
      gifting_fee: order.gifting_fee,
      gifting_fee_name: order.gifting_fee_name || 'Elyphant Gifting Fee',
      gifting_fee_description: order.gifting_fee_description || 'Platform service fee',
      beta_credits_applied: betaCreditsApplied,
      total: computeDisplayTotal(grossTotal, betaCreditsApplied)
    };
  }

  // Legacy order handling - calculate missing values
  const total = order.total || order.total_amount || 0;
  const shippingCost = order.shipping_cost || shippingFromLineItems || 0;
  const taxAmount = order.tax_amount || taxFromLineItems || 0;
  
  // For legacy orders, estimate the original subtotal and gifting fee
  const subtotalPlusGiftingFee = total - shippingCost - taxAmount;
  const estimatedSubtotal = subtotalPlusGiftingFee / 1.15;
  const estimatedGiftingFee = estimatedSubtotal * 0.15;

  return {
    subtotal: Math.max(0, estimatedSubtotal),
    shipping_cost: shippingCost,
    tax_amount: taxAmount,
    gifting_fee: Math.max(0, estimatedGiftingFee),
    gifting_fee_name: 'Elyphant Gifting Fee',
    gifting_fee_description: 'Platform service fee for streamlined delivery and customer support',
    beta_credits_applied: betaCreditsApplied,
    total: computeDisplayTotal(total, betaCreditsApplied)
  };
};

/**
 * Calculate dynamic pricing breakdown using current pricing settings
 * Used for real-time calculations in checkout
 */
export const calculateDynamicPricingBreakdown = (
  basePrice: number, 
  shippingCost: number = 0
) => {
  // Combined fee: 10% markup + $1.00 Zinc fulfillment fee
  const markupPercentage = 0.10; // 10% default
  const zincFee = 1.00; // $1.00 Zinc per-order fulfillment fee
  const giftingFee = (basePrice * markupPercentage) + zincFee;
  const taxAmount = 0; // Currently no tax in checkout
  
  return {
    basePrice,
    shippingCost,
    giftingFee,
    giftingFeeName: 'Elyphant Gifting Fee',
    giftingFeeDescription: 'Our Gifting Fee covers platform technology, fulfillment services, customer support, gift tracking, and curated shopping experience',
    grandTotal: basePrice + shippingCost + giftingFee + taxAmount
  };
};