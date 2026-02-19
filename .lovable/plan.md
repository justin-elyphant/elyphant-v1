
## Root Cause Analysis

**The "Gifted 🎁" badge is not showing for Justin (the wishlist owner) on mobile/tablet because `InlineWishlistWorkspace.tsx` — the component used in the owner's view — never fetches purchase data from `wishlist_item_purchases` and never passes `purchasedItemIds` to `WishlistItemsGrid`.**

Here's the evidence:

**Database confirms the purchases exist:**
- OXO Salad Spinner (`item_id: 5e3d6dd0`) — purchased by Charles (logged-in user)
- Millie Moon Diapers (`item_id: 5903277f`) — purchased by anonymous guest checkout
- Both are in `wishlist_id: de28ab25` (Justin's "Test Gifts" wishlist)

**Code confirms the bug — `InlineWishlistWorkspace.tsx` line 218-224:**
```tsx
<WishlistItemsGrid
  items={wishlist.items}
  onSaveItem={(item) => handleRemoveItem(item.id)}
  savingItemId={isRemoving ? 'removing' : undefined}
  isOwner={isOwner}
  isGuestPreview={isGuestPreview}
  // ❌ purchasedItemIds is MISSING — defaults to empty Set()
/>
```

The `WishlistItemsGrid` has `purchasedItemIds = new Set()` as its default, so no item is ever marked as purchased from the owner's view.

By contrast, `SharedWishlistView.tsx` (the guest/link view) **does** correctly fetch and pass `purchasedItemIds` — which is why external purchasers see the "Purchased" badge, but Justin sees nothing.

Also noted: The Caboo Napkins and Oral-B Floss items (`id: 3770263d` and `2b61f5a2`) are in the `wishlist_items` table but have **no corresponding records** in `wishlist_item_purchases`. These were not the ones actually purchased — the purchases were for OXO Salad Spinner and Millie Moon Diapers based on the database records.

---

## Fix Plan

**Single file to edit: `src/components/gifting/wishlist/InlineWishlistWorkspace.tsx`**

### Change 1 — Add state for purchased items
Add a `purchasedItemIds` state (a `Set<string>`) to track which items have been purchased.

### Change 2 — Fetch purchased items after wishlist loads
After the wishlist is loaded and `wishlistId` is known, query `wishlist_item_purchases` for all `item_id` values matching `wishlist_id = wishlistId`. This mirrors exactly what `SharedWishlistView.tsx` already does correctly.

```tsx
// Fetch purchased item IDs for badge display
useEffect(() => {
  const fetchPurchasedItems = async () => {
    if (!wishlistId) return;
    const { data, error } = await supabase
      .from("wishlist_item_purchases")
      .select("item_id")
      .eq("wishlist_id", wishlistId);
    if (!error && data) {
      setPurchasedItemIds(new Set(data.map((row) => row.item_id)));
    }
  };
  fetchPurchasedItems();
}, [wishlistId]);
```

### Change 3 — Pass `purchasedItemIds` to `WishlistItemsGrid`
```tsx
<WishlistItemsGrid
  items={wishlist.items}
  onSaveItem={(item) => handleRemoveItem(item.id)}
  savingItemId={isRemoving ? 'removing' : undefined}
  isOwner={isOwner}
  isGuestPreview={isGuestPreview}
  purchasedItemIds={purchasedItemIds}  // ✅ Add this
/>
```

This will immediately cause the "Gifted 🎁" badge to appear on the OXO Salad Spinner and the Millie Moon Diapers in Justin's owner view on mobile, tablet, and desktop.

---

## About the Missing Caboo/Oral-B/OXO Floss Badges

The database shows those three items **exist in `wishlist_items`** but do **not** have records in `wishlist_item_purchases`. This means their purchases either:
- Did not complete through the webhook flow
- Were placed on a different wishlist ID

The items that **do** have confirmed purchase records are:
- OXO Good Grips Salad Spinner — purchased by Charles
- Millie Moon Diapers — purchased via guest checkout

These two will show badges immediately after this fix. The Caboo/Floss items would need a manual SQL backfill into `wishlist_item_purchases` if those orders completed successfully.

---

## Summary

- **1 file changed**: `InlineWishlistWorkspace.tsx`
- **3 small additions**: state variable, fetch effect, prop pass-through
- **Zero risk**: purely additive, matches the already-working pattern in `SharedWishlistView.tsx`
