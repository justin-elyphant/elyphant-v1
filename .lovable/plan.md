
# Fix: Add Recipient Name to Shipping Address in Auto-Gift Flow

## Problem Summary
Justin's auto-gift order failed Zinc submission with error:
**"Incomplete shipping address. Missing: name"**

The order's `shipping_address` has all address fields but is missing the recipient's name.

---

## Root Cause Analysis

### Data Structure Issue
Justin's `profiles` table stores:
```json
{
  "name": "Justin Meeks",                    // ← Name is separate column
  "shipping_address": {
    "address_line1": "309 Solana Hills Drive",
    "city": "Solana Beach",
    "state": "CA",
    "zip_code": "92075"
    // ❌ No "name" field inside shipping_address
  }
}
```

### Bug Location
**File**: `supabase/functions/approve-auto-gift/index.ts` (Line 364)

Current code:
```typescript
shipping_address: recipientProfile?.shipping_address,
```

This copies the shipping address JSONB directly **without adding the recipient name**.

The `process-order-v2` function validates that `shipping_address.name` exists (required for Zinc/carrier delivery), but it's never populated for auto-gift orders.

---

## Implementation Plan

### File: `supabase/functions/approve-auto-gift/index.ts`

**Change 1**: Fix off-session payment order creation (around line 364)

Replace:
```typescript
shipping_address: recipientProfile?.shipping_address,
```

With:
```typescript
shipping_address: recipientProfile?.shipping_address ? {
  ...recipientProfile.shipping_address,
  name: recipientProfile.shipping_address.name || recipientName,
} : null,
```

**Change 2**: Fix checkout fallback flow - ensure `deliveryGroups.recipient.address` includes name (around line 498-503)

Update the delivery groups structure to include name in the address:
```typescript
deliveryGroups: [{
  recipient: {
    name: recipientName,
    email: recipientEmail || recipientProfile?.email,
    address: recipientProfile?.shipping_address ? {
      ...recipientProfile.shipping_address,
      name: recipientName,
    } : null,
  },
  // ...
}],
```

---

## Additional Fix: Update Existing Order

After deploying the code fix, we need to fix Justin's existing order by adding the name to the shipping address.

**SQL Fix**:
```sql
UPDATE orders 
SET shipping_address = jsonb_set(
  shipping_address, 
  '{name}', 
  '"Justin Meeks"'
),
status = 'payment_confirmed',
funding_hold_reason = NULL,
updated_at = NOW()
WHERE id = '7cc03e10-0c00-458a-860a-e937a1850d8f';
```

This will:
1. Add `"name": "Justin Meeks"` to the shipping_address JSONB
2. Reset status from `requires_attention` back to `payment_confirmed`
3. Clear the funding hold reason
4. Allow the scheduler to retry Zinc submission

---

## Technical Details

### Affected Flow
1. User clicks "Approve & Order" on auto-gift approval page
2. `approve-auto-gift` creates order with `shipping_address` from recipient profile
3. **BUG**: Name not included in shipping_address
4. `scheduled-order-processor` triggers `process-order-v2`
5. `process-order-v2` validates required fields (name, address, city, state, zip)
6. **FAILURE**: `name` field missing → status set to `requires_attention`

### Why This Only Affects Auto-Gifts
Regular checkout flows pass `session.shipping_details` from Stripe Checkout which includes the name. Auto-gift orders bypass Stripe Checkout's address collection and use the recipient profile directly.

---

## Summary of Changes

| File | Change |
|------|--------|
| `approve-auto-gift/index.ts` | Add recipient name to shipping_address when creating orders |
| Database (one-time fix) | Update Justin's order to include name in shipping_address |

---

## Post-Fix Testing

After deploying:
1. Reset Justin's order status to `payment_confirmed`
2. Run the scheduler again with simulated date `2026-02-16`
3. Verify order status changes to `processing` with a `zinc_request_id`
