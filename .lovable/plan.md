

## Fix: Oversized Wishlist Badge and Broken Click on Product Tiles

### Problem
1. The wishlist button on product grid tiles shows full "Save to Wishlist" text, covering product photos on mobile and tablet
2. Clicking the wishlist button on both mobile AND desktop navigates to the product page instead of opening the wishlist popover -- the click event propagates up to the card's navigation handler

### Root Cause
In `ProductItem.tsx`:
- Line 108: `WishlistSelectionPopoverButton` is rendered without `variant="icon"`, so it defaults to showing "Save to Wishlist" text
- Line 106: The wrapper `<div>` around the wishlist button has no `onClick stopPropagation`, so the card's `onClick={handleProductClick}` fires and navigates away before the popover can open

### Fix (1 file: `src/components/marketplace/product-item/ProductItem.tsx`)

1. **Add `onClick={e => e.stopPropagation()}` to the wrapper div** (line 106) so clicks on the heart icon don't trigger product navigation
2. **Add `variant="icon"`** to `WishlistSelectionPopoverButton` (line 108) so only a compact heart icon renders instead of the full "Save to Wishlist" text

### Result
- Product tiles show a small circular heart icon in the top-right corner (standard e-commerce pattern)
- Clicking the heart opens the wishlist selection popover on both mobile and desktop without navigating away
- Product photos are no longer obscured

