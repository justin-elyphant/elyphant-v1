

## Fix "Purchased" Badge for Recurring Gift Items

### Problem Summary
When a recurring gift is purchased from a recipient's wishlist, the purchased badge doesn't appear on the wishlist because the `wishlist_item_purchases` table is never populated for auto-gift orders.

### Root Cause Analysis (3 Missing Links)

**Link 1: T-7 Notification Stage**
In `auto-gift-orchestrator/index.ts` (lines 128-141), when building the `suggestedProducts` array from wishlist items, the `wishlist_id` and the wishlist item's database `id` are not captured:

```text
Current: { product_id, name, price, image_url }
Missing: { wishlist_id, wishlist_item_id (the item's DB id) }
```

**Link 2: Approval Flow**
In `approve-auto-gift/index.ts` (lines 352-359), when creating the order's `line_items`, these tracking fields aren't passed through.

**Link 3: Purchase Tracking Insert**
The `approve-auto-gift` function creates orders directly but doesn't insert into `wishlist_item_purchases` like `stripe-webhook-v2` does (lines 584-604).

### Solution: 2-Part Fix

---

**Part 1: Capture Wishlist Metadata at T-7**

Update `auto-gift-orchestrator/index.ts` to include tracking fields when building `suggestedProducts`:

```text
File: supabase/functions/auto-gift-orchestrator/index.ts
Location: Lines 128-141 (T-7 wishlist fetch)

Change SELECT to include: id, wishlist_id (already known)

Then map to include:
- wishlist_id: wishlist.id
- wishlist_item_id: item.id  (the wishlist_items table primary key)
```

---

**Part 2: Insert Purchase Record on Approval**

Update `approve-auto-gift/index.ts` to insert into `wishlist_item_purchases` after order creation (similar to `stripe-webhook-v2`):

```text
File: supabase/functions/approve-auto-gift/index.ts
Location: After order creation (~line 388)

For each item in productsToOrder:
  If item has wishlist_id AND wishlist_item_id:
    Insert into wishlist_item_purchases:
      - wishlist_id
      - item_id (= wishlist_item_id)
      - product_id
      - purchaser_user_id (= userId, the shopper)
      - is_anonymous: false
      - order_id
      - quantity: 1
      - price_paid
```

---

### Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/auto-gift-orchestrator/index.ts` | Add `id` to SELECT, include `wishlist_id` and `wishlist_item_id` in suggestedProducts |
| `supabase/functions/approve-auto-gift/index.ts` | Pass through tracking fields to `line_items`, add `wishlist_item_purchases` insert loop |

### Technical Details

**T-7 Orchestrator Change:**
```typescript
// Line 129-134: Update SELECT
.select('id, product_id, name, title, price, image_url')

// Line 136-141: Include in map
suggestedProducts = (wishlistItems || []).map(item => ({
  product_id: item.product_id,
  name: item.name || item.title || 'Gift Item',
  price: item.price,
  image_url: item.image_url,
  wishlist_id: wishlist.id,        // ADD
  wishlist_item_id: item.id,       // ADD
}));
```

**Approve Function Change:**
```typescript
// After line 388 (order created)
for (const p of productsToOrder) {
  if (p.wishlist_id && p.wishlist_item_id) {
    await supabase.from('wishlist_item_purchases').insert({
      wishlist_id: p.wishlist_id,
      item_id: p.wishlist_item_id,
      product_id: p.product_id,
      purchaser_user_id: userId,
      is_anonymous: false,
      order_id: newOrder.id,
      quantity: 1,
      price_paid: p.price,
    });
  }
}
```

### Outcome
After this fix, when Charles approves an auto-gift from Justin's wishlist:
1. The wishlist item's IDs flow through the execution record
2. On approval, `wishlist_item_purchases` gets populated
3. Justin's wishlist immediately shows the "Purchased" badge

### Note on Current Order
The existing order (`7cc03e10-0c00-458a-860a-e937a1850d8f`) was created before this fix. If needed, a manual SQL insert can add the purchase record for Justin's iPhone case.

