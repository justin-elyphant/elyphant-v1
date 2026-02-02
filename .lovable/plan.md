
# Fix: Add Email Notifications to Auto-Gift Approval Flow

## Problem Summary
After Charles approved Justin's auto-gift order and payment was processed via Stripe, no emails were sent to either:
- **Charles (shopper)**: Should receive order confirmation
- **Justin (recipient)**: Should receive "gift coming your way" notification

## Root Cause
The `approve-auto-gift` function processes payments off-session (direct Stripe PaymentIntent), which bypasses the Stripe webhook (`stripe-webhook-v2`) that normally triggers emails. The function creates in-app notifications but never invokes the `ecommerce-email-orchestrator`.

## Solution Architecture
Add email orchestrator calls directly in the `approve-auto-gift` function after successful off-session payment, following the single-source-of-truth pattern.

```text
+----------------------------------+
|     approve-auto-gift            |
|    (off-session payment)         |
+----------------------------------+
              |
              v
    Payment Succeeded?
              |
    +--------+--------+
    |                 |
    v                 v
 [Order Created]  [Emails Triggered]
    |                 |
    v                 +-------+-------+
 [In-app notification]        |       |
                              v       v
                    order_confirmation   gift_coming_your_way
                    (to Charles)         (to Justin)
```

---

## Implementation Plan

### File: `supabase/functions/approve-auto-gift/index.ts`

**Location**: After successful off-session payment and order creation (around line 442)

**Change 1**: Send order confirmation to shopper (Charles)
```typescript
// After: console.log('✅ Off-session auto-gift approval completed successfully');

// Email 1: Order confirmation to shopper
try {
  console.log('📧 Sending order confirmation to shopper...');
  await supabase.functions.invoke('ecommerce-email-orchestrator', {
    body: {
      eventType: 'order_confirmation',
      orderId: newOrder.id,
      // Let orchestrator fetch full order details from DB
    }
  });
  console.log('✅ Order confirmation email triggered');
} catch (emailErr: any) {
  console.error('⚠️ Failed to send order confirmation:', emailErr.message);
  // Non-blocking - don't fail the approval for email issues
}
```

**Change 2**: Send gift notification to recipient (Justin)
```typescript
// Email 2: Gift notification to recipient
const recipientUserId = rule?.recipient_user_id;
if (recipientUserId && recipientUserId !== userId) {
  try {
    console.log('📧 Sending gift notification to recipient...');
    
    // Get recipient profile for email
    const { data: recipientProfile } = await supabase
      .from('profiles')
      .select('email, name')
      .eq('id', recipientUserId)
      .single();
    
    // Get sender (shopper) profile for name
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', userId)
      .single();
    
    if (recipientProfile?.email) {
      await supabase.functions.invoke('ecommerce-email-orchestrator', {
        body: {
          eventType: 'gift_coming_your_way',
          recipientEmail: recipientProfile.email,
          data: {
            recipient_name: recipientProfile.name,
            sender_name: senderProfile?.name?.split(' ')[0] || 'Someone special',
            arrival_date: execution.execution_date,
            occasion: rule?.date_type,
          }
        }
      });
      console.log(`✅ Gift notification sent to recipient: ${recipientProfile.email}`);
    }
  } catch (emailErr: any) {
    console.error('⚠️ Failed to send gift notification to recipient:', emailErr.message);
  }
}
```

---

## Data Flow

### Order Confirmation Email (to Shopper)
The orchestrator will fetch complete order details from the database using the `orderId`:
- Customer name (from `profiles.name` via `order.user_id`)
- Order number
- Line items with images and prices
- Pricing breakdown (subtotal, shipping, gifting fee)
- Scheduled delivery date (for auto-gifts)

### Gift Notification Email (to Recipient)
Sent directly with data since no order lookup needed for recipient:
- Recipient's first name
- Sender's first name
- Arrival date (execution_date)
- Occasion (birthday, anniversary, etc.)
- Content is deliberately vague to maintain the surprise

---

## Technical Notes

1. **Non-Blocking Emails**: Email failures are logged but don't fail the approval flow. The order is already created and payment processed - emails are best-effort.

2. **Self-Purchase Check**: The recipient notification includes a guard (`recipientUserId !== userId`) to prevent sending "gift coming your way" if someone is buying for themselves.

3. **First Name Extraction**: Sender name is split to extract first name only for a personal touch ("Charles sent you a gift" not "Charles Meeks sent you a gift").

4. **Follows Single Source of Truth**: This establishes `approve-auto-gift` as the email trigger source for off-session auto-gift payments, consistent with `stripe-webhook-v2` being the trigger for checkout-based orders.

---

## Verification After Deployment

1. Re-run the scheduler with simulated date `2026-02-16`
2. Check `process-email-queue` logs for queued emails
3. Verify Charles receives order confirmation
4. Verify Justin receives "gift coming your way" notification

## Summary of Changes

| File | Change |
|------|--------|
| `approve-auto-gift/index.ts` | Add email orchestrator calls for order confirmation (shopper) and gift notification (recipient) |
