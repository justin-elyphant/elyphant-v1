

## Email Template Audit: E-Commerce Best Practice Gaps

### Issues Found From Your Screenshots

**Screenshot 1 -- "Order Shipped" email:**
- Missing product images and item list (just order number + raw ISO date)
- Estimated delivery shows raw `2026-02-16T00:00:00` instead of formatted "Monday, February 16, 2026"
- Missing shipping address
- No personalization with first name (uses full name inconsistently)

**Screenshot 2 -- "Order Confirmation" email:**
- Item price shows `$0.00` (data issue -- price not passed correctly to line items)
- Subtotal shows `$1360.00` (cents-not-divided bug -- the pricing fix we did was frontend-only; the orchestrator's `.toFixed(2)` on raw data still passes through whatever is stored)

**Screenshot 3 -- "Recurring Gift Rule Created" email:**
- "Events configured" is a placeholder -- no actual event names/dates rendered (the events array is likely empty)
- Missing recipient avatar or any visual personalization
- "Justin Meeks's" should be "Justin Meeks'" (possessive grammar)

---

### Systematic Gaps Across All Templates

#### Gap 1: "Order Shipped" lacks product details (CRITICAL)
The `orderShippedTemplate` has zero item information -- no images, no product names, no quantities. Every major e-commerce platform (Amazon, Shopify, Target) includes the full item list in shipping emails.

**Fix:** Add item images, names, quantities, and pricing breakdown to the shipped template. The orchestrator's handler already fetches `line_items` for confirmation emails but does NOT fetch order data for `order_shipped` events -- this data fetch needs to be added.

#### Gap 2: Raw ISO dates in shipped emails
`estimated_delivery` is passed as raw ISO (`2026-02-16T00:00:00`) and rendered as-is. The `formatScheduledDate()` utility already exists but isn't used here.

**Fix:** Apply `formatScheduledDate()` to `props.estimated_delivery` in `orderShippedTemplate`.

#### Gap 3: Remaining `.toFixed(2)` in orchestrator (18 instances)
The pricing consolidation only fixed the frontend files. The orchestrator edge function still has ~18 raw `.toFixed(2)` calls. Since the orchestrator is a Deno edge function (not a React file), it doesn't import `formatPrice` from `@/lib/utils`. We need a local `formatPrice` helper.

**Instances to fix:**
- `orderConfirmationTemplate`: lines 129, 145, 156, 160, 165, 170, 174
- `orderPendingPaymentTemplate`: lines 234, 245, 249, 254, 259, 263, 270
- `autoGiftApprovalTemplate`: line 449, 492
- `zmaLowBalanceAlertTemplate`: lines 577, 580, 584, 594

**Fix:** Add a local `formatPrice` function at the top of the orchestrator and replace all `.toFixed(2)` interpolations.

#### Gap 4: "Order Shipped" missing first-name greeting
Uses `props.customer_name` (full name) inconsistently. Other templates use `getFirstName()` but shipped does not.

**Fix:** Apply `getFirstName(props.customer_name)` in the shipped template greeting.

#### Gap 5: Shipped email -- missing shipping address
No shipping destination shown. Best practice is to confirm where the package is going so the customer can catch errors.

**Fix:** Add shipping address section from order data.

#### Gap 6: Handler doesn't fetch order data for `order_shipped`
The orchestrator handler (line 918) only fetches from DB for `order_confirmation` and `order_pending_payment`. The `order_shipped` event relies entirely on pre-passed data, which is why the shipped email is so sparse.

**Fix:** Extend the handler's DB fetch logic to also cover `order_shipped` and `order_failed` event types, pulling items, pricing breakdown, and shipping address.

#### Gap 7: Recurring gift events array rendering empty
The `recurringGiftRuleCreatedTemplate` tries to render `props.events` but falls back to the generic "Events configured" text. The calling code likely doesn't pass the events array.

**Fix:** This is a data-passing issue in the caller (likely the auto-gift setup flow). The template itself is correct -- we need to ensure the caller passes the `events` array with `date_type`, `occasion_name`, and `date` fields.

#### Gap 8: Missing "View Order" CTA in shipped email
The shipped template has "Track Your Package" (good) but no "View Order Details" link back to the platform, which is standard for driving engagement.

**Fix:** Add a secondary "View Order Details" link below the tracking button.

---

### Implementation Plan

#### Part 1: Add local `formatPrice` to orchestrator
Add at the top of `ecommerce-email-orchestrator/index.ts`:
```
const formatPrice = (amount: number): string => {
  return `$${Number(amount || 0).toFixed(2)}`;
};
```
Replace all 18 raw `.toFixed(2)` interpolations with `formatPrice()`.

#### Part 2: Enrich "Order Shipped" template
Rebuild `orderShippedTemplate` to include:
- First-name greeting via `getFirstName()`
- Formatted estimated delivery via `formatScheduledDate()`
- Product images + names + quantities (same layout as order confirmation)
- Shipping address section
- "View Order Details" secondary CTA

#### Part 3: Extend handler DB fetch for shipped/failed events
Update the handler condition (line 918) from:
```
if ((eventType === 'order_confirmation' || eventType === 'order_pending_payment') && orderId && !emailData)
```
to:
```
if (['order_confirmation', 'order_pending_payment', 'order_shipped', 'order_failed'].includes(eventType) && orderId && !emailData)
```
This ensures shipped and failed emails get the same rich data (items, pricing, address).

#### Part 4: Fix "Order Failed" template richness
Currently the failed template only shows order number and error message. Add:
- First-name greeting via `getFirstName()`
- Item list with images (so the customer knows which order failed)
- "Retry" or "Contact Support" with order context

#### Part 5: Recurring gift events data passthrough
Investigate the caller of `recurring_gift_rule_created` to ensure it passes the `events` array. If the caller is in `approve-auto-gift` or a frontend service, update it to include event details.

---

### Files Changed

| File | Changes |
|------|---------|
| `supabase/functions/ecommerce-email-orchestrator/index.ts` | Add `formatPrice()`, enrich shipped/failed templates, extend handler DB fetch, fix 18x `.toFixed(2)` |

### What Does NOT Change
- Base template (`base-template.ts`) -- already well-structured
- Order confirmation template -- already has items, images, pricing (just needs formatPrice)
- Auto-gift approval template -- already rich
- Welcome, connection, wishlist-shared templates -- appropriate for their purpose (no order data)

### Bonus: Possessive grammar fix
Fix `${props.recipient_name}'s` to handle names ending in 's' (e.g., "Justin Meeks'" not "Justin Meeks's"). Add a small helper:
```
const possessive = (name: string) => name.endsWith('s') ? `${name}'` : `${name}'s`;
```

