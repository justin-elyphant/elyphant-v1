
# Fix: Shared Wishlist — Remove "Assign" Button, Add Scheduling & Gift Note with Full Stripe Metadata

## What Charles Currently Sees (the problems)

1. **"Assign" button** — Cart shows "No recipient assigned + Assign" even though Justin IS the recipient (already encoded in `wishlist_owner_name` / `wishlist_owner_shipping` on the cart item).
2. **No scheduling** — No way for Charles to pick a delivery date for Justin's birthday before adding to cart.
3. **No gift note** — No way to write a personal message at item level from the shared wishlist.

---

## How the Full Stack Works (current reality)

```text
SharedWishlistView
  └─ handleAddToCart(item)
       └─ addToCart(product, 1, { wishlist_id, wishlist_item_id,
                                   wishlist_owner_id, wishlist_owner_name,
                                   wishlist_owner_shipping })      ← CartItem populated

UnifiedCheckoutForm (line 406-415)
  └─ create-checkout-session payload
       └─ cartItems: [ { product_id, name, price, quantity, image_url,
                          recipientAssignment,
                          wishlist_id, wishlist_item_id } ]         ← wishlist_owner_shipping NOT sent

create-checkout-session (edge function)
  └─ Stripe line item metadata: { wishlist_id, wishlist_item_id,
                                   recipient_ship_line1, ... }      ← reads from recipientAssignment.shippingAddress

stripe-webhook-v2
  └─ reads recipient_ship_* from Stripe product metadata            ← routes to correct address
  └─ inserts wishlist_item_purchases row                            ← triggers Gifted 🎁 badge
```

**The gap:** `wishlist_owner_shipping` is on the CartItem but is **not forwarded** in the `create-checkout-session` payload's `cartItems` mapping (only `recipientAssignment` is sent — which is null for wishlist items because `assignItemToRecipient` is never called). So the webhook has no recipient shipping address and no gift message or scheduled date.

---

## The Fix: 4 Files Changed

### Gap 1 — Auto-assign recipient + pass all metadata at checkout

**File: `src/components/checkout/UnifiedCheckoutForm.tsx`** (lines 406-415)

Extend the `cartItems` mapping to also send `wishlist_owner_*` fields directly (the webhook understands both `recipientAssignment.shippingAddress` and the `recipient_ship_*` Stripe metadata). Also forward `gift_message` and `scheduled_delivery_date` from the cart item's `recipientAssignment` (which will be populated by the new gift-options flow).

```typescript
// AFTER (complete mapping with all wishlist fields forwarded)
cartItems: cartItems.map(item => ({
  product_id: item.product.product_id || item.product.id,
  name: item.product.name,
  price: item.product.price,
  quantity: item.quantity,
  image_url: item.product.image || item.product.images?.[0],
  recipientAssignment: item.recipientAssignment || (item.wishlist_owner_id ? {
    connectionId: item.wishlist_owner_id,
    connectionName: item.wishlist_owner_name || '',
    deliveryGroupId: `wishlist_${item.wishlist_id}`,
    shippingAddress: normalizeWishlistOwnerAddress(item.wishlist_owner_shipping, item.wishlist_owner_name),
    giftMessage: item.recipientAssignment?.giftMessage || '',
    scheduledDeliveryDate: item.recipientAssignment?.scheduledDeliveryDate || '',
  } : undefined),
  wishlist_id: item.wishlist_id || '',
  wishlist_item_id: item.wishlist_item_id || '',
})),
```

This means the edge function's `recipientAssignment.shippingAddress` path (line 222 in create-checkout-session) is populated and the webhook correctly reads `recipient_ship_*` from Stripe product metadata — **no edge function changes needed**.

### Gap 2 — "Schedule Gift" option + gift note on the shared wishlist item card

**File: `src/components/gifting/wishlist/SharedWishlistView.tsx`**

Add local state for a "gift options" bottom drawer:
- `giftOptionsItem: WishlistItem | null`
- `pendingGiftNote: string`  
- `pendingScheduledDate: string`

Add a `handleScheduleAndAddToCart(item)` function that opens the drawer. When the drawer confirms, it calls `handleAddToCart(item)` and attaches `giftMessage` + `scheduledDeliveryDate` to the `recipientAssignment` on the cart item via `updateRecipientAssignment` (called right after `addToCart`).

Add a `vaul` Drawer (already installed) with:
- A minimal date input (HTML `<input type="date">` with min = today + 1, same pattern as scheduling modal)
- A textarea for gift note (max 240 chars matching the existing gift_message limit in the checkout)
- **"Add to Cart"** confirm CTA
- **"Skip — Add Now"** link for users who don't want options

**File: `src/components/gifting/wishlist/EnhancedWishlistCard.tsx`**

In the guest CTA block (lines 239-261), add a **"Schedule / Note"** button that calls a new `onScheduleAndAddToCart?: () => void` prop, placed between "View" and "Add to Cart":

```tsx
{isGuestView && onAddToCart && (
  <>
    <Button size="sm" variant="outline" onClick={handleViewDetails}>
      <ExternalLink /> View
    </Button>
    {onScheduleAndAddToCart && (
      <Button size="sm" variant="outline" onClick={(e) => {
        e.stopPropagation();
        onScheduleAndAddToCart();
      }}>
        <Calendar /> Schedule
      </Button>
    )}
    <Button size="sm" onClick={handleAddToCartClick}>
      <ShoppingCart /> Add to Cart
    </Button>
  </>
)}
```

**File: `src/components/gifting/wishlist/workspace/CategorySection.tsx`**

Pass `onScheduleAndAddToCart` prop down from `SharedWishlistView` → `WishlistItemsGrid` → `CategorySection` → `EnhancedWishlistCard`. (WishlistItemsGrid already passes `onAddToCart`, same pattern.)

### Gap 3 — Cart shows "→ Justin Meeks (wishlist)" instead of "Assign" button

**File: `src/pages/Cart.tsx`** (lines 543-558)

Add a middle branch: if `item.wishlist_owner_name` is set, skip the "Assign" button and instead show:
- "→ Justin Meeks · from wishlist" label
- If `item.recipientAssignment?.giftMessage` exists, show the gift note pill
- If `item.recipientAssignment?.scheduledDeliveryDate` exists, show the scheduled date

```typescript
} else if (item.wishlist_owner_name) {
  // Wishlist gift — recipient already known
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>→</span>
      <span className="font-medium text-foreground">{item.wishlist_owner_name}</span>
      <span className="text-xs">· from wishlist</span>
    </div>
    <ItemGiftMessageSection ... />  {/* still lets them add/edit a note */}
  </div>
} else {
  // original "No recipient assigned + Assign" block
}
```

---

## Stripe Metadata Pipeline (confirmed complete after fix)

After the fix, here is what flows all the way through to Zinc:

```text
CartItem (browser)
  wishlist_owner_id    → recipientAssignment.connectionId       → Stripe line item metadata: recipient_id
  wishlist_owner_name  → recipientAssignment.connectionName     → Stripe: recipient_name
  wishlist_owner_shipping → recipientAssignment.shippingAddress → Stripe: recipient_ship_line1/city/state/postal
  recipientAssignment.giftMessage                               → Stripe: gift_message
  recipientAssignment.scheduledDeliveryDate                     → session metadata: scheduled_delivery_date
  wishlist_id                                                   → Stripe: wishlist_id (product metadata)
  wishlist_item_id                                              → Stripe: wishlist_item_id (product metadata)

stripe-webhook-v2 reads from Stripe → creates:
  - orders row (correct recipient address, gift message, scheduled date)
  - wishlist_item_purchases row (triggers Gifted 🎁 badge)
  - Zinc submission (correct shipping address, ASIN, quantity)
```

No edge function changes are required — `create-checkout-session` and `stripe-webhook-v2` already handle all these fields correctly once the frontend sends them.

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/checkout/UnifiedCheckoutForm.tsx` | Synthesize `recipientAssignment` from `wishlist_owner_*` fields when `recipientAssignment` is null |
| `src/components/gifting/wishlist/SharedWishlistView.tsx` | Add "gift options" vaul Drawer state + `handleScheduleAndAddToCart`; call `updateRecipientAssignment` after `addToCart` to attach gift note + date |
| `src/components/gifting/wishlist/EnhancedWishlistCard.tsx` | Add `onScheduleAndAddToCart` prop + "Schedule" button in guest CTA row |
| `src/components/gifting/wishlist/workspace/CategorySection.tsx` | Pass `onScheduleAndAddToCart` prop through to `EnhancedWishlistCard` |
| `src/pages/Cart.tsx` | Show "→ Justin Meeks · from wishlist" instead of "Assign" when `wishlist_owner_name` is set |

No backend, edge function, or database changes needed.
