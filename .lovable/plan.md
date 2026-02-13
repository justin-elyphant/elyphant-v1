

## Fix: max_price_exceeded Error in Zinc Order Submission

### Root Cause
In `supabase/functions/process-order-v2/index.ts` (line 299), the `max_price` sent to Zinc is:

```
max_price = Math.ceil(order.total_amount * 100 * 1.30)
```

This uses `order.total_amount` ($14.20 = product + gifting fee) with a 30% buffer. But Amazon adds its own shipping ($6.99) and tax ($1.66) on top of the product price. For inexpensive items, shipping alone can be 50-60% of the product cost, easily blowing past a 30% buffer.

### The Fix

**File:** `supabase/functions/process-order-v2/index.ts` (line 299)

Replace the single-multiplier approach with a hybrid formula that uses the **product subtotal** (from `line_items`) plus a fixed shipping/tax allowance:

```
// Extract product subtotal from line_items (what Amazon actually charges for products)
const productSubtotalCents = (order.line_items?.subtotal || order.total_amount) * 100;

// Hybrid max_price: 20% buffer for price fluctuation/tax + $15 fixed shipping allowance
max_price: Math.ceil(productSubtotalCents * 1.20) + 1500
```

**Why this works for all price ranges:**

| Item Price | Old max_price (1.3x total) | New max_price (1.2x + $15) | Amazon Total (example) |
|---|---|---|---|
| $12.00 | $18.46 (FAIL) | $29.40 | $20.65 |
| $50.00 | $78.00 | $75.00 | $62.00 |
| $200.00 | $286.00 | $255.00 | $230.00 |
| $500.00 | $702.00 | $615.00 | $560.00 |

The fixed $15 buffer handles shipping on cheap items where percentage-only buffers fail, while the 20% multiplier scales naturally for expensive items.

### Deployment
- Edit `process-order-v2/index.ts` line ~295-299
- Deploy the `process-order-v2` edge function
- Retry Order #6387 after deployment

### Order #6387 Recovery
After deploying the fix, the order can be retried. The new max_price for this order would be: `Math.ceil(1200 * 1.20) + 1500 = 2940 cents ($29.40)`, which comfortably covers Amazon's $20.65 total.

