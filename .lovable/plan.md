
# Complete Recurring Gift Email & Wishlist Badge Implementation

## Overview
This implementation adds three critical missing features to the recurring gift system:
1. Shopper confirmation email when recurring rules are created
2. Recipient notification email when a gift is purchased for them  
3. Wishlist "Purchased" badge for auto-gift purchases

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/ecommerce-email-orchestrator/index.ts` | Add 2 new email templates + router cases |
| `supabase/functions/auto-gift-orchestrator/index.ts` | Pass wishlist IDs through checkout session |
| `supabase/functions/stripe-webhook-v2/index.ts` | Send recipient notification email for gift orders |

Note: `UnifiedGiftManagementService.ts` already triggers `auto_gift_rule_created` email - we just need the template.

---

## Part 1: Add Email Templates to Orchestrator

### Template 1: `recurring_gift_rule_created`
Email sent to shopper (Charles) when they create recurring gift rules.

Content includes:
- Personalized greeting using first name
- Recipient's name and events configured
- Budget per event
- Auto-approve status
- Link to manage recurring gifts

### Template 2: `gift_coming_your_way`
Email sent to recipient (Justin) when a gift is purchased for them.

Content includes:
- Personalized greeting using first name
- Sender's first name (who sent the gift)
- Estimated arrival date
- Occasion (if auto-gift: "Valentine's Day", "Birthday")
- No product details (keep it a surprise!)

### Router Updates
Add both templates to the `getEmailTemplate()` switch statement.

---

## Part 2: Pass Wishlist Metadata in Auto-Gift Orchestrator

### Current Gap
Lines 223-232 in `auto-gift-orchestrator/index.ts` fetch wishlist items but don't capture:
- `wishlist.id` (the wishlist containing the item)
- `item.id` (the wishlist item ID)

### Fix
When fetching the best wishlist item within budget, capture both IDs:
```typescript
if (wishlist?.id) {
  const { data: items } = await supabase
    .from('wishlist_items')
    .select('*')
    .eq('wishlist_id', wishlist.id)
    .lte('price', rule.budget_limit || 9999)
    .order('price', { ascending: false })
    .limit(1);
  
  if (items?.[0]) {
    giftItem = {
      ...items[0],
      wishlist_id: wishlist.id,         // NEW: Capture wishlist ID
      wishlist_item_id: items[0].id,    // NEW: Capture item ID
    };
  }
}
```

Then in checkout session creation (line 296):
```typescript
cartItems: [{
  product_id: giftItem.product_id,
  product_name: giftName,
  quantity: 1,
  price: giftItem.price,
  image_url: giftItem.image_url,
  wishlist_id: giftItem.wishlist_id || null,      // NEW
  wishlist_item_id: giftItem.wishlist_item_id || null,  // NEW
}],
```

The existing logic in `create-checkout-session` (lines 180-181) and `stripe-webhook-v2` (lines 583-604) will automatically flow these through to the `wishlist_item_purchases` table.

---

## Part 3: Add Recipient Notification in stripe-webhook-v2

### Trigger Point
After order creation in `handleCheckoutSessionCompleted()`, when:
- Order has a `recipient_id` that differs from `user_id` (shopper)
- Order is a gift (has `isGift: true` or `is_auto_gift`)

### Implementation
After line 608 (`await triggerEmailOrchestrator(...)` - shopper email), add:

```typescript
// Send recipient notification for gift orders
if (recipientId && recipientId !== userId) {
  await sendRecipientGiftNotification(
    recipientId, 
    newOrder.id, 
    userId, 
    scheduledDate, 
    isAutoGift ? metadata.occasion : null,
    supabase
  );
}
```

New helper function fetches recipient email from `profiles` table and invokes email orchestrator with `gift_coming_your_way` event type.

---

## Email Template Details

### `recurring_gift_rule_created` Template

```
Subject: Recurring Gifts Set Up for {recipient_name}! 🔄

Hi {firstName},

You've successfully configured recurring gifts for {recipient_name}.

Configured Events:
🎂 Birthday - Feb 19
❤️ Valentine's Day - Feb 14
🎄 Christmas - Dec 25

Budget: Up to ${budget} per gift
Auto-approve: {Enabled/Disabled} - {explanation}

We'll notify you 7 days before each event with gift suggestions.

[Manage Recurring Gifts Button]
```

### `gift_coming_your_way` Template

```
Subject: {sender_name} sent you a gift! 🎁

Hey {firstName}, exciting news!

{sender_name} just sent you a gift{for occasion}!

┌─────────────────────────┐
│   Expected Arrival      │
│   February 14, 2026     │
└─────────────────────────┘

We're keeping the details a surprise! 🤫

[View Your Gifts Button]
```

---

## Data Flow Summary

```
RULE CREATION:
AutoGiftSetupFlow → UnifiedGiftManagementService.createRule()
     ↓
📧 EMAIL: "recurring_gift_rule_created" → Shopper (already triggered, template added)

T-4 PURCHASE:
auto-gift-orchestrator → create-checkout-session (now includes wishlist_id, wishlist_item_id)
     ↓
stripe-webhook-v2 → Creates order
     ↓
📧 EMAIL: "order_confirmation" → Shopper (existing)
📧 EMAIL: "gift_coming_your_way" → Recipient (NEW)
     ↓
wishlist_item_purchases INSERT (badge appears) ✓
```

---

## Testing Checklist

- [ ] Create recurring gift rule → Verify shopper receives confirmation email
- [ ] Trigger T-4 orchestrator → Verify checkout session includes `wishlist_id` and `wishlist_item_id`
- [ ] Complete checkout for gift order → Verify recipient receives "gift coming" email
- [ ] Verify "Purchased" badge appears on recipient's wishlist for auto-gifted items
- [ ] Edge case: Self-purchase (recipient_id === user_id) → No duplicate email sent
- [ ] Edge case: AI/search fallback (no wishlist item) → Graceful handling (no badge needed)

---

## Technical Notes

### Occasion Formatting Helper
Transform date_type to display-friendly text:
- `birthday` → "their Birthday"
- `valentine` → "Valentine's Day"
- `christmas` → "Christmas"
- `mothers_day` → "Mother's Day"

### Edge Cases Handled
1. **Self-purchases**: Don't send "gift coming" if recipient_id === user_id
2. **No wishlist item**: If AI/search fallback is used, wishlist_id will be null - no badge (correct behavior)
3. **Pending invitations**: Recipient email comes from `pending_recipient_email` if not yet a user
4. **No recipient profile**: Skip recipient notification gracefully with warning log
