
# Fix: Exclude Purchased Wishlist Items from Auto-Gift Orchestrator

## Problem Summary

The `auto-gift-orchestrator` currently queries wishlist items **without excluding already-purchased items**. In Justin's test case:

- **Wishlist**: 1 item (iPhone case at $42.74)
- **Purchase Status**: Already purchased ✅
- **Current Behavior**: Orchestrator would suggest/buy the same item again ❌
- **Expected Behavior**: Should detect all items are purchased → fall back to `get-products` search

## Root Cause

Both the **T-7 notification stage** (lines 128-134) and **T-4 payment capture stage** (lines 290-296) query `wishlist_items` without joining/filtering against `wishlist_item_purchases`.

---

## Technical Implementation

### File: `supabase/functions/auto-gift-orchestrator/index.ts`

**Two locations need the same fix:**

### Change 1: T-7 Notification Stage (lines 127-144)

**Before:**
```typescript
const { data: wishlistItems } = await supabase
  .from('wishlist_items')
  .select('id, product_id, name, title, price, image_url')
  .eq('wishlist_id', wishlist.id)
  .lte('price', rule.budget_limit || 9999)
  .order('price', { ascending: false })
  .limit(3);
```

**After:**
```typescript
// First get purchased item IDs
const { data: purchasedItems } = await supabase
  .from('wishlist_item_purchases')
  .select('item_id')
  .eq('wishlist_id', wishlist.id);

const purchasedItemIds = (purchasedItems || []).map(p => p.item_id);

// Query wishlist items excluding purchased ones
let itemsQuery = supabase
  .from('wishlist_items')
  .select('id, product_id, name, title, price, image_url')
  .eq('wishlist_id', wishlist.id)
  .lte('price', rule.budget_limit || 9999)
  .order('price', { ascending: false })
  .limit(3);

// Exclude purchased items if any exist
if (purchasedItemIds.length > 0) {
  itemsQuery = itemsQuery.not('id', 'in', `(${purchasedItemIds.join(',')})`);
}

const { data: wishlistItems } = await itemsQuery;
```

### Change 2: T-4 Payment Capture Stage (lines 289-306)

**Apply same pattern:**
```typescript
// First get purchased item IDs
const { data: purchasedItems } = await supabase
  .from('wishlist_item_purchases')
  .select('item_id')
  .eq('wishlist_id', wishlist.id);

const purchasedItemIds = (purchasedItems || []).map(p => p.item_id);

// Query unpurchased wishlist items
let itemsQuery = supabase
  .from('wishlist_items')
  .select('*')
  .eq('wishlist_id', wishlist.id)
  .lte('price', rule.budget_limit || 9999)
  .order('price', { ascending: false })
  .limit(1);

if (purchasedItemIds.length > 0) {
  itemsQuery = itemsQuery.not('id', 'in', `(${purchasedItemIds.join(',')})`);
}

const { data: items } = await itemsQuery;
```

### Enhanced Logging

Add logging to show when fallback occurs:

```typescript
if (purchasedItemIds.length > 0) {
  console.log(`🔍 Excluding ${purchasedItemIds.length} already-purchased item(s) from wishlist`);
}

// After wishlist query returns empty
if (!items?.length) {
  console.log('📋 No unpurchased wishlist items available, will try fallback search');
}
```

---

## Files Modified

| File | Change |
|------|--------|
| `supabase/functions/auto-gift-orchestrator/index.ts` | Add purchased item exclusion to both T-7 and T-4 stages |

---

## Test Plan for Justin's Case

After implementation:

1. **Setup** (Charles creates rule):
   - Navigate to Auto-Gifts section
   - Add new rule for Justin with date_type: `christmas`
   - Set budget (e.g., $50)
   - Save with `gift_selection_criteria` containing preferred categories

2. **Trigger T-7 via Trunkline**:
   - Go to Admin → Auto-Gift Testing
   - Set simulated date to 7 days before Christmas (e.g., `2025-12-18`)
   - Click "Run Orchestrator"
   - **Expected**: Logs show "Excluding 1 already-purchased item(s)" → "No unpurchased wishlist items" → Falls back to `get-products` search

3. **Verify Suggestion Email**:
   - Check Charles's email for approval request
   - Suggested product should be from marketplace search (NOT the iPhone case)

4. **Trigger T-4 Payment Capture**:
   - Set simulated date to 4 days before Christmas (e.g., `2025-12-21`)
   - **Expected**: Same fallback logic, checkout created for marketplace product

## Expected Log Output

```
🎁 Processing rule abc123: Justin's christmas in 7 days
📬 Sending 7-day notification...
🔍 Excluding 1 already-purchased item(s) from wishlist
📋 No unpurchased wishlist items available, will try fallback search
🔍 No wishlist item found, falling back to get-products search
✅ Found product via search: [Product Name] at $XX.XX
```
