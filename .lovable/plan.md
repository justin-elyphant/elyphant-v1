

# Fix: Buy Now Scheduled Delivery Date Silently Dropped

## Critical Bug Found

The **scheduled delivery date from Buy Now is silently dropped** and scheduling will NOT work. Here's why:

### Root Cause

The `BuyNowDrawer` passes `scheduled_delivery_date` inside the `metadata` object:

```javascript
metadata: {
  scheduled_delivery_date: scheduledDate,  // e.g. "2026-03-15"
  gift_message: giftNote.trim(),
}
```

But `create-checkout-session` reads the scheduled date from a **top-level** field called `scheduledDeliveryDate` (line 99), NOT from metadata:

```javascript
const { scheduledDeliveryDate, ... } = requestBody;  // This is undefined!
```

Then on line 323, it sets `metadata.scheduled_delivery_date = scheduledDeliveryDate || ''` which becomes `''`.

When the client metadata merge happens (lines 338-344), the client's `scheduled_delivery_date` value is **skipped** because the key already exists (set to `''`). The merge logic only adds keys that are `undefined`.

This means:
1. `isScheduled` = false (no deferred payment mode)
2. `useDeferredPayment` = false (no setup mode)
3. `metadata.scheduled_delivery_date` = '' in Stripe (webhook sees no schedule)
4. Order is created as immediate, not scheduled

The **gift_message** works fine because `giftOptions` is null for Buy Now, so `metadata.gift_message` is never pre-set, and the client metadata merge adds it correctly.

## Fix

### Option chosen: Fix the BuyNowDrawer to pass `scheduledDeliveryDate` as a top-level field

This aligns with how the checkout page sends it and requires no edge function changes.

### File: `src/components/marketplace/product-details/BuyNowDrawer.tsx`

**Change**: Add `scheduledDeliveryDate` as a top-level field in the request body (alongside `metadata`), and remove it from metadata to avoid duplication.

Before:
```javascript
body: {
  cartItems: [cartItem],
  shippingInfo,
  pricingBreakdown: { ... },
  metadata: {
    ...(scheduledDate ? { scheduled_delivery_date: scheduledDate } : {}),
  },
}
```

After:
```javascript
body: {
  cartItems: [cartItem],
  shippingInfo,
  pricingBreakdown: { ... },
  scheduledDeliveryDate: scheduledDate || null,
  metadata: {
    // scheduled_delivery_date removed — handled by top-level field
  },
}
```

This single change ensures:
- The edge function reads the date correctly from `requestBody.scheduledDeliveryDate`
- `isScheduled` and `useDeferredPayment` evaluate correctly
- Stripe session gets proper `metadata.scheduled_delivery_date`
- Webhook creates order with `status: 'scheduled'` and correct `scheduled_delivery_date`
- The 8+ day deferred payment (setup mode) activates properly

No edge function changes needed -- the existing code already handles everything correctly when `scheduledDeliveryDate` is passed at the top level.

