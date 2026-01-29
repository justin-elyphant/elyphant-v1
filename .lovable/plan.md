

# Memory Entry: Recipient-First Address Priority Fix

## Overview

Document the production-validated fix in `process-order-v2` that ensures gift orders ship to the recipient's address (stored in `line_items.items[].recipient_shipping`) instead of the sender's address (stored in `order.shipping_address`).

---

## Memory Entry Details

**Title:** `fulfillment/recipient-first-address-priority-validated`

**Tags:** `process-order-v2, gift-fulfillment, zinc-api, address-priority, production-validated`

**Content:**

The `process-order-v2` edge function implements a **Recipient-First Address Priority** pattern for gift order fulfillment. When processing orders, the function checks `line_items.items[0].recipient_shipping` before falling back to `order.shipping_address`. This ensures gifts ship to the intended recipient rather than the sender.

**Priority Chain:**
1. `line_items.items[0].recipient_shipping` (gift recipient)
2. `order.shipping_address` (buyer/self-purchase fallback)

**Phone Number Priority:**
1. `recipient_shipping.phone` (recipient's phone for carrier notifications)
2. `shippingAddress.phone` (from order shipping)
3. `shopperPhone` (from buyer's profile)

**Production Validation:**
- Order `ORD-20260129-0218` successfully shipped to Charles Meeks (Ruidoso, NM) instead of sender Justin Meeks (Solana Beach, CA)
- Zinc order `2d28fa1ce59fa363f40b131825263ecb` → Amazon `112-3264869-6989015`
- Confirmed `is_gift: true` and gift message with sender signature transmitted correctly

This fix applies to both one-time scheduled gifts and recurring auto-gifts through the unified `scheduled-order-processor` → `process-order-v2` pipeline.

---

## Files Affected

| File | Purpose |
|------|---------|
| `supabase/functions/process-order-v2/index.ts` | Contains the Recipient-First logic at Step 4.5 |

---

## Technical Notes

The fix extracts recipient data with field normalization to handle different naming conventions in the stored metadata:

```typescript
shippingAddress = {
  name: rs.name || recipientName,
  address_line1: rs.address_line1 || rs.street || rs.address || '',
  address_line2: rs.address_line2 || rs.addressLine2 || '',
  city: rs.city || '',
  state: rs.state || '',
  postal_code: rs.postal_code || rs.zipCode || rs.zip_code || '',
  country: rs.country || 'US',
  phone: rs.phone || '',
};
```

Console logging distinguishes between gift and self-purchase flows:
- `🎁 [RECIPIENT-FIRST] Gift order detected → Using recipient shipping`
- `📦 [SELF-PURCHASE] Using order.shipping_address (buyer)`
