

## Fix: Buy Now Drawer Missing Shipping and Tax

### Problem
The Buy Now drawer calls `calculateDynamicPricingBreakdown(price)` with only the base price, which defaults `shippingCost` to `$0.00`. The `/checkout` page explicitly fetches `$6.99` flat shipping via `getShippingCost()` and passes it into the pricing breakdown. The drawer skips this step entirely, resulting in:
- **$0.00 shipping** instead of $6.99
- **$0.00 tax** (same as /checkout currently, so this is consistent -- but worth noting)
- **Total is $6.99 too low** ($31.79 should have been $38.78)

The pricing display ("Total" row) and the data sent to `create-checkout-session` both use the same broken calculation.

### Root Cause

```text
BuyNowDrawer (line 148):
  calculateDynamicPricingBreakdown(price)
    --> shippingCost defaults to 0

/checkout (UnifiedCheckoutForm):
  getShippingCost() --> returns 6.99
  then passes shippingCost into pricingBreakdown
```

### Fix (1 file, ~5 lines)

**File: `src/components/marketplace/product-details/BuyNowDrawer.tsx`**

1. **Line 148**: Change `calculateDynamicPricingBreakdown(price)` to `calculateDynamicPricingBreakdown(price, 6.99)` so the pricing sent to `create-checkout-session` includes $6.99 shipping.

2. **Line 487** (the Total display): The same `calculateDynamicPricingBreakdown(price)` call renders the displayed total. Change it to `calculateDynamicPricingBreakdown(price, 6.99)` so the shopper sees the correct total before placing the order.

3. **Add a shipping line** to the "Step 4: Total" summary section (around line 484) so the shopper can see the shipping cost broken out, matching the order confirmation email format:
   - Subtotal: $27.99
   - Shipping: $6.99
   - Gifting Fee: $3.80
   - **Total: $38.78**

### Why $6.99 Hardcoded Is OK
The `/checkout` page's `getShippingCost()` function already returns a hardcoded `6.99` (see `useCheckoutState.tsx` line 337). Both paths use the same flat rate. If/when shipping logic becomes dynamic, both should reference the same utility.

### Result
- Orders from the Buy Now drawer will include $6.99 shipping in the Stripe checkout session metadata
- The drawer will display the correct total before the shopper taps "Place your order"
- The order confirmation email will show the correct shipping line item
- Zinc `max_price` will also benefit since the higher `line_items.subtotal` flows downstream

