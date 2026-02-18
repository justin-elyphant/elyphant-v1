

# Fix Wishlist Purchase Tracking (3 Issues)

## Problem Summary

Justin@elyphant.com has a wishlist ("Test Gifts") with 2 items:
- **OXO Salad Spinner** (B00004OCKR) -- purchased by justincmeeks@hotmail.com (logged in)
- **Millie Moon Diapers** (B0FDX5186F) -- purchased via guest checkout

Neither purchase created a record in `wishlist_item_purchases`, so:
- No "Purchased" badge appears on either item
- The wishlist progress ring shows 0%

## Root Causes

### Issue 1: InlineWishlistViewer missing metadata (code bug)
When a visitor clicks "Add to Cart" from a connection's profile page, `InlineWishlistViewer.tsx` (line 141-148) calls `addToCart()` without the required `wishlistMetadata` parameter. The `SharedWishlistView` component does this correctly -- `InlineWishlistViewer` just needs the same treatment.

**Without metadata:** `wishlist_id` and `wishlist_item_id` are empty in Stripe session metadata, so `stripe-webhook-v2` skips the purchase tracking insert (line 607: `if (item.wishlist_id && item.wishlist_item_id)`).

### Issue 2: No backfill for existing purchases
The two orders already placed (ORD-20260217-8785 and ORD-20260217-7971) have empty wishlist tracking fields. They need manual backfill into `wishlist_item_purchases`.

### Issue 3: SharedWishlistView also affected for guests
Charles's purchase (via shared link) and the guest purchase both went through without metadata. This confirms the shared wishlist link may not have been used, OR the metadata was lost during checkout. Either way, the backfill covers these.

---

## Fix Plan

### Step 1: Fix InlineWishlistViewer.tsx (code change)

Update the `handleAddToCart` function to pass wishlist metadata, mirroring `SharedWishlistView`:

```typescript
const handleAddToCart = (item: WishlistItem) => {
  triggerHapticFeedback(HapticPatterns.buttonTap);

  const product = {
    product_id: item.product_id || item.id,
    name: item.title || item.name || 'Product',
    price: item.price || 0,
    image: item.image_url || undefined,
  } as any;

  const metadata = {
    wishlist_id: wishlist.id,
    wishlist_item_id: item.id,
    wishlist_owner_id: profileOwner.id,
    wishlist_owner_name: profileOwner.name,
  };

  addToCart(product, 1, metadata);

  triggerHapticFeedback('success');
  toast.success("Added to cart", {
    description: `${item.title || item.name} from ${profileOwner.name}'s wishlist`
  });
};
```

### Step 2: Backfill existing purchases (data insert)

Insert 2 records into `wishlist_item_purchases` for the already-completed orders:

| Order | Product | Wishlist Item | Purchaser |
|-------|---------|---------------|-----------|
| ORD-20260217-8785 (e7eac78f) | B00004OCKR (OXO Salad Spinner) | 5e3d6dd0 | justincmeeks@hotmail.com (f5c6fbb5) |
| ORD-20260217-7971 (cf5f5f96) | B0FDX5186F (Millie Moon Diapers) | 5903277f | NULL (guest) |

SQL:
```sql
INSERT INTO wishlist_item_purchases
  (wishlist_id, item_id, product_id, purchaser_user_id, order_id, quantity, price_paid, is_anonymous)
VALUES
  ('de28ab25-c53d-4cda-90a2-5131b0f9f486', '5e3d6dd0-d94f-4f09-9f07-6836a5d17210', 'B00004OCKR', 'f5c6fbb5-f2f2-4430-b679-39ec117e3596', 'e7eac78f-5083-48a3-9c9d-e7c49a408f31', 1, 32.95, false),
  ('de28ab25-c53d-4cda-90a2-5131b0f9f486', '5903277f-2875-4c38-b821-4c2a58b3098f', 'B0FDX5186F', NULL, 'cf5f5f96-73a5-4513-98fd-aa7bf0bf1543', 1, 19.80, true);
```

### Step 3: Verify results

After the backfill:
- Visit `/profile/justin` -- both items should show green "Purchased" badges
- The progress ring on the "Test Gifts" wishlist bubble should show 100% (2/2 items purchased)

---

## Technical Details

**Files modified:** 1 file
- `src/components/user-profile/InlineWishlistViewer.tsx` -- lines 141-154

**Data operations:** 1 insert (2 rows into `wishlist_item_purchases`)

**No schema changes needed.** The `wishlist_item_purchases` table already supports `purchaser_user_id = NULL` for guest purchases. The webhook uses the service role key, bypassing RLS, so guest inserts work.

