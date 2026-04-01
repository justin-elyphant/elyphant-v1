

## Fix: Beta Credits Not Applied in Buy Now Drawer

### Problem

The Buy Now drawer (`BuyNowDrawer.tsx`) calculates pricing via `calculateDynamicPricingBreakdown` but never imports or applies beta credits. The order summary (lines 492-516) shows the full total without any credit deduction, and the `handlePlaceOrder` function (line 162) also sends the full price to `create-checkout-session`.

The screenshot confirms: Total shows **$62.92** with no credit line item.

### Fix

**`src/components/marketplace/product-details/BuyNowDrawer.tsx`**

1. Import `useBetaCredits` hook
2. Calculate `appliedCredit` and `adjustedTotal` (same pattern as `UnifiedCheckoutForm`)
3. In the order summary section (line 492-516): add a beta credit line item row (e.g., "Beta Credit  -$25.00") and display `adjustedTotal` instead of `breakdown.grandTotal`
4. No backend change needed — `create-checkout-session` already independently calculates credits server-side, so Stripe is charged correctly regardless. This is a **display-only** fix.

```
const { balance: betaCreditBalance } = useBetaCredits();
const BETA_CREDIT_PER_ORDER_CAP = 25;

// In the summary render:
const appliedCredit = Math.min(betaCreditBalance, breakdown.grandTotal, BETA_CREDIT_PER_ORDER_CAP);
const adjustedTotal = breakdown.grandTotal - appliedCredit;
```

Add a conditional row before the total:
```
{appliedCredit > 0 && (
  <div className="flex justify-between text-sm text-green-600">
    <span>Beta Credit</span>
    <span>-${appliedCredit.toFixed(2)}</span>
  </div>
)}
```

Display `adjustedTotal` in the Total row instead of `breakdown.grandTotal`.

One file, ~10 lines added.

