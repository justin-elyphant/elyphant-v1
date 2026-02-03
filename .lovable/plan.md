
# Recipient Address Privacy on Checkout Page

## Problem Statement

When scheduling a gift for a connection (e.g., Justin Meeks), the checkout page displays the full street address, city, state, and ZIP code. This violates the established platform privacy standard where **recipient addresses should only show city and state** to protect their privacy.

**Current Behavior (Screenshot):**
```
Justin Meeks ✓
309 Solana Hills Drive
Solana Beach, CA 92075
```

**Expected Behavior:**
```
Justin Meeks ✓
Solana Beach, CA
🔒 Full address securely stored for delivery
```

## Architectural Context

The project already has this privacy pattern implemented in two places:

1. **Order Confirmation Page** (`src/pages/OrderConfirmation.tsx`, lines 710-722): Correctly shows only city/state with a Lock icon and privacy message for scheduled gifts.

2. **Wishlist Purchase Banner** (`src/components/checkout/CheckoutShippingReview.tsx`, lines 143-146): Shows "🔒 Their full address is kept private for security" for wishlist purchases.

The issue is that `CheckoutShippingReview.tsx` lines 236-252 still displays full addresses for non-wishlist gift recipients when `isPrivateAddress` is not explicitly set.

## Root Cause

The `isPrivateAddress` flag is only set to `true` for pending invitations (Cart.tsx line 162):
```typescript
isPrivateAddress: recipient.status === 'pending_invitation' || recipient.source === 'pending'
```

For **accepted connections** (like Justin), this flag is `false`, causing the full address to display.

## Solution: Apply Privacy to All Gift Recipients

Instead of relying on the `isPrivateAddress` flag, we should **always hide full addresses for gift recipients** and only show city/state. This aligns with the established "City & State Only (Always)" privacy standard documented in project memory.

---

## Technical Implementation

### File 1: `src/components/checkout/CheckoutShippingReview.tsx`

**Change:** Modify the delivery group address display (lines 236-252) to **always show the privacy-protected view** for gift recipients, matching the Order Confirmation pattern.

**Before (lines 236-252):**
- Shows full address including street and ZIP code
- Only uses privacy view when `isPrivateAddress` is true

**After:**
- Always shows only city/state for gift recipients
- Adds Lock icon with privacy message
- Keeps the edit button functional (shopper can still modify address via QuickEditModal if needed)

**UI Layout:**
```
[Recipient Name] [Verification Badge]
[City], [State]
🔒 Full address securely stored for delivery  [Edit Icon]
```

### Why Keep the Edit Button?

The QuickEditModal should remain functional because:
1. Sometimes shoppers need to correct a recipient's address
2. The address is still stored and sent to fulfillment
3. Privacy is about display, not data access for the sender

---

## Files Modified

| File | Change |
|------|--------|
| `src/components/checkout/CheckoutShippingReview.tsx` | Update lines 236-252 to always show city/state only for gift recipients, add Lock icon with privacy message |

## Testing Recommendations

After implementation:
1. Schedule a gift for a connection (e.g., Justin Meeks)
2. Proceed to checkout
3. Verify only city/state displays (not street/ZIP)
4. Verify Lock icon and "Full address securely stored" message appears
5. Test the Edit button still opens QuickEditModal with full address fields
6. Verify the address still flows correctly to payment/fulfillment
