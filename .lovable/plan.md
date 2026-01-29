
# Investigation Summary & Fix Plan: Scheduled Gift Order Confirmation Display

## Summary of Findings

### Issue 1: "No Stripe Activity"
**This is expected behavior.** Your order `ORD-20260129-5114` used **Stripe Setup Mode** (deferred payment) because the delivery date (Feb 12) is 15 days away.

**How Setup Mode works:**
- No charge appears in Stripe yet (only a SetupIntent to save the card)
- Payment authorization happens at T-7 (Feb 5) via `scheduled-order-processor`
- Payment capture happens at T-7, Zinc submission at T-3

**Evidence from logs:**
```
[DEFERRED] Creating pending_payment order for session: cs_live_c1PBF...
[DEFERRED] Scheduled delivery: 2026-02-12 | Will authorize at T-7
[DEFERRED] Pending payment order created: ORD-20260129-5114
```

### Issue 2: Order Confirmation Page Problems

The current page is missing three key features for scheduled gifts:

| Problem | Current State | Expected State |
|---------|---------------|----------------|
| **Shipping Address** | Shows sender (Justin Meeks, Solana Beach) | Should show recipient (Charles Meeks, Ruidoso) |
| **Scheduled Gift UI** | No indication it's scheduled | Should show "Scheduled for Feb 12" with recipient's name |
| **Status Explanation** | Just shows "PENDING PAYMENT" badge | Should explain payment will process later |

**Data proof - the recipient info IS in the order:**
```json
{
  "line_items.items[0]": {
    "recipient_name": "Charles Meeks",
    "recipient_shipping": {
      "city": "Ruidoso",
      "address": "402 College Dr",
      "phone": "5759375526"
    },
    "gift_message": "Test gift from Elyphant"
  },
  "scheduled_delivery_date": "2026-02-12"
}
```

---

## Fix Plan

### Part A: Add Scheduled Gift Detection Logic

Detect scheduled gifts using this criteria:
- Order has `scheduled_delivery_date` in the future OR
- Order status is `pending_payment` OR `scheduled`

Extract recipient info from:
1. `line_items.items[0].recipient_name` (primary)
2. `line_items.items[0].recipient_shipping` (for address display)

### Part B: Add Scheduled Gift Hero Card

New UI component showing:
- 🎁 "Gift Scheduled for [Recipient]!"
- Delivery date in human-readable format ("Arrives on or before Feb 12, 2026")
- Gift message preview
- Explanation: "Your payment will be processed 7 days before delivery"

### Part C: Show Correct Shipping Address

For scheduled gifts, display recipient's shipping address from `line_items` instead of sender's fallback address.

### Part D: Improve Pending Payment Status Display

Replace generic "PENDING PAYMENT" badge with contextual messaging:
- Show calendar icon + "Scheduled Delivery"
- Add tooltip: "Card saved, payment processes 7 days before arrival"

---

## Technical Implementation

### File: `src/pages/OrderConfirmation.tsx`

**Change 1: Add scheduled gift detection (near line 430)**
```typescript
// Detect scheduled gifts (in addition to wishlist detection)
const isScheduledGift = !!(
  order?.scheduled_delivery_date && 
  new Date(order.scheduled_delivery_date) > new Date()
);

// Extract recipient info from line_items
const lineItems = order?.line_items?.items || [];
const firstItem = lineItems[0] || {};
const recipientName = firstItem.recipient_name || order?.recipient_name;
const recipientShipping = firstItem.recipient_shipping;
const giftMessage = firstItem.gift_message || order?.gift_options?.giftMessage;
```

**Change 2: Add Scheduled Gift Hero Card (after wishlist hero)**
```typescript
{isScheduledGift && recipientName && (
  <div className="mb-6 p-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl text-white text-center">
    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
      <Gift className="h-8 w-8 text-white" />
    </div>
    <h2 className="text-2xl font-bold mb-2">
      🎁 Gift Scheduled for {recipientName}!
    </h2>
    <p className="text-white/90 mb-2">
      Arrives on or before {format(new Date(order.scheduled_delivery_date), 'MMMM d, yyyy')}
    </p>
    {giftMessage && (
      <p className="text-sm italic text-white/80">"{giftMessage}"</p>
    )}
    <div className="mt-4 text-sm bg-white/20 rounded-lg p-3">
      💳 Your card has been saved. Payment will process 7 days before delivery.
    </div>
  </div>
)}
```

**Change 3: Show recipient shipping for scheduled gifts**
```typescript
{/* Shipping Address - Use recipient address for scheduled gifts */}
{!isMultiRecipient && (isScheduledGift ? recipientShipping : order.shipping_address) && (
  <Card className="p-6 mb-6">
    <h2 className="text-xl font-semibold mb-4">
      {isScheduledGift ? 'Delivery Address' : 'Shipping Address'}
    </h2>
    {isScheduledGift && recipientShipping ? (
      <div className="text-sm">
        <p className="font-medium">{recipientShipping.name}</p>
        <p>{recipientShipping.address || recipientShipping.address_line1}</p>
        {recipientShipping.addressLine2 && <p>{recipientShipping.addressLine2}</p>}
        <p>
          {recipientShipping.city}, {recipientShipping.state} {recipientShipping.zipCode || recipientShipping.postal_code}
        </p>
        <p>{recipientShipping.country || 'United States'}</p>
      </div>
    ) : (
      // Existing sender address rendering
    )}
  </Card>
)}
```

**Change 4: Improve pending_payment status badge**
```typescript
const getStatusBadge = (status: string) => {
  // Special handling for pending_payment (scheduled gifts)
  if (status === 'pending_payment') {
    return (
      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
        <Clock className="w-3 h-3 mr-1" />
        SCHEDULED DELIVERY
      </Badge>
    );
  }
  // ... existing switch statement
};
```

---

## Also Fix: gift_options.isGift Should Be True

### File: `supabase/functions/stripe-webhook-v2/index.ts`

In `handleDeferredPaymentOrder` (around line 931), the `isGift` detection should also check for recipient presence:

```typescript
gift_options: {
  isGift: !!metadata.gift_message || isAutoGift || transformedLineItems.some(item => item.recipient_id),
  // ...
}
```

---

## Summary

| Component | Change |
|-----------|--------|
| OrderConfirmation.tsx | Add scheduled gift detection + hero card + recipient address display |
| stripe-webhook-v2 | Fix isGift detection for deferred payment orders |
| UI | Replace "PENDING PAYMENT" with "SCHEDULED DELIVERY" badge |

This will make scheduled gifts show correctly on the confirmation page with the recipient's address, delivery date, and clear explanation of the payment timing.
