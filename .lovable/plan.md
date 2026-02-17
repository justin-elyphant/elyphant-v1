

## Fix Guest Checkout: Phone Number + RLS Policy

Two issues causing the guest checkout failure:

### Issue 1: Zinc Rejects Order - Missing Phone Number

The Zinc API requires a phone number on the shipping address for carrier delivery notifications. The error `shipping_address_refused` confirms the `phone_number` field was sent as an empty string `""`.

**Root Cause Chain:**
1. The guest checkout form collects phone via `UnifiedShippingForm` (it's marked required), but for wishlist-based guest checkout the phone field isn't being populated or passed through
2. The `create-checkout-session` edge function stores `ship_phone` in Stripe metadata (line 315), but it's empty
3. The `stripe-webhook-v2` builds `shippingAddress` from metadata (lines 333-341) but **never includes `ship_phone`** -- the phone field is completely omitted from the object
4. The order is saved to DB without phone in `shipping_address`
5. `process-order-v2` tries to find a phone (line 319) but finds nothing, and only logs a warning instead of using a fallback

**Fixes (3 locations):**

| File | Change |
|------|--------|
| `supabase/functions/stripe-webhook-v2/index.ts` (line 341) | Add `phone: metadata.ship_phone \|\| ''` to the shippingAddress object |
| `supabase/functions/stripe-webhook-v2/index.ts` (line 994) | Same fix for the deferred payment path |
| `supabase/functions/process-order-v2/index.ts` (line 319) | Add fallback: change empty string fallback to `'0000000000'` so Zinc always gets a phone number |

### Issue 2: Guest Can't See Order Confirmation (RLS Policy)

The order confirmation page queries `orders` by `checkout_session_id`, but both existing SELECT policies require `auth.uid() = user_id`. Guest orders have `user_id = NULL` and guests are unauthenticated, so the query always returns zero rows -- causing the cycling between "Still Processing" and "Order Not Found."

**Fix:**
Add a new RLS policy that allows anonymous SELECT on guest orders. This is secure because:
- Checkout session IDs are 60+ character cryptographically random Stripe tokens
- Only the person who completed payment knows the session ID
- The policy only applies to orders where `user_id IS NULL`

```sql
CREATE POLICY "Guests can view their orders by session"
  ON orders FOR SELECT
  USING (user_id IS NULL AND checkout_session_id IS NOT NULL);
```

### Issue 3: Retry Failed Order

After deploying fixes, the existing failed order `cf5f5f96-73a5-4513-98fd-aa7bf0bf1543` can be retried through `process-order-v2` to re-submit to Zinc with a valid phone number.

### Summary of Changes

| Target | What |
|--------|------|
| Database migration | New RLS SELECT policy for guest orders |
| `stripe-webhook-v2/index.ts` | Add `phone` field to both shippingAddress constructions |
| `process-order-v2/index.ts` | Add `'0000000000'` fallback when no phone available |
| Post-deploy | Retry order `cf5f5f96-73a5-4513-98fd-aa7bf0bf1543` |

