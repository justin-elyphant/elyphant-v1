
# Unify Category Landing Pages with Cache-First Product Discovery

## Summary

Three changes: (1) export TILES data for reuse, (2) create `CategoryLandingHeader` component, (3) consolidate the inline header blocks in `StreamlinedMarketplaceWrapper`. All changes prioritize cached products and maintain zero extra Zinc API cost.

## Cache-First Strategy

The `get-products` edge function already has two distinct paths:

- **Regular search path** (line 1164): Does cache-first lookup via `getCachedProductsForQuery()` -- checks `products` table first, only calls Zinc on cache miss. This is the cost-efficient path.
- **Category registry path** (line 1100): Always calls `searchCategoryBatch()` which hits Zinc API directly, then caches afterward. This is the expensive path.

Both the new `CategoryLandingHeader` sibling tiles and the existing category page loads already go through `useMarketplace` -> `productCatalogService.searchProducts()` -> `get-products` edge function. The cache-first logic is already handled server-side. No client-side changes needed to respect the cache.

**What the plan does NOT change**: The edge function routing logic, the cache-first lookup, the Zinc API fallback, or any pricing normalization. All of that stays untouched.

**Products already cached get promoted automatically**: The `get-products` edge function calculates a `popularity_score` for cached products (line 48-107) and sorts by it (line 595). Cached products with views, reviews, and best seller badges score higher, so they naturally appear first. Products that came from the landing page discovery rows (Trending, New Arrivals, Top Rated) are already in the cache, so clicking into a category that overlaps with those products will show them first.

## Changes

### 1. Export TILES data from `CuratedCollectionTiles.tsx`

Add `export` to the `CollectionTile` interface and `TILES` array so the new header component can import them for sibling navigation. Zero visual changes.

**Lines changed**: ~2 (add `export` keyword to two declarations)

### 2. New Component: `CategoryLandingHeader.tsx`

A lightweight presentational component (~100 lines) that consolidates ALL category header rendering. Receives:

- `title` -- page title (e.g., "Gifts for Her", "Sony Headphones")
- `subtitle` -- description text
- `productCount` -- total products found
- `breadcrumbs` -- array for `StandardBreadcrumb` (reuses existing component)
- `siblingCollections` -- optional array of collection tiles for horizontal carousel (Quick Pick categories only)
- `currentCollectionId` -- to exclude the active tile from siblings

Renders:
- `StandardBreadcrumb` component (already exists, just imported)
- Left-aligned title + product count (Lululemon style: bold title, muted count inline)
- Subtitle below title
- Horizontal scrollable sibling collection tiles (only for Quick Pick categories) using the same `motion.button` + image + gradient overlay pattern from `CuratedCollectionTiles`

Reuses:
- `StandardBreadcrumb` from `@/components/shared/StandardBreadcrumb`
- `CollectionTile` type and `TILES` array from `CuratedCollectionTiles`
- `triggerHapticFeedback` from `@/utils/haptics` (same as landing page tiles)
- `motion.button` from framer-motion (same whileTap/transition as landing page tiles)
- `useNavigate` from react-router-dom

No data fetching, no state, no hooks beyond `useNavigate`. Pure presentation.

### 3. Simplify `StreamlinedMarketplaceWrapper.tsx` header section

Replace lines 607-710 (four inline header render blocks: search term, Quick Pick, lifestyle, generic category) with a single `CategoryLandingHeader` component.

The mapping logic stays in the wrapper but becomes a simple config object:

| Category Type | Title Source | Breadcrumbs | Sibling Tiles |
|---------------|-------------|-------------|---------------|
| Quick Pick (giftsForHer, etc.) | Existing map (line 644-649) | Marketplace > Gift Ideas > title | TILES minus current |
| Search term | URL search term (capitalized) | Marketplace > Search Results | None |
| Lifestyle category | lifestyleMap (line 666-673) | Marketplace > title | None |
| Generic category | getCategoryByValue (line 693) | Marketplace > title | None |

This removes ~100 lines of repetitive centered-text JSX and replaces with ~20 lines of config + one component render.

## What Stays the Same

- `useMarketplace` hook -- untouched, still drives all product data loading
- `SubCategoryTabs` -- untouched, still renders below the header
- Filter/sort controls -- untouched
- Product grid and cards -- untouched
- `BrandHeroSection` -- untouched (brands keep their custom hero)
- `FeaturedProductHero` -- untouched
- Landing page `CuratedCollectionTiles` -- untouched visually
- `TrendingProductsSection` -- untouched (already uses zero-cost DB queries)
- `get-products` edge function -- untouched (cache-first logic preserved)
- `get-product-detail` edge function -- untouched (cache-first detail lookup preserved)
- All pricing logic -- untouched

## Files Changed

| File | Action | Scope |
|------|--------|-------|
| `src/components/marketplace/landing/CuratedCollectionTiles.tsx` | Edit | Add `export` to 2 declarations |
| `src/components/marketplace/landing/CategoryLandingHeader.tsx` | New | ~100 lines, presentational only |
| `src/components/marketplace/StreamlinedMarketplaceWrapper.tsx` | Edit | Replace lines 607-710 with ~20 lines |
