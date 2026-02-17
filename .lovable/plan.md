

## Fix Guest Checkout UX: 3 Issues

### Issue 1: Double-Tap Required on Buttons (Mobile)

The "Add to Cart" button in the wishlist viewer (`InlineWishlistViewer.tsx`) and the "Pay Now" sticky bar in checkout (`UnifiedCheckoutForm.tsx`) require double-taps on mobile because:

- The wishlist "Add to Cart" button uses `opacity-0 group-hover:opacity-100` on the cart icon overlay (line 341), which requires a first tap to trigger hover state on mobile, then a second tap to actually click.
- The "Pay Now" sticky bar button at the bottom of checkout (line 787) may suffer from iOS touch delay issues -- the button is inside a fixed container that can conflict with bottom safe area insets and scroll momentum.

**Fixes:**
- **InlineWishlistViewer.tsx (line 341)**: Remove `opacity-0 group-hover:opacity-100` from the cart icon overlay so buttons are always visible and tappable on mobile. Keep hover effect for desktop only using a responsive class approach.
- **InlineWishlistViewer.tsx (lines 374-396)**: The bottom "View" and "Add" buttons are already always visible -- these should work fine. The issue is the overlay cart button.
- **UnifiedCheckoutForm.tsx (line 787)**: Add `touch-action: manipulation` to the Pay Now button to eliminate the 300ms tap delay on iOS. Also ensure the button has proper `min-h-[44px]` touch target sizing.

### Issue 2: Add Trash Icon to Checkout Order Summary

Currently, `CheckoutOrderSummary.tsx` shows items as read-only with no way to remove them. A small trash icon should be added next to each item.

**Fix:**
- **CheckoutOrderSummary.tsx**: Add `removeFromCart` from `useCart()` context. Add a small Trash2 icon button next to each item row that calls `removeFromCart(item.product.product_id)`.
- Size the trash button at 32x32 (min 44px touch target via padding) to keep it compact but tappable.

### Issue 3: Wishlist "Add to Cart" Button Always Visible on Mobile

The floating cart icon on product images in the wishlist viewer only appears on hover, which doesn't work on touch devices.

**Fix:**
- Make the cart overlay icon always visible on mobile (remove opacity-0, keep it for `md:` screens only with `md:opacity-0 md:group-hover:opacity-100`).

### Technical Details

**Files to modify:**

| File | Change |
|------|--------|
| `src/components/user-profile/InlineWishlistViewer.tsx` | Line 341: Change `opacity-0 group-hover:opacity-100` to `md:opacity-0 md:group-hover:opacity-100` so the cart overlay is always visible on mobile |
| `src/components/checkout/CheckoutOrderSummary.tsx` | Import `useCart` and `Trash2`, add a remove button next to each item in the summary |
| `src/components/checkout/UnifiedCheckoutForm.tsx` | Line 787: Add `touch-action-manipulation` class and ensure 44px touch target on Pay Now button |

