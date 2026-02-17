

## Fix Guest Checkout: 2 Bugs, 3 Minimal Changes

### What's Blocking Zinc Fulfillment

The full pipeline (webhook -> order creation -> process-order-v2 -> Zinc) is already wired correctly. The order insert at line 568 is the single failure point -- once it succeeds, `triggerOrderProcessingWithRetry` fires Zinc automatically (line 622-624). So fixing the insert fixes everything downstream.

### Bug 1: `user_id` is UUID, guest sends `"guest_1771294466750"`

Lines 360-372 of `stripe-webhook-v2` extract `userId` and throw if missing. For guests, the value is a non-UUID string which causes Postgres to reject the insert.

**Fix**: Detect `guest_` prefix, set `user_id = null`, store email in a new `guest_email` column. Same 3-line pattern in both functions.

### Bug 2: `is_scheduled` column doesn't exist

Line 132 of `reconcile-checkout-session` inserts `is_scheduled: isScheduled` -- that column was never created in the orders table.

**Fix**: Remove the one line.

### Changes (3 files, minimal edits)

**1. Database: Add `guest_email` column**

```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_email text;
```

Run in Supabase SQL Editor.

**2. `stripe-webhook-v2/index.ts` -- 3 edits**

At line 360 (userId extraction), replace:
```typescript
const userId = metadata.user_id || session.client_reference_id;
```
with:
```typescript
const rawUserId = metadata.user_id || session.client_reference_id;
const isGuestCheckout = !rawUserId || rawUserId.startsWith('guest_');
const userId = isGuestCheckout ? null : rawUserId;
const guestEmail = isGuestCheckout
  ? (metadata.guest_email || metadata.user_email || session.customer_details?.email || null)
  : null;
```

At lines 369-372 (the throw), replace with a warning:
```typescript
if (!userId && !isGuestCheckout) {
  console.error('No user_id in session metadata or client_reference_id');
  throw new Error('Missing user_id in checkout session');
}
if (isGuestCheckout) {
  console.log(`Guest checkout detected | Email: ${guestEmail}`);
}
```

At line 538 (order insert object), add `guest_email`:
```typescript
const orderData = {
  user_id: userId,       // null for guests
  guest_email: guestEmail,
  // ... rest unchanged
};
```

At line 592 (wishlist_item_purchases), guard the insert:
```typescript
purchaser_user_id: userId,  // null for guests -- column is already nullable
```

No other changes needed -- `triggerOrderProcessingWithRetry` at line 623 receives `userId` (null for guests) and `process-order-v2` only uses the order ID to fetch data, not the user ID.

**3. `reconcile-checkout-session/index.ts` -- 2 edits**

At line 93 (same userId pattern):
```typescript
const rawUserId = metadata.user_id || session.client_reference_id;
const isGuestCheckout = !rawUserId || rawUserId.startsWith('guest_');
const userId = isGuestCheckout ? null : rawUserId;
const guestEmail = isGuestCheckout
  ? (metadata.guest_email || session.customer_details?.email || null)
  : null;
```

Update the throw at lines 95-97:
```typescript
if (!userId && !isGuestCheckout) {
  throw new Error('No user_id found in session metadata or client_reference_id');
}
```

At line 122 (order insert), add `guest_email` and remove `is_scheduled`:
```typescript
const orderData = {
  user_id: userId,
  guest_email: guestEmail,
  // ... keep all other fields ...
  // REMOVE: is_scheduled: isScheduled,  (column doesn't exist)
};
```

### After Deploy: Recover the Paid Order

Call `reconcile-checkout-session` with the session ID from the failed checkout to create the order and trigger Zinc -- no need for Justin to re-purchase:

```
POST /reconcile-checkout-session
{ "sessionId": "cs_live_b1FZsdr8WZhXqCLouEMf1nCavVO47AhDPxPYZpPs3QpBPbb01ApwRuvKlM" }
```

### End-to-End Flow After Fix

1. Guest completes Stripe Checkout (already done -- payment is `paid`)
2. Webhook fires -> `user_id = null`, `guest_email = "justin+guest@elyphant.com"`
3. Order inserted successfully into `orders` table
4. `triggerOrderProcessingWithRetry` fires `process-order-v2`
5. `process-order-v2` submits to Zinc API for Amazon fulfillment
6. Email orchestrator sends confirmation to guest email

