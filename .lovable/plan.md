

# Enhanced Scheduled Order Email - Rich Context

## Overview

Upgrade the `order_pending_payment` email template to match the rich detail level of `order_confirmation`, providing shoppers with product images, itemized pricing, personalized greeting using their first name, and gift context.

---

## Current State

The `orderPendingPaymentTemplate` currently shows:
- Generic greeting ("Hi there")
- Order number
- Total amount
- Scheduled date
- Payment notice

**Missing:**
- Product images
- Product names with quantity/price
- First name personalization  
- Pricing breakdown (subtotal, shipping, tax, gifting fee)
- Gift message display
- Recipient information for gifts

---

## Changes Required

### 1. Enhance `orderPendingPaymentTemplate` (ecommerce-email-orchestrator)

Transform the simple template to match the `orderConfirmationTemplate` structure:

**Add Product Items Display:**
```text
┌─────────────────────────────────────────────────┐
│ [IMAGE] Callaway Golf Supersoft Golf Balls      │
│         Qty: 1 × $26.97                         │
├─────────────────────────────────────────────────┤
│ [IMAGE] Another Product                         │
│         Qty: 2 × $15.00                         │
└─────────────────────────────────────────────────┘
```

**Add Pricing Breakdown:**
```text
Subtotal:     $56.97
Shipping:     $6.99
Tax:          $4.28
Gifting Fee:  $3.99
─────────────────────
Total:        $72.23
```

**Add Gift Context (if applicable):**
```text
🎁 Gift Message:
"Happy Birthday! Hope you love it!"
```

**Personalized Greeting:**
- Extract first name from full name (e.g., "Justin Meeks" → "Justin")
- Fallback to full name, then "there"

### 2. Update Orchestrator Data Handling

Modify the `order_pending_payment` metadata handler (lines 589-599) to fetch full order details instead of using minimal metadata. This leverages the existing fetch logic (lines 600-653) already in place.

**Current approach (minimal data):**
```typescript
// Line 590-598 - Uses only basic metadata
emailData = {
  customer_name: metadata.customer_name || 'there',
  order_number: metadata.order_number,
  order_id: orderId,
  total_amount: metadata.total_amount || 0,
  scheduled_date: metadata.scheduled_date,
};
```

**New approach (fetch full details):**
- Remove the special-case metadata handling for `order_pending_payment`
- Let it fall through to the existing `orderId`-based fetch logic
- This automatically populates all fields: items, pricing, gift options, etc.

### 3. Update Webhook Caller (stripe-webhook-v2)

Simplify the email trigger call to just pass `orderId` without minimal metadata, allowing the orchestrator to fetch complete data:

```typescript
// Current (lines 966-977):
await supabase.functions.invoke('ecommerce-email-orchestrator', {
  body: {
    eventType: 'order_pending_payment',
    orderId: newOrder.id,
    recipientEmail: metadata.user_email,
    metadata: { ... }  // ← Remove this
  }
});

// New:
await supabase.functions.invoke('ecommerce-email-orchestrator', {
  body: {
    eventType: 'order_pending_payment',
    orderId: newOrder.id,
    recipientEmail: metadata.user_email,
  }
});
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/ecommerce-email-orchestrator/index.ts` | Enhance `orderPendingPaymentTemplate` with product items, pricing breakdown, gift message, first name extraction. Remove minimal metadata handler for `order_pending_payment`. |
| `supabase/functions/stripe-webhook-v2/index.ts` | Remove `metadata` field from email orchestrator call (lines 971-975) |

---

## Technical Details

### First Name Extraction Helper

```typescript
const getFirstName = (fullName: string | null | undefined): string => {
  if (!fullName) return 'there';
  const firstName = fullName.trim().split(' ')[0];
  return firstName || 'there';
};
```

### Template Structure (Enhanced)

The new template will include:

1. **Header**: "Order Scheduled! 📅"
2. **Personalized greeting**: "Hi Justin, your gift has been scheduled..."
3. **Scheduled delivery card**: Blue gradient box with date
4. **Order summary card**: Order number + total
5. **Product items table**: Image, title, qty × price per item
6. **Pricing breakdown table**: Subtotal, shipping, tax, gifting fee, total
7. **Gift message box** (conditional): Green highlight if is_gift && gift_message
8. **Payment notice**: Yellow/amber box explaining T-7 capture
9. **CTA button**: "View Order Details"

---

## Testing

After deployment, test by:
1. Creating a scheduled gift order (8+ days in future)
2. Verify email arrives with:
   - First name greeting
   - Product image and title
   - Full pricing breakdown
   - Gift message (if applicable)
   - Scheduled date and payment notice

---

## Email Preview (Expected)

```text
┌────────────────────────────────────────────────────────────┐
│                    🎁 Elyphant                              │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Order Scheduled! 📅                                       │
│                                                            │
│  Hi Justin, your gift has been scheduled for future        │
│  delivery.                                                 │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 📅 SCHEDULED ARRIVAL                                  │ │
│  │ Saturday, February 15, 2026                          │ │
│  │ Your payment will be processed 7 days before...      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ ORDER NUMBER                                          │ │
│  │ ORD-20260129-0218                                    │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ORDER ITEMS                                               │
│  ┌────────┬─────────────────────────────────────────────┐ │
│  │ [IMG]  │ Callaway Golf Supersoft Golf Balls          │ │
│  │        │ Qty: 1 × $26.97                             │ │
│  └────────┴─────────────────────────────────────────────┘ │
│                                                            │
│  ───────────────────────────────────────────────────────  │
│  Subtotal:                                      $26.97    │
│  Shipping:                                       $6.99    │
│  Tax:                                            $2.78    │
│  Gifting Fee:                                    $3.28    │
│  ───────────────────────────────────────────────────────  │
│  TOTAL:                                         $40.02    │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 🎁 GIFT MESSAGE:                                      │ │
│  │ "Test Gift from Justo"                               │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 💳 Payment Not Yet Charged                           │ │
│  │ Your payment method has been saved securely...       │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│               [ View Order Details ]                       │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

