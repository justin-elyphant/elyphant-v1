

## Fix: Remove "Save to Wishlist" Text From All Product Tile Components

### Problem
The fix applied to `ProductItem.tsx` is correct, but there are **two other components** rendering product tiles that also use `WishlistSelectionPopoverButton` without `variant="icon"`:

1. **`src/components/marketplace/ui/ModernProductCard.tsx`** (line 80) -- used by `UnifiedProductCard` for "modern" viewMode in marketplace search results
2. **`src/components/marketplace/product-item/ProductImageSection.tsx`** (line 48) -- used by `ProductItemBase` for grid/list views

The marketplace search results appear to use the "modern" card type via `UnifiedProductCard`, which is why the fix to `ProductItem.tsx` didn't take effect on screen.

### Fix (2 files, 2 lines each)

**1. `src/components/marketplace/ui/ModernProductCard.tsx` (line 80)**
- Add `variant="icon"` to the `WishlistSelectionPopoverButton` so only a heart icon renders (no "Save to Wishlist" text)

**2. `src/components/marketplace/product-item/ProductImageSection.tsx` (line 48)**
- Add `variant="icon"` to the `WishlistSelectionPopoverButton` for consistency across all tile types

### Result
- All product tile variants (ProductItem, ModernProductCard, ProductImageSection) will render a compact heart icon
- No "Save to Wishlist" text will cover product photos on any screen size
- The popover will continue to work correctly since the `stopPropagation` wrappers are already present in both files

