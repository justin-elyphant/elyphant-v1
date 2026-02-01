
# Complete Recurring Gift Email & Wishlist Badge Implementation Plan

## Problem Summary

Three critical gaps exist in the recurring gift notification and tracking system:

1. **No Rule Creation Confirmation Email** - When a shopper (Charles) creates a recurring gift rule for a recipient (Justin), no email is sent confirming the setup
2. **No Recipient Gift Purchased Notification** - When a gift is actually purchased, the recipient (Justin) receives no notification that a gift is on its way
3. **Wishlist "Purchased" Badge Not Working for Auto-Gifts** - The `auto-gift-orchestrator` doesn't pass `wishlist_id` and `wishlist_item_id` to the checkout session, so items purchased via recurring gifts don't get marked as "Purchased" on the recipient's wishlist

## Solution Architecture

### Part 1: Rule Creation Confirmation Email (Shopper Notification)

**New Email Type**: `recurring_gift_rule_created`

**Trigger Point**: `UnifiedGiftManagementService.createBatchRulesForRecipient()` (after successful batch creation)

**Data Required**:
- Shopper's first name and email
- Recipient's name
- List of configured events (Birthday, Valentine's Day, etc.) with dates
- Budget per event
- Auto-approve status

**Files to Modify**:

1. **`supabase/functions/ecommerce-email-orchestrator/index.ts`**
   - Add new template function `recurringGiftRuleCreatedTemplate()`
   - Add case `'recurring_gift_rule_created'` to `getEmailTemplate()` router
   - Template content: "You've set up recurring gifts for [Recipient]! Events: Birthday (Feb 19), Valentine's Day (Feb 14)..."

2. **`src/services/UnifiedGiftManagementService.ts`**
   - After `createBatchRulesForRecipient()` completes successfully (around line 808)
   - Invoke email orchestrator with `eventType: 'recurring_gift_rule_created'`

---

### Part 2: Gift Purchased Recipient Notification

**New Email Type**: `gift_coming_your_way`

**Trigger Point**: `supabase/functions/stripe-webhook-v2/index.ts` - after order creation, when `is_auto_gift === true` OR when a gift is detected (has `recipient_id`)

**Data Required**:
- Recipient's first name and email
- Shopper's first name (the gift sender)
- Estimated arrival date
- Occasion (if auto-gift) - "Valentine's Day", "Birthday", etc.
- **NOT included**: Product details (surprise gift!)

**Files to Modify**:

1. **`supabase/functions/ecommerce-email-orchestrator/index.ts`**
   - Add new template function `giftComingYourWayTemplate()`
   - Add case `'gift_coming_your_way'` to `getEmailTemplate()` router
   - Template content: "Hey Justin! Charles just purchased a gift for you. It should arrive around February 14th. 🎁"

2. **`supabase/functions/stripe-webhook-v2/index.ts`**
   - After order creation (around line 608, after `triggerEmailOrchestrator`)
   - Check if order has `recipient_id` and recipient is a different user
   - Fetch recipient email from `profiles` table
   - Invoke email orchestrator with `eventType: 'gift_coming_your_way'`

---

### Part 3: Wishlist "Purchased" Badge for Auto-Gifts

**Problem**: The `auto-gift-orchestrator` fetches wishlist items but doesn't include `wishlist_id` and `wishlist_item_id` in the checkout session metadata. The webhook (stripe-webhook-v2) has the logic to track purchases (line 584-604) but never receives the wishlist IDs.

**Solution**: Pass wishlist tracking metadata through the checkout session.

**Files to Modify**:

1. **`supabase/functions/auto-gift-orchestrator/index.ts`** (lines 214-232)
   - When fetching wishlist item, capture `wishlist.id` and `item.id`
   - Pass these in the `cartItems` array to `create-checkout-session`:
   ```typescript
   cartItems: [{
     product_id: giftItem.product_id,
     product_name: giftName,
     quantity: 1,
     price: giftItem.price,
     image_url: giftItem.image_url,
     wishlist_id: giftItem.wishlist_id,      // NEW
     wishlist_item_id: giftItem.wishlist_item_id,  // NEW
   }]
   ```

2. **`supabase/functions/create-checkout-session/index.ts`** (verify it passes these fields to Stripe product metadata)
   - Confirm `wishlist_id` and `wishlist_item_id` are written to `product.metadata` for the line item

3. **`supabase/functions/stripe-webhook-v2/index.ts`** (already implemented at line 584-604)
   - No changes needed - existing logic will automatically track purchases if the IDs are present

---

## Implementation Details

### Email Template: `recurring_gift_rule_created`

```typescript
const recurringGiftRuleCreatedTemplate = (props: any): string => {
  const firstName = getFirstName(props.shopper_name);
  
  const eventsHtml = props.events.map((event: any) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
        <span style="font-size: 20px; margin-right: 8px;">${event.icon || '🎁'}</span>
        <strong>${event.name}</strong>
        <span style="color: #666; margin-left: 8px;">${event.date}</span>
      </td>
    </tr>
  `).join('');

  const content = `
    <h2>Recurring Gifts Set Up! 🔄</h2>
    <p>Hi ${firstName}, you've successfully configured recurring gifts for <strong>${props.recipient_name}</strong>.</p>
    
    <h3>Configured Events:</h3>
    <table>${eventsHtml}</table>
    
    <div style="background: #faf5ff; padding: 16px; border-radius: 8px; margin: 24px 0;">
      <p><strong>Budget per gift:</strong> $${props.budget}</p>
      <p><strong>Auto-approve:</strong> ${props.auto_approve ? 'Enabled (gifts under $75)' : 'Disabled (you\'ll get approval emails)'}</p>
    </div>
    
    <p>We'll notify you ${props.notification_days} days before each event so you can approve or skip the gift.</p>
    
    <a href="https://elyphant.ai/recurring-gifts">Manage Recurring Gifts</a>
  `;
  
  return baseEmailTemplate({ content, preheader: `Recurring gifts configured for ${props.recipient_name}` });
};
```

### Email Template: `gift_coming_your_way`

```typescript
const giftComingYourWayTemplate = (props: any): string => {
  const firstName = getFirstName(props.recipient_name);
  
  const content = `
    <h2>A Gift Is On Its Way! 🎁</h2>
    <p>Hey ${firstName}, exciting news!</p>
    
    <p><strong>${props.sender_name}</strong> just sent you a gift${props.occasion ? ` for ${props.occasion}` : ''}!</p>
    
    <div style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); padding: 24px; border-radius: 8px; margin: 24px 0; text-align: center;">
      <p style="font-size: 14px; color: #666; margin-bottom: 8px;">Expected Arrival</p>
      <p style="font-size: 24px; font-weight: 700; color: #1a1a1a;">${props.arrival_date}</p>
    </div>
    
    <p style="color: #666; font-style: italic;">We're keeping the details a surprise! 🤫</p>
    
    <a href="https://elyphant.ai/gifting">View Your Gifts</a>
  `;
  
  return baseEmailTemplate({ content, preheader: `${props.sender_name} sent you a gift!` });
};
```

### Auto-Gift Orchestrator Update (Wishlist Tracking)

```typescript
// Around line 220-232 in auto-gift-orchestrator/index.ts
if (wishlist?.id) {
  const { data: items } = await supabase
    .from('wishlist_items')
    .select('*, id as wishlist_item_id')  // Capture item ID
    .eq('wishlist_id', wishlist.id)
    .lte('price', rule.budget_limit || 9999)
    .order('price', { ascending: false })
    .limit(1);
  
  if (items?.[0]) {
    giftItem = {
      ...items[0],
      wishlist_id: wishlist.id,           // Store wishlist ID
      wishlist_item_id: items[0].id,      // Store item ID
    };
  }
}
```

Then in the checkout session creation (line 296):
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

---

## Data Flow Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    RECURRING GIFT FLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. RULE CREATION (Shopper creates rule)                        │
│     AutoGiftSetupFlow → UnifiedGiftManagementService             │
│           ↓                                                      │
│     createBatchRulesForRecipient() → DB Insert                   │
│           ↓                                                      │
│     📧 EMAIL: "recurring_gift_rule_created" → Shopper            │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  2. T-7 NOTIFICATION (7 days before event)                       │
│     auto-gift-orchestrator (cron)                                │
│           ↓                                                      │
│     📧 EMAIL: "auto_gift_approval" → Shopper (existing)          │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  3. T-4 PURCHASE (4 days before event)                           │
│     auto-gift-orchestrator → create-checkout-session             │
│           ↓ (includes wishlist_id, wishlist_item_id)             │
│     stripe-webhook-v2 → Creates order                            │
│           ↓                                                      │
│     📧 EMAIL: "order_confirmation" → Shopper (existing)          │
│     📧 EMAIL: "gift_coming_your_way" → Recipient (NEW)           │
│           ↓                                                      │
│     wishlist_item_purchases INSERT (badge appears)               │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  4. T-3 FULFILLMENT                                              │
│     scheduled-order-processor → Zinc                             │
│           ↓                                                      │
│     📧 EMAIL: "order_shipped" → Shopper (existing)               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Files to Modify (Complete List)

| File | Changes |
|------|---------|
| `supabase/functions/ecommerce-email-orchestrator/index.ts` | Add 2 new templates + router cases |
| `src/services/UnifiedGiftManagementService.ts` | Trigger rule confirmation email after batch creation |
| `supabase/functions/auto-gift-orchestrator/index.ts` | Pass wishlist IDs through checkout session |
| `supabase/functions/stripe-webhook-v2/index.ts` | Send recipient notification email for gift orders |

---

## Edge Cases Handled

1. **Self-purchases** - Don't send "gift coming" email if recipient_id === user_id
2. **No wishlist item** - If AI/product-search is used instead of wishlist, no badge needed (no wishlist context)
3. **Fallback recipient email** - If recipient has no profile, use `pending_recipient_email` from connection
4. **Occasion formatting** - Transform `valentine` → "Valentine's Day", `birthday` → "their Birthday"

---

## Testing Checklist

- [ ] Create recurring gift rule → Verify shopper receives confirmation email
- [ ] Trigger T-4 orchestrator with simulated date → Verify recipient receives "gift coming" email
- [ ] Trigger auto-gift from wishlist item → Verify "Purchased ✓" badge appears on wishlist
- [ ] Trigger auto-gift from AI/search fallback → Confirm no error (graceful no-op for badge)
- [ ] Manual scheduled gift purchase → Verify recipient notification still works
