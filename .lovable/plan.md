
# Recipient Profile Phone Lookup - Implementation Plan

## Problem Summary

The Zinc API order for Charles Meeks in Ruidoso failed because `phone_number` was empty. The sender (you) shouldn't need to know the recipient's phone - the system should automatically extract it from the **recipient's own profile**.

## Current Data State

```
connection: Charles Meeks
├── connected_user_id: f5c6fbb5-f2f2-4430-b679-39ec117e3596 ✅ (linked to profile!)
├── pending_recipient_phone: NULL ❌
└── pending_shipping_address: NULL ❌

profile (f5c6fbb5...): Charles Meeks
├── shipping_address.address_line1: "402 College Dr" ✅
├── shipping_address.city: "Ruidoso" ✅
├── shipping_address.phone: NULL ❌ (needs to be added)
```

## Solution: Two-Part Fix

### Part 1: Immediate Data Fix (Manual)

Add phone numbers to each user's `profiles.shipping_address` JSONB:

```sql
-- Justin Meeks (your test account)
UPDATE profiles 
SET shipping_address = shipping_address || '{"phone": "YOUR_PHONE"}'::jsonb
WHERE id = 'a3a6e0fb-4b2c-4627-a675-a08480d60f89';

-- Charles Meeks (your dad)
UPDATE profiles 
SET shipping_address = shipping_address || '{"phone": "DAD_PHONE"}'::jsonb
WHERE id = 'f5c6fbb5-f2f2-4430-b679-39ec117e3596';

-- Curt Davidson
UPDATE profiles 
SET shipping_address = shipping_address || '{"phone": "CURT_PHONE"}'::jsonb
WHERE id = 'e306dd36-1860-4520-a74c-fef4473aa763';

-- (Repeat for other users)
```

### Part 2: System Fix - Profile Phone Lookup

Modify `stripe-webhook-v2` to fetch the recipient's phone from their **profile** when `connected_user_id` exists.

---

## Technical Implementation

### File: `supabase/functions/stripe-webhook-v2/index.ts`

**Location:** `fetchRecipientAddresses` function (lines 144-184)

**Current Logic:**
```typescript
const { data: connections } = await supabase
  .from('user_connections')
  .select('id, pending_recipient_name, pending_shipping_address, connected_user_id')
  .in('id', recipientIds);

// Only uses pending_shipping_address from connections table
```

**New Logic:**
```typescript
const { data: connections } = await supabase
  .from('user_connections')
  .select(`
    id, 
    pending_recipient_name, 
    pending_shipping_address, 
    pending_recipient_phone,
    connected_user_id,
    connected_profile:profiles!user_connections_connected_user_id_fkey(
      name,
      shipping_address
    )
  `)
  .in('id', recipientIds);

for (const conn of connections || []) {
  // PRIORITY 1: Use connected profile's shipping address (recipient-owned)
  if (conn.connected_profile?.shipping_address) {
    const profileAddr = conn.connected_profile.shipping_address;
    addressMap.set(conn.id, {
      name: conn.connected_profile.name || conn.pending_recipient_name || '',
      address_line1: profileAddr.address_line1 || profileAddr.street || '',
      address_line2: profileAddr.address_line2 || '',
      city: profileAddr.city || '',
      state: profileAddr.state || '',
      postal_code: profileAddr.zip_code || profileAddr.zipCode || '',
      country: profileAddr.country || 'US',
      phone: profileAddr.phone || '',  // ✅ CRITICAL: Phone from profile!
    });
    console.log(`✅ [FETCH] Using PROFILE address for ${conn.connected_profile.name}`);
    continue;
  }
  
  // PRIORITY 2: Fall back to pending_shipping_address (sender-provided)
  if (conn.pending_shipping_address) {
    const addr = conn.pending_shipping_address;
    addressMap.set(conn.id, {
      name: addr.name || conn.pending_recipient_name || '',
      address_line1: addr.street || addr.address_line1 || '',
      // ... existing logic ...
      phone: addr.phone || conn.pending_recipient_phone || '',
    });
  }
}
```

### File: `supabase/functions/process-order-v2/index.ts`

**Location:** Line 261 - Add validation warning when phone is still missing

**Add after line 260:**
```typescript
// CRITICAL: Warn if phone is missing (Zinc may reject)
const finalPhoneNumber = shippingAddress.phone || shopperPhone || '';
if (!finalPhoneNumber) {
  console.warn(`⚠️ [PHONE] No phone number for order ${orderId} - Zinc may reject for carrier notifications`);
  // Log to orders table for admin visibility
  await supabase.from('orders').update({
    notes: (order.notes ? order.notes + ' | ' : '') + 'Warning: No phone number provided - may affect delivery notifications'
  }).eq('id', orderId);
}
```

---

## Data Flow After Fix

```text
Sender schedules gift for Charles Meeks
    ↓
create-checkout-session stores recipient_id in Stripe metadata
    ↓
stripe-webhook-v2 receives checkout.session.completed
    ↓
fetchRecipientAddresses(recipientIds):
    ├── Fetches user_connections + JOIN profiles
    ├── Priority 1: Use profiles.shipping_address (with phone!) ✅
    └── Priority 2: Fall back to pending_shipping_address
    ↓
Order created with shipping_address.phone populated
    ↓
process-order-v2 builds Zinc request with phone_number ✅
    ↓
Zinc/Amazon delivery notification works
```

---

## Files Modified

| File | Change |
|------|--------|
| `supabase/functions/stripe-webhook-v2/index.ts` | Join to profiles table in `fetchRecipientAddresses`, prioritize profile address with phone |
| `supabase/functions/process-order-v2/index.ts` | Add validation warning for missing phone |

---

## Future Enhancement: Profile Phone Collection

For new users, ensure phone is collected during address setup. The `UnifiedShippingForm` already validates phone (line 101), but we should ensure it's saved to `profiles.shipping_address.phone`:

**File: `src/services/addressService.ts`** - Ensure phone is included when saving profile address

This is a minor enhancement and can be done as a follow-up after confirming the core fix works.

---

## Testing Plan

After implementation:

1. Run the SQL updates to add phone numbers to existing profiles
2. Retry the Charles Meeks order (Ruidoso)
3. Verify Zinc request includes populated `phone_number`
4. Confirm order succeeds

---

## Summary

- **No sender burden**: Phone comes from recipient's own profile
- **Single source of truth**: Profile shipping address is authoritative for established connections
- **Fallback preserved**: Sender-provided data still works for pending invitations
- **Minimal code change**: ~25 lines added to webhook, ~10 lines to order processor
