

## Email Template Audit: Gaps in the Ecommerce Email Orchestrator

### Methodology
I reviewed all 22 email templates in `ecommerce-email-orchestrator/index.ts` and the data passed by each caller (`stripe-webhook-v2`, `zinc-webhook`, `order-monitor-v2`, `approve-auto-gift`, etc.) against e-commerce best practices (Amazon, Shopify, Lululemon transactional email standards).

---

### Critical Gaps Found

#### 1. `order_shipped` — Missing product photos and item list (the issue you spotted)

**Problem:** When triggered by `zinc-webhook` or `order-monitor-v2`, the `template_variables` passed are:
```
order_number, customer_name, tracking_number, carrier, tracking_url, estimated_delivery
```
No `items` array is included. The template has `renderItemsHtml(props.items)` support but the data is never provided from these callers. The only way items appear is if the orchestrator fetches from DB via `orderId` — but these callers pass `template_variables` directly, not `orderId`.

**Result:** Shipped emails show order number, tracking, and delivery date but NO product photos, titles, quantities, or pricing breakdown. Your screenshot confirms this — just "Your order has shipped" with metadata but no item details.

**Fix:** In `zinc-webhook` and `order-monitor-v2`, either:
- Pass `orderId` instead of inline `template_variables` (lets the orchestrator's DB-fetch logic handle it), OR
- Fetch `line_items` from the order and include an `items` array in `template_variables`

#### 2. `order_shipped` — Missing shipping address

Same root cause. The shipped email template supports `renderShippingAddress()` but callers don't pass `shipping_address`. When the orchestrator doesn't fetch from DB, this section is blank.

#### 3. `order_failed` — Same data gap as shipped

`order-monitor-v2` doesn't queue `order_failed` emails at all when Zinc reports failure (it updates the order status but doesn't send an email). The `zinc-webhook` handler for `request_failed` also doesn't queue a notification email.

**Fix:** Add email queue insertion for failed orders in both `zinc-webhook` (request_failed handler) and `order-monitor-v2` (failure detection), passing `orderId` so the orchestrator fetches full context.

#### 4. `guest_order_confirmation` — No "View Order Details" link works for guests

The CTA links to `/order-confirmation?session_id=...` which is fine, but the secondary CTA pattern from `order_confirmation` that links to `/orders/{order_id}` requires authentication. Guest confirmation correctly avoids this, but there's no tracking CTA for guests post-purchase.

#### 5. `vendor_new_order` — Missing product details

Shows item count and total but NO individual product names, photos, quantities, or shipping address. A vendor receiving a "New Order" email can't see what was ordered without logging into the portal.

**Fix:** Pass `items` array and shipping address from `stripe-webhook-v2` vendor notification block (line ~1163) to the template.

#### 6. `gift_coming_your_way` — No arrival date passed from most callers

The template supports `props.arrival_date` but `stripe-webhook-v2` (lines 1028, 1077) doesn't pass it. The `estimated_delivery` from the order record isn't known yet at webhook time (Zinc hasn't processed it), but `scheduled_delivery_date` could be passed for scheduled gifts.

#### 7. No `order_delivered` template exists

`zinc-webhook` queues `order_delivered` as an event type (line 644) but there's no matching case in `getEmailTemplate()`. This would throw "Unknown email event type: order_delivered" — meaning delivery confirmation emails silently fail.

**Fix:** Create a new `orderDeliveredTemplate` with product photos, delivery confirmation, and a "Leave a Review" or "Rate Your Experience" CTA.

---

### Template Quality Summary

| Template | Photos | Items | Pricing | Address | Tracking | Status |
|----------|--------|-------|---------|---------|----------|--------|
| `order_confirmation` | Yes | Yes | Yes | Yes | N/A | Complete |
| `guest_order_confirmation` | Yes | Yes | Yes | Yes | N/A | Complete |
| `order_pending_payment` | Yes | Yes | Yes | Yes | N/A | Complete |
| `order_shipped` | NO | NO | NO | NO | Yes | **Broken** |
| `order_failed` | NO | NO | NO | NO | N/A | **Broken** |
| `order_delivered` | — | — | — | — | — | **Missing** |
| `gift_coming_your_way` | N/A (surprise) | N/A | N/A | N/A | NO | Partial |
| `vendor_new_order` | NO | NO | NO | NO | N/A | **Incomplete** |
| `auto_gift_approval` | Yes | Yes | N/A | N/A | N/A | Complete |
| All social/beta/vendor-app | N/A | N/A | N/A | N/A | N/A | Complete |

---

### Proposed Fix (7 changes)

1. **`zinc-webhook` + `order-monitor-v2`**: Change shipped email queue insertions to pass `orderId` instead of inline `template_variables`, so the orchestrator's DB-fetch logic populates items, photos, pricing, and address automatically

2. **`zinc-webhook`**: Add `order_failed` email queue insertion in `request_failed` handler, passing `orderId`

3. **`order-monitor-v2`**: Add `order_failed` email queue insertion when Zinc failure is detected

4. **Orchestrator**: Add `order_delivered` template — product photos, "Your order has been delivered" headline, delivery date, and "Rate Your Experience" CTA

5. **`zinc-webhook`**: Ensure `order_delivered` event passes `orderId` for full context

6. **`vendor_new_order`**: Enhance to include individual item names, photos, quantities, and shipping address (data already available in `stripe-webhook-v2`)

7. **`gift_coming_your_way`**: Pass `scheduled_delivery_date` as `arrival_date` from `stripe-webhook-v2` callers when available

### Files touched
- `supabase/functions/zinc-webhook/index.ts`
- `supabase/functions/order-monitor-v2/index.ts`
- `supabase/functions/ecommerce-email-orchestrator/index.ts`
- `supabase/functions/stripe-webhook-v2/index.ts`

### What stays unchanged
- All social, beta, vendor application, connection, and welcome templates (already complete for their purpose)
- Email queue infrastructure, Resend integration, base template styling
- Stripe checkout, payment flows, Zinc order submission

