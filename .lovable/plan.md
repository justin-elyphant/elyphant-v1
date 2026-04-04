

## Fix: Add Phone Number to Guest Checkout Inline Address Form

### Problem
Guest checkout collects name, address, city, state, zip, country — but **no phone number**. The `checkoutShippingInfo` interface in `CheckoutShippingReview.tsx` lacks a `phone` field. This causes `process-order-v2` to fall back to `0000000000`, meaning:
- No carrier delivery SMS notifications
- Amazon may flag orders with invalid phone numbers
- Potential delivery issues if carrier needs to contact recipient

### Fix

**`src/components/checkout/CheckoutShippingReview.tsx`**
1. Add `phone` to the `checkoutShippingInfo` interface (line 33, after `country`)
2. Add a phone input field in the guest inline address form (alongside the existing fields)
3. Pass `phone` through `onUpdateShippingInfo` callback

**`src/components/checkout/UnifiedCheckoutForm.tsx`** (or wherever `checkoutShippingInfo` state is managed)
- Add `phone` to the shipping info state object
- Ensure `phone` is included in the Stripe session metadata so `stripe-webhook-v2` stores it in the order's `shipping_address`

**`supabase/functions/stripe-webhook-v2/index.ts`**
- Verify that `phone` from session metadata is written to `shipping_address.phone` in the order record (likely already handled if metadata passes it through)

### What stays unchanged
- `process-order-v2` already reads `shippingAddress.phone` correctly (line 348) — it just needs a real value
- `UnifiedShippingForm.tsx` already has phone collection (for non-guest flows) — no changes needed
- ZMA balance, Zinc webhooks, email orchestrator — all untouched

### Scope
3 files touched. The phone field uses `type="tel"` with placeholder `(555) 123-4567`, matching `UnifiedShippingForm`.

