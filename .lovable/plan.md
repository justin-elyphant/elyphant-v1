

## Product Card Component Consolidation

### The Problem

We just experienced a "whack-a-mole" fix across 5 files because the same wishlist button is independently implemented in 7+ product card components. This is a maintainability hazard -- any future change (styling, behavior, new feature) requires hunting down and updating every card variant.

### Current State: 7 Redundant Card Components

| Component | Lines | Used By | Redundant? |
|-----------|-------|---------|------------|
| AirbnbStyleProductCard | 502 | UnifiedProductCard (default), direct imports | **Primary -- keep** |
| ProductItem | 229 | useProductInteractions (grid/list) | Yes -- duplicates AirbnbStyle |
| ModernProductCard | 149 | UnifiedProductCard ("modern") | Yes -- duplicates AirbnbStyle |
| MobileProductCard | 186 | UnifiedProductCard ("mobile") | Yes -- AirbnbStyle already mobile-aware |
| ProductCard | 154 | UnifiedProductCard ("general") | Yes -- incomplete (TODO wishlist) |
| ProductItemBase | 105 | Delegates to ImageSection + InfoSection | Yes -- unused wrapper layer |
| ProductImageSection | ~70 | ProductItemBase only | Yes -- dies with ProductItemBase |
| ProductInfoSection | ~60 | ProductItemBase only | Yes -- dies with ProductItemBase |
| WishlistButton | ~30 | Legacy wrapper | Yes -- wraps QuickWishlistButton |
| QuickWishlistButton | ~70 | WishlistButton only | Yes -- wraps WishlistSelectionPopoverButton |

Additionally, `ProductGridOptimized.tsx` is a 1-line re-export of `ProductGrid` and can be removed.

### Consolidation Plan

**Goal**: Route ALL product tile rendering through `AirbnbStyleProductCard`, which already supports every view mode (grid, list, modern), context (marketplace, wishlist), mobile optimization, and the correct wishlist popover behavior.

### Phase 1: Update UnifiedProductCard to fully delegate to AirbnbStyleProductCard

`UnifiedProductCard.tsx` already maps card types to `AirbnbStyleProductCard`, but the "modern" and "mobile" cases currently import their own separate components. Update the switch cases to pass the correct props directly to `AirbnbStyleProductCard` instead.

- **"modern" case**: Map `onClick` to `onProductClick`, set `viewMode="modern"`, pass through all props
- **"mobile" case**: Map `onProductClick(productId)` to card click, pass through
- **"general" case**: Already delegates correctly (no change needed)
- **"gifting" case**: Already delegates correctly (no change needed)

### Phase 2: Update useProductInteractions to use UnifiedProductCard for all view modes

In `src/components/marketplace/product-grid/hooks/useProductInteractions.tsx`, the non-modern branch renders `ProductItem` directly. Change it to render `UnifiedProductCard` with `cardType="airbnb"` instead, eliminating the last direct usage of `ProductItem`.

### Phase 3: Delete redundant components (10 files)

Once all consumers are routed through UnifiedProductCard to AirbnbStyleProductCard:

1. `src/components/marketplace/ui/ModernProductCard.tsx`
2. `src/components/marketplace/mobile/MobileProductCard.tsx`
3. `src/components/marketplace/ProductCard.tsx`
4. `src/components/marketplace/product-item/ProductItem.tsx`
5. `src/components/marketplace/product-item/ProductItemBase.tsx`
6. `src/components/marketplace/product-item/ProductImageSection.tsx`
7. `src/components/marketplace/product-item/ProductInfoSection.tsx`
8. `src/components/marketplace/product-item/WishlistButton.tsx`
9. `src/components/marketplace/product-item/QuickWishlistButton.tsx`
10. `src/components/marketplace/ProductGridOptimized.tsx`

### Phase 4: Update remaining direct imports

Search for any remaining imports of deleted components and redirect them to `UnifiedProductCard` or `AirbnbStyleProductCard`:

- `OptimizedProductGrid.tsx` imports `AirbnbStyleProductCard` directly (fine, keep)
- `TrendingSection.tsx`, `ShoppingPanel.tsx`, `MarketplaceProductsSection.tsx` import `AirbnbStyleProductCard` directly (fine, keep)
- `ProductGridOptimized.tsx` consumers should import `ProductGrid` directly

### Result

- **Before**: 7 card components, ~1,500 lines of duplicated logic, 12 files with independent `WishlistSelectionPopoverButton` instances
- **After**: 1 primary card (`AirbnbStyleProductCard`) + 1 adapter (`UnifiedProductCard`), ~550 lines total, 1 place to update wishlist behavior
- **Impact**: Any future change to wishlist buttons, image handling, rating display, or card layout requires editing exactly 1 file

### Risk Mitigation

- AirbnbStyleProductCard already handles all view modes, contexts, mobile/desktop, and the correct wishlist popover -- this is a deletion exercise, not a rewrite
- Each phase can be tested independently before proceeding
- Direct imports of AirbnbStyleProductCard (in wishlist shopping panels) remain valid and don't need changing

