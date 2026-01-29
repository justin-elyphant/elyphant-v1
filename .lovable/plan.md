

# Privacy Enhancement: Recipient Address Display

## Overview

Update the Order Confirmation and Order Detail pages to display only **City & State** for gift recipients, protecting their full street address from being visible to the sender post-purchase.

**Rationale:** The sender doesn't need to see the recipient's full street address after checkout - they just need confirmation the gift is going to the right person and general location. The full address is stored securely for fulfillment purposes only.

---

## Visual Outcome

| Before | After |
|--------|-------|
| Charles Meeks | Charles Meeks |
| 402 College Dr | Ruidoso, NM |
| Ruidoso, NM 88345-9102 | United States |
| United States | |

---

## Implementation

### 1. Update `OrderConfirmation.tsx`

For scheduled/gift orders, show abbreviated address:

```
Delivery Address
Charles Meeks
Ruidoso, NM
United States
```

Add a reassuring tooltip: "Full delivery address is securely stored for shipping."

### 2. Update `OrderDetail.tsx`

Apply same privacy pattern - only show city/state for recipient addresses.

### 3. Update `ShippingInfoCard.tsx`

Add `showFullAddress` prop that defaults to:
- `false` for gift recipients (when `isGiftRecipient` is true)
- `true` for sender's own orders

### 4. Reuse Existing Component Pattern

The `RecipientAddressDisplay.tsx` component already has `showFullAddress` prop - we'll leverage this pattern consistently across all order display pages.

---

## Technical Approach

### A. OrderConfirmation.tsx Changes

In the scheduled gift address card:

```tsx
{isScheduledGift && recipientShipping ? (
  <div className="text-sm">
    <p className="font-medium">{recipientShipping.name}</p>
    {/* Privacy: Only show city/state for recipients */}
    <p>{recipientShipping.city}, {recipientShipping.state}</p>
    <p>{recipientShipping.country || 'United States'}</p>
    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
      <Lock className="h-3 w-3" />
      Full address securely stored for delivery
    </p>
  </div>
) : (
  // Full address for sender's own orders
)}
```

### B. ShippingInfoCard.tsx Changes

Add privacy-aware rendering:

```tsx
const isRecipientOrder = isGiftRecipient || (order as any).isScheduledGift;

// In the render:
{isRecipientOrder ? (
  <>
    <p className="font-medium">{recipientName}</p>
    <p>{shippingAddress.city}, {shippingAddress.state}</p>
    <p>{shippingAddress.country || 'United States'}</p>
  </>
) : (
  // Show full address for non-gift orders
)}
```

### C. OrderDetail.tsx Changes

Pass the `isScheduledGift` flag to ShippingInfoCard so it can apply privacy logic.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/OrderConfirmation.tsx` | Abbreviated address for scheduled gifts |
| `src/pages/OrderDetail.tsx` | Pass `isScheduledGift` to ShippingInfoCard |
| `src/components/orders/ShippingInfoCard.tsx` | Add privacy-aware rendering for gift recipients |

---

## Security Note

This is a **display-only** privacy measure. The full address remains stored in:
- `line_items.items[].recipient_shipping` (for fulfillment)
- Order metadata sent to Zinc API (for actual delivery)

The change simply hides street-level detail from the sender's view in the UI.

