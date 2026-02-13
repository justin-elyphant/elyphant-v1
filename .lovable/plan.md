

## Fix: Zinc Retry Idempotency + max_price Unit Bug

### Problem 1: Retries Never Create New Zinc Orders

The `idempotency_key` is set to `orderId` (a fixed UUID). Zinc caches the original request and returns the same cached `max_price_exceeded` error on every retry. The edge function logs confirm both retry attempts received the same `request_id: a1b92762524f77104d2ecf8af1077418`.

**Fix:** Append a retry timestamp to the idempotency key so each retry creates a fresh Zinc request:

```
idempotency_key: `${orderId}-retry-${Date.now()}`
```

For the initial submission (from webhook), keep the plain `orderId` for deduplication safety. Only use the timestamped key when the order is already in `processing` or `failed` status (i.e., a retry).

### Problem 2: max_price Unit Mismatch

The `line_items.subtotal` in the database is `1200` (cents, from Zinc). But `order.total_amount` is `14.20` (dollars). The current formula treats both the same way:

```
Math.ceil((order.line_items?.subtotal || order.total_amount) * 100 * 1.20) + 1500
```

- With subtotal (1200 cents): `1200 * 100 * 1.20 = 144,000` -- $1,440 (way too high)
- With total_amount (14.20 dollars): `14.20 * 100 * 1.20 = 1,704` -- $17.04 + $15 = $32.04 (correct)

**Fix:** Since `line_items.subtotal` is already in cents, skip the `* 100` for it:

```typescript
// Determine product subtotal in cents
// line_items.subtotal is already in cents (from Zinc data), total_amount is in dollars
const hasLineItemSubtotal = order.line_items?.subtotal != null;
const productSubtotalCents = hasLineItemSubtotal
  ? order.line_items.subtotal          // Already cents (e.g., 1200 = $12.00)
  : order.total_amount * 100;          // Convert dollars to cents

// Hybrid max_price: 20% buffer + $15 fixed shipping/tax allowance
max_price: Math.ceil(productSubtotalCents * 1.20) + 1500,
```

For Order #6387: `Math.ceil(1200 * 1.20) + 1500 = 1440 + 1500 = 2940` ($29.40), which covers Amazon's $20.65 total.

### Changes

**File: `supabase/functions/process-order-v2/index.ts`**

1. Around line 291-301: Fix the `max_price` calculation to handle cents vs dollars correctly, and make the idempotency key retry-aware.

2. Detect retry scenario: if order status is already `processing` or `failed`, append timestamp to idempotency key.

### Expected Result After Fix

- Clicking **Retry** on Order #6387 will send a **new** Zinc request (fresh idempotency key) with `max_price: 2940` ($29.40)
- Amazon's total of $20.65 will be under the limit
- Future orders will also calculate max_price correctly regardless of whether subtotal is in cents or dollars

### Deployment

- Edit and deploy `process-order-v2` edge function
- Retry Order #6387 from Trunkline
- Verify new request appears in Zinc dashboard with `max_price: 2940`

