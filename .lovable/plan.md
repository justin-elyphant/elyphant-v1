

## Fix Beta Credit Display and Order Timeline Mismatch

### Problem 1: Beta Credit Missing from Order Summary and Emails

Beta credits ARE deducted during checkout (stored in Stripe session metadata as `beta_credits_applied` and deducted via `beta_credits` table). However, they are **never stored on the order itself** (not in `line_items` JSONB or any column), so:

- The order detail page has no way to show "Beta Credit: -$25.00" in the pricing breakdown
- The email orchestrator doesn't pass `beta_credits_applied` to templates
- The `renderPricingBreakdown` helper has no beta credit row

**Fix (3 locations):**

1. **`supabase/functions/stripe-webhook-v2/index.ts`** — When building the `line_items` JSONB (line ~583-588), add `beta_credits_applied` from session metadata so the value persists on the order record

2. **`src/utils/orderPricingUtils.ts`** — Add `beta_credits_applied` to `OrderPricingBreakdown` interface and extract it from `line_items.beta_credits_applied`

3. **`src/components/orders/EnhancedOrderItemsTable.tsx`** and **`src/components/orders/mobile/MobileOrderItemsList.tsx`** — Add a "Beta Credit" line item (green, negative) between Gifting Fee and Total when `beta_credits_applied > 0`

4. **`supabase/functions/ecommerce-email-orchestrator/index.ts`** — Two changes:
   - In the order data hydration block (~line 1784), add `beta_credits_applied: lineItems_raw?.beta_credits_applied || 0`
   - In `renderPricingBreakdown`, add a conditional row for beta credits (styled green, negative amount) before the Total row

### Problem 2: Order Timeline Shows "Delivered" for Shipped Orders

The `OrderTimeline` component generates estimated timestamps for ALL 4 steps (including future ones) using hardcoded offsets from the order date. For a "shipped" order, the timeline renders a "Delivered" entry with a fake date (order date + 3 days), even though the order hasn't been delivered.

**Root cause:** Lines 54-66 in `OrderTimeline.tsx` — the `estimatedOffsets` object creates timestamps for ALL steps, even "upcoming" ones. The timeline then renders every step with a date, making undelivered orders appear delivered.

**Fix in `src/components/orders/OrderTimeline.tsx`:**
- Only display a timestamp for steps that are "completed" or "active" — skip rendering dates for "upcoming" steps
- This way, "Delivered" still appears in the timeline as a future milestone, but without a misleading date

### Files Modified
- **`supabase/functions/stripe-webhook-v2/index.ts`** — Store `beta_credits_applied` in `line_items` JSONB
- **`src/utils/orderPricingUtils.ts`** — Add `beta_credits_applied` to pricing breakdown
- **`src/components/orders/EnhancedOrderItemsTable.tsx`** — Beta credit row in pricing
- **`src/components/orders/mobile/MobileOrderItemsList.tsx`** — Beta credit row in pricing (mobile)
- **`supabase/functions/ecommerce-email-orchestrator/index.ts`** — Beta credit in email data + pricing template
- **`src/components/orders/OrderTimeline.tsx`** — Don't show dates for upcoming steps

### What Stays Unchanged
- `computeOrderSteps` in `orderTrackingUtils.ts` — step status logic is correct
- `OrderProgressStepper` — already works correctly (only highlights active step)
- Checkout flow — beta credit deduction logic is fine
- `OrderSummaryCard` — shows total only, no breakdown needed there

