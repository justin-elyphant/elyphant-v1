

# Add "All Items" Product Grid Below Sub-Collection Carousel

## What This Does

Inspired by Lululemon's category landing pages, this adds a curated product grid section below the "Shop the Collection" carousel on both the Baby and Wedding landing pages. The grid shows 20-30 mixed products from across the sub-categories, giving users immediate browsing without needing to click into a specific tile first.

## Layout (Matching Lululemon Reference)

```text
+--------------------------------------------+
|             HERO (existing)                 |
+--------------------------------------------+
|       Shop the Collection (carousel)        |
|  [Tile] [Tile] [Tile] [Tile] [Tile] [Tile] |
+--------------------------------------------+
|           All Items  ·  24 products         |  <-- NEW
|  +---------+  +---------+  +---------+      |
|  |         |  |         |  |         |      |
|  | Product |  | Product |  | Product |      |
|  |  Card   |  |  Card   |  |  Card   |      |
|  +---------+  +---------+  +---------+      |
|  +---------+  +---------+  +---------+      |
|  |         |  |         |  |         |      |
|  | Product |  | Product |  | Product |      |
|  |  Card   |  |  Card   |  |  Card   |      |
|  +---------+  +---------+  +---------+      |
|       [ Shop All Baby/Wedding Gifts ]       |
+--------------------------------------------+
```

## How It Works

- Queries the `products` table directly (zero Zinc API cost) for products matching the category
- Baby: searches titles/category for baby, diaper, nursery, infant, newborn keywords (~51 cached products available)
- Wedding: searches titles/category for wedding, bridal, bride, groom, honeymoon keywords (~118 cached products available)
- Sorts by view_count (most popular first) to surface the best products
- Displays up to 24 products in a responsive grid (2 cols mobile, 3 cols tablet, 4 cols desktop)
- Includes a "Shop All" CTA button at the bottom that navigates to the full search results page
- Shows skeleton loading states while products load

## Technical Details

### File 1: `src/components/marketplace/landing/LifeEventLandingPage.tsx`

**Changes:**
- Add search keywords config per category (used for the DB query)
- Add a new `LifeEventAllItems` section component below the carousel that:
  - Queries `supabase.from('products')` with `or()` filters matching category-specific keywords in `title` and `category` columns
  - Maps DB rows to the `Product` type using the same `mapDbProductToProduct` pattern from `TrendingProductsSection`
  - Renders products using `UnifiedProductCard` (the same card component used everywhere else)
  - Includes a section header ("All Items" with product count)
  - Shows a "Shop All [Category] Gifts" button at the bottom
  - Has skeleton loading states (8 placeholder cards)

**New imports:**
- `supabase` from integrations
- `UnifiedProductCard` for consistent product cards
- `useState`, `useEffect` for data fetching
- `Product` type from types
- `Skeleton` for loading state

**Data fetching approach:**
- Same pattern as `TrendingProductsSection`: direct Supabase query in a `useEffect`
- Baby query: `.or('category.ilike.%baby%,title.ilike.%baby%,title.ilike.%diaper%,title.ilike.%nursery%,title.ilike.%infant%')`
- Wedding query: `.or('category.ilike.%wedding%,title.ilike.%wedding%,title.ilike.%bridal%,title.ilike.%bride%,title.ilike.%honeymoon%')`
- Order by `view_count DESC` (popular first), limit 24
- Maps results through same `mapDbProductToProduct` helper

**No changes to:**
- `StreamlinedMarketplaceWrapper.tsx` (the landing page is self-contained)
- Any edge functions or backend
- The hero or carousel sections

### Cost Impact

Zero additional cost -- queries only the local `products` table (already cached data). No Zinc API calls.
