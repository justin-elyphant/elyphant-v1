
# Scheduled Gifting Testing Readiness Audit & Fix Plan

## What You're About to Test

You want to test two flows from the product scheduling modal:
1. **One-Time Scheduled Gift** — Pick a random future date, schedule it for a specific recipient
2. **Recurring Gift** — Set up an annual auto-gift for a special occasion

Before you test, there is one important gap to fix that would cause issues mid-test.

---

## Current State: What Works

### Auto-Gift Orchestrator (Recurring/Backend)
The orchestrator is solid. It correctly:
- Checks `wishlist_item_purchases` and excludes already-purchased items from suggestions
- Falls back to recipient interests, then generic products if the wishlist is empty
- Sends an approval email at T-7 days with suggested gifts
- Creates a checkout session at T-4 days with the selected item
- Passes `wishlist_id` and `wishlist_item_id` through to `create-checkout-session` so the "Gifted" badge appears after auto-gifting fires

### Scheduling Modal (`UnifiedGiftSchedulingModal`)
The modal correctly:
- Adds the product to the cart with a `scheduledDeliveryDate` on the recipient assignment
- Optionally creates a recurring rule in `auto_gifting_rules`
- Validates the delivery date meets the minimum lead time

---

## The Gap: Wishlist Tracking Is Dropped at Checkout

When a user schedules a gift from a product page (one-time or recurring + cart):

```
User picks product → "Schedule Gift" modal → addToCart() with scheduledDeliveryDate
     → Cart → UnifiedCheckoutForm → create-checkout-session
```

The `CartItem` struct **does** have `wishlist_id` and `wishlist_item_id` fields, but in `UnifiedCheckoutForm.tsx` (line 406-413), the cart items are mapped to the checkout payload **without** those fields:

```typescript
// Current — wishlist tracking IDs are LOST here
cartItems: cartItems.map(item => ({
  product_id: item.product.product_id,
  name: item.product.name,
  price: item.product.price,
  quantity: item.quantity,
  image_url: item.product.image,
  recipientAssignment: item.recipientAssignment  // ← wishlist_id not here
})),
```

This means that when you schedule a gift from the product page and then check out through the cart, no `wishlist_item_purchases` record is created, and the "Gifted 🎁" badge never appears on the wishlist. This would only surface as a bug if you go from a wishlist → product page → Schedule Gift.

---

## The Fix: 3 Small Changes

### 1. Pass `wishlist_id` + `wishlist_item_id` in `UnifiedCheckoutForm`
In `src/components/checkout/UnifiedCheckoutForm.tsx`, add the two tracking fields to the `cartItems` mapping.

### 2. Accept them in `create-checkout-session` schema (already done)
The Zod schema in the edge function already accepts `wishlist_id` and `wishlist_item_id` on `CartItemSchema` — no backend change needed.

### 3. Ensure `product_name` is present (minor robustness fix)
The checkout payload uses `name` but the edge function internally maps to `product_name`. Already handled by passthrough, but worth confirming.

---

## Test Scenarios & What to Watch For

### Test 1: One-Time Scheduled Gift
```
Steps:
1. Go to a product page
2. Click "Schedule Gift"  
3. Select a recipient
4. Pick a date 8+ days out (triggers Stripe Setup Mode)
5. Click "Schedule Gift" → goes to cart
6. Checkout through cart
7. Complete Stripe payment

Expected:
✅ Stripe redirects to /order-confirmation
✅ Order shows purple "SCHEDULED DELIVERY" hero card
✅ Order status = "scheduled" in DB
✅ If product was on recipient's wishlist → "Gifted 🎁" badge appears (requires the fix above)
```

### Test 2: One-Time Gift, Near-Term (7 days or less)
```
Steps: Same as Test 1 but pick a date 2-7 days out

Expected:
✅ Standard Stripe payment capture (not Setup Mode)
✅ order.status = "processing" 
✅ scheduled-order-processor handles on the delivery date
```

### Test 3: Recurring Gift Setup (from product page)
```
Steps:
1. Product page → "Schedule Gift" modal
2. Toggle to "Recurring"
3. Select recipient + occasion (e.g., Birthday, Christmas)
4. Configure budget + payment method
5. Click "Schedule & Set Recurring"

Expected:
✅ Product added to cart for immediate purchase
✅ Row created in auto_gifting_rules with scheduled_date
✅ Toast: "Gift scheduled + recurring rule created!"
✅ Rule visible at /recurring-gifts
```

### Test 4: Recurring Gift — Orchestrator Approval Email
```
Steps (simulate the T-7 trigger):
1. Make sure a rule exists in auto_gifting_rules
2. Trigger: POST to /auto-gift-orchestrator with simulatedDate = scheduled_date - 7 days
3. Check your email for the approval email

Expected:
✅ Email arrives with 3 suggested gifts (from wishlist, excluding already-purchased)
✅ "Approve" and "Reject" links in email
✅ automated_gift_executions record created with status = 'pending_approval'
```

---

## Files to Change

| File | Change |
|------|--------|
| `src/components/checkout/UnifiedCheckoutForm.tsx` | Add `wishlist_id` and `wishlist_item_id` to cart item mapping (line ~406) |

That's it — one file, two lines added. The rest of the pipeline already handles these fields correctly.

---

## Technical Detail: What the Fix Looks Like

```typescript
// BEFORE (UnifiedCheckoutForm.tsx ~line 406)
cartItems: cartItems.map(item => ({
  product_id: item.product.product_id || item.product.id,
  name: item.product.name,
  price: item.product.price,
  quantity: item.quantity,
  image_url: item.product.image || item.product.images?.[0],
  recipientAssignment: item.recipientAssignment
})),

// AFTER
cartItems: cartItems.map(item => ({
  product_id: item.product.product_id || item.product.id,
  name: item.product.name,
  price: item.product.price,
  quantity: item.quantity,
  image_url: item.product.image || item.product.images?.[0],
  recipientAssignment: item.recipientAssignment,
  wishlist_id: item.wishlist_id || '',         // ← pass through for badge tracking
  wishlist_item_id: item.wishlist_item_id || '' // ← pass through for badge tracking
})),
```

This ensures the webhook (`stripe-webhook-v2`) receives these IDs in session metadata and can create the `wishlist_item_purchases` record automatically upon payment completion.
