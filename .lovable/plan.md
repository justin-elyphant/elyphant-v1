

## Fix: Beta Credit Not Applied to Stripe Checkout Session Amount

### Problem

The `create-checkout-session` edge function correctly calculates `adjustedTotal` (line 225) and stores `beta_credits_applied` in metadata (line 428). However, in **standard Checkout Session mode** (line 569-572), Stripe receives `lineItems` built from product + shipping + gifting fee — the beta credit is never subtracted.

Result: Stripe shows **$62.92** instead of **$37.92**. The credit metadata is stored but the actual charge amount is wrong.

The Apple Pay / Payment Intent path (line 476) uses `amountInCents` correctly, so it's only the redirect-based Checkout Session that's broken.

### Root Cause

Line 572: `sessionParams.line_items = lineItems` — these line items sum to the full pre-credit total. No discount line item is added for beta credits.

### Fix

**`supabase/functions/create-checkout-session/index.ts`**

After the existing gifting fee and tax line items are added (after line 391), add a conditional **discount line item** when `betaCreditsApplied > 0`:

```typescript
// Add beta credit discount as a negative-price line item
if (betaCreditsApplied > 0) {
  lineItems.push({
    price_data: {
      currency: 'usd',
      product_data: {
        name: 'Beta Credit',
        description: 'Beta tester credit applied to this order',
      },
      unit_amount: -Math.round(betaCreditsApplied * 100), // Negative amount
    },
    quantity: 1,
  });
}
```

**Important caveat**: Stripe Checkout Sessions do **not** support negative `unit_amount` values in line items. Instead, the correct approach is to use a **Stripe Coupon / Discount**:

```typescript
if (betaCreditsApplied > 0) {
  const coupon = await stripe.coupons.create({
    amount_off: Math.round(betaCreditsApplied * 100),
    currency: 'usd',
    duration: 'once',
    name: 'Beta Credit',
  });
  sessionParams.discounts = [{ coupon: coupon.id }];
}
```

This creates a one-time Stripe coupon for the exact credit amount and attaches it to the session. Stripe will display "Beta Credit -$25.00" in the checkout UI and charge only the adjusted total.

### Files Changed

1. **`supabase/functions/create-checkout-session/index.ts`** — Add coupon creation + discount attachment (~8 lines, after line 391 and before session creation at line 515)

### What This Fixes

- Stripe Checkout page will show the correct discounted total ($37.92 instead of $62.92)
- The coupon approach is Stripe's official pattern for order-level discounts
- No changes needed to webhook handler (already reads `beta_credits_applied` from metadata)
- No changes needed to Buy Now drawer or checkout form (display is already correct)

