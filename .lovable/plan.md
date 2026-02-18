

# Privacy Fix: Hide Recipient Address from Gift Sender -- Complete Audit

## Summary of All Affected Areas

After a thorough codebase audit, I found **6 locations** where the recipient's full address is exposed (or could be exposed) to the gift sender. The original plan covered 2 of these -- here is the complete list.

---

## Area 1: Order Confirmation Page (`src/pages/OrderConfirmation.tsx`)
**Status: LEAKING -- confirmed by screenshot**

Lines 710-737: The privacy branch only triggers for `isScheduledGift`. When Charles does a "Buy Now" gift for Justin, it falls into the `else` branch and renders the full street address, ZIP, etc.

**Fix:** Expand the gift detection to include `order.gift_options?.is_gift`, `order.recipient_id`, or the presence of recipient data in `line_items`.

---

## Area 2: Confirmation Email (`ecommerce-email-orchestrator` -- `orderConfirmationTemplate`)
**Status: LEAKING -- confirmed by screenshot**

Line 218: Calls `renderShippingAddress(props.shipping_address)` unconditionally. Even though `props.is_gift` is available (set on line 1085), the template never checks it. Full address (name, street, city, state, ZIP) goes into every confirmation email.

**Fix:** Add a `renderGiftShippingAddress` helper that shows only name + city/state + "Full address securely stored." Use it when `props.is_gift` is true.

---

## Area 3: Pending Payment Email (`orderPendingPaymentTemplate`)
**Status: LEAKING (for scheduled gifts)**

Line 276: Same issue -- `renderShippingAddress` is called unconditionally. Since this template is specifically for scheduled/deferred gifts, it should *always* use the masked version.

**Fix:** Always use `renderGiftShippingAddress` in this template (it's inherently a gift flow).

---

## Area 4: Shipped Email (`orderShippedTemplate`)
**Status: LEAKING**

Line 327: `renderShippingAddress(props.shipping_address)` called with no gift check. When the gift ships, Charles gets an email with Justin's full address.

**Fix:** Check `props.is_gift` and use the masked rendering.

---

## Area 5: Guest Order Confirmation Email (`guestOrderConfirmationTemplate`)
**Status: LEAKING**

Line 882: Same pattern -- unconditional `renderShippingAddress`. Guest senders who buy gifts for connected recipients will see the full address.

**Fix:** Same `is_gift` check with masked rendering.

---

## Area 6: Order Detail Page (`src/pages/OrderDetail.tsx` via `ShippingInfoCard`)
**Status: PARTIALLY PROTECTED -- but has a gap for Buy Now gifts**

`ShippingInfoCard.tsx` sets `isGiftRecipient` based on `isScheduledGift || firstItem?.recipient_id`. For Buy Now gifts, there's no `scheduled_delivery_date`, and `recipient_id` depends on line_items structure. If neither matches, the card falls through to the full-address branch.

Additionally, `OrderDetail.tsx` line 86 detects gifts via `giftOptions?.isGift || isScheduledGift` and passes recipient info into `shipping_info`, but `ShippingInfoCard` re-derives gift status independently and may not catch Buy Now gifts.

**Fix:** Pass `isGift` flag explicitly from `OrderDetail.tsx` into `ShippingInfoCard` as a prop, or enhance `ShippingInfoCard` to also check gift_options from the order data.

---

## Area 7: Order Failed Email (`orderFailedTemplate`)
**Status: SAFE** -- Does not call `renderShippingAddress` at all. No fix needed.

---

## Implementation Plan

### Step 1: Email Orchestrator -- Add gift-aware address rendering

In `supabase/functions/ecommerce-email-orchestrator/index.ts`:

- Add a new `renderGiftShippingAddress(shippingAddress)` function that renders only:
  - Recipient name
  - City, State
  - "Full address securely stored for delivery" note with a lock icon
- Update 4 templates to use it when `is_gift` is true:
  - `orderConfirmationTemplate` (line 218)
  - `orderPendingPaymentTemplate` (line 276) -- always use masked version
  - `orderShippedTemplate` (line 327)
  - `guestOrderConfirmationTemplate` (line 882)

### Step 2: Order Confirmation Page -- Extend gift detection

In `src/pages/OrderConfirmation.tsx`:

- Change the privacy branch condition from `isScheduledGift` to a broader `isGiftOrder` check:
  - `isScheduledGift || order.gift_options?.is_gift || !!order.recipient_id`
- The masked rendering (city/state only + Lock icon) already exists -- just needs the correct trigger

### Step 3: ShippingInfoCard -- Fix Buy Now gift detection

In `src/components/orders/ShippingInfoCard.tsx`:

- Add a check for `(order as any).gift_options?.isGift` or `(order as any).gift_options?.is_gift` to the `isGiftRecipient` detection
- This ensures Buy Now gifts (which have gift_options.isGift=true but no scheduled_delivery_date) get the privacy treatment

### Step 4: Deploy and verify

- Deploy updated `ecommerce-email-orchestrator`
- Test a Buy Now gift flow and verify:
  - Confirmation page shows city/state only
  - Confirmation email shows city/state only
  - Order detail page shows city/state only
  - Self-purchase orders still show full address

---

## Files Modified

| File | Change |
|------|--------|
| `supabase/functions/ecommerce-email-orchestrator/index.ts` | Add `renderGiftShippingAddress`, update 4 templates |
| `src/pages/OrderConfirmation.tsx` | Broaden `isGiftOrder` detection for privacy branch |
| `src/components/orders/ShippingInfoCard.tsx` | Add `gift_options.isGift` to gift detection logic |

---

## What Remains Safe (No Changes Needed)

- **Order Failed Email**: Does not render shipping address
- **Connection Invitation Email**: No address data included
- **AddressProviderPage**: This is the recipient providing their OWN address -- not a leak
- **Cart page**: Shows the sender's own address for self-shipping validation

