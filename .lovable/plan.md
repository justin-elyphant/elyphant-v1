

## Fix: Beta Credit Not Reflected in Mobile Sticky Total

### Problem

The sticky bottom "Pay Now" bar on mobile (line 893 of `UnifiedCheckoutForm.tsx`) displays `totalAmount` — the pre-credit total. The `CheckoutOrderSummary` component independently calculates the credit-adjusted total using `useBetaCredits()`, but that adjusted value never flows back to the parent form.

The bottom bar shows **$25.79** while the order summary card correctly shows **$0.79**.

### Stripe → Zinc Pipeline Status

**Confirmed working correctly:**
- `create-checkout-session` edge function independently fetches beta credit balance, calculates `adjustedTotal`, and charges Stripe only the reduced amount
- `beta_credits_applied` is stored in Stripe session metadata
- `stripe-webhook-v2` reads `beta_credits_applied` from metadata and deducts credits from the user's balance
- `process-order-v2` uses `line_items.subtotal` (product cost) for Zinc's `max_price` — unaffected by credits
- No changes needed on the backend

### Fix

**`src/components/checkout/UnifiedCheckoutForm.tsx`**

1. Import `useBetaCredits` hook
2. Calculate `appliedCredit` and `adjustedTotal` at the form level (same logic as `CheckoutOrderSummary`)
3. Update the sticky bottom bar (line 893) to display `adjustedTotal` instead of `totalAmount`
4. Update the desktop inline button area to also show the adjusted total if displayed there

```
const { balance: betaCreditBalance } = useBetaCredits();
const BETA_CREDIT_PER_ORDER_CAP = 25;
const appliedCredit = Math.min(betaCreditBalance, totalAmount, BETA_CREDIT_PER_ORDER_CAP);
const adjustedTotal = totalAmount - appliedCredit;
```

Sticky bar change:
```
// Line 893: change from
formatPrice(totalAmount)
// to
formatPrice(adjustedTotal)
```

One file, ~6 lines added/changed. No backend changes needed.

