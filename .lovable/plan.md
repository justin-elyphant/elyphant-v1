
What I found

- This order is not delivered. In the database it is still `shipped`, `fulfilled_at` is `null`, and the current `estimated_delivery` is Apr 8, 2026.
- The timeline is misleading because `OrderTimeline.tsx` always renders a Delivered row with success-style copy, even when that step is only upcoming.
- The missing beta credit is a legacy-order data issue: this order has a linked `beta_credits` transaction for `-25`, but `orders.line_items` does not contain `beta_credits_applied`, so the existing summary components never show the row.
- This order also has an old total-format issue: `total_amount` still equals the gross pre-credit total ($37.92), so older beta-credit orders need a compatibility calculation, not just a missing line item.

Plan

1. Fix the timeline wording and state
- Update `OrderTimeline` so upcoming steps look clearly upcoming: muted title/description, no “Package delivered successfully” copy, and no delivery timestamp unless the order is actually delivered.
- Pass `estimated_delivery` and `fulfilled_at` from `OrderDetail` into the timeline.
- For shipped orders, show the final step as an estimated delivery milestone instead of implying completion.

2. Add a fallback source for older beta-credit orders
- In order hydration, load/derive the applied beta credit from the linked `beta_credits` “spent” record when `line_items.beta_credits_applied` is missing.
- Extend `getOrderPricingBreakdown` to use that fallback so the current desktop/mobile summary UIs start rendering the credit row without redesigning those components.

3. Normalize displayed totals for legacy beta-credit orders
- If an order has an applied beta credit and its stored `total_amount` still matches the gross component sum, compute the displayed total as gross minus credit.
- Keep that logic guarded so newer orders that already store the net total are not double-discounted.

4. Keep email receipts consistent
- Apply the same beta-credit fallback and total normalization in `ecommerce-email-orchestrator`, so re-sent receipts match the fixed order page for older orders.

Files to update

- `src/pages/OrderDetail.tsx`
- `src/components/orders/OrderTimeline.tsx`
- `src/utils/orderPricingUtils.ts`
- `supabase/functions/ecommerce-email-orchestrator/index.ts`

Technical details

- I would keep `computeOrderSteps` as the canonical step-status source and fix the timeline presentation layer to match the existing progress-stepper behavior.
- The beta-credit row already exists in the order summary components; the missing piece is reliable legacy data hydration.
- Optional cleanup after this fix: add a one-time backfill so historical orders also persist `line_items.beta_credits_applied`, but the fallback above will fix this order immediately once implemented.
