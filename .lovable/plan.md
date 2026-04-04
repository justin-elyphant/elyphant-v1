

## Rename Product Card Files and Consolidate to Single Lululemon-Inspired Card

### What We're Doing

Rename `AirbnbStyleProductCard` to `ProductCard` (the Lululemon-inspired design), rename `UnifiedProductCard` to `UnifiedProductCardAdapter`, and replace the 3 rogue card implementations that bypass the primary design system.

### Current State

- **`AirbnbStyleProductCard.tsx`** — the primary Lululemon-inspired card, used in 11 files. Misnamed.
- **`UnifiedProductCard.tsx`** — adapter/wrapper that delegates to AirbnbStyleProductCard, used in 9 files. Fine as-is but references the old name.
- **`gifting/ProductCard.tsx`** — a completely separate card implementation with its own styling. Used only by `ProductGallery.tsx`. Does NOT use the Lululemon design.
- **`user-profile/CategorizedProductSections.tsx`** — renders inline custom cards with `<Card>` + manual image/price layout. Does NOT use the Lululemon card.
- **`vendor/products/VendorProductGrid.tsx`** — vendor dashboard card. Different context (admin view), so this one stays as-is.

### Plan

**Step 1: Rename `AirbnbStyleProductCard` to `ProductCard`**
- Rename file: `marketplace/AirbnbStyleProductCard.tsx` → `marketplace/ProductCard.tsx`
- Update the component name, displayName, and interface name inside the file
- Update all 11 import references across the codebase

**Step 2: Update `UnifiedProductCard.tsx`**
- Update its import to point to the renamed `ProductCard`
- No other changes needed (it's a valid adapter pattern)

**Step 3: Replace `gifting/ProductCard.tsx` with the primary card**
- Rename existing `gifting/ProductCard.tsx` → delete (or rename to `LegacyProductCard.tsx` temporarily)
- Update `ProductGallery.tsx` to import from `marketplace/ProductCard` instead
- Map the gifting-specific props (isWishlisted, isGifteeView, onToggleWishlist) through the card's existing interface (which already supports these props)

**Step 4: Replace inline cards in `CategorizedProductSections.tsx`**
- Replace the custom `renderProductCard` function with the primary `ProductCard` component
- Map existing props (product, onClick) to the card's interface

**Step 5: Leave `VendorProductGrid.tsx` alone**
- This is an admin/vendor dashboard view, not customer-facing. Different context, different card is appropriate.

### Files Modified
- **Renamed:** `src/components/marketplace/AirbnbStyleProductCard.tsx` → `src/components/marketplace/ProductCard.tsx`
- **Updated imports (11 files):** `OptimizedProductGrid.tsx`, `ProductGridDisplay.tsx`, `StreamlinedMarketplaceWrapper.tsx`, `MarketplaceProductsSection.tsx`, `TrendingSection.tsx`, `ShoppingPanel.tsx`, `NicoleAISuggestions.tsx`, `UnifiedProductCard.tsx`, `MobileProductGrid.tsx` (via UnifiedProductCard), plus 2 others
- **Replaced:** `src/components/gifting/ProductCard.tsx` (rewired to use primary card)
- **Updated:** `src/components/gifting/ProductGallery.tsx` (new import path)
- **Updated:** `src/components/user-profile/CategorizedProductSections.tsx` (use primary card)
- **Untouched:** `src/components/vendor/products/VendorProductGrid.tsx`

### What Stays Unchanged
- All card styling, behavior, and props — zero visual changes
- `UnifiedProductCard` adapter pattern — still valid
- Vendor dashboard cards — different context
- All backend, API, and data flows

