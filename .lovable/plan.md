
## Product Catalog Pricing Audit: $0.00 and Cents-vs-Dollars Fixes

### Problems Found

**Database-level corruption affecting ALL product surfaces:**

| Issue | Count | Example |
|-------|-------|---------|
| Products priced at $0.00 or NULL | 108 | iPad 11-inch, LEGO sets, NFL jerseys, Burt's Bees gift sets |
| Products stored in cents (not dollars) | 61 | OXO Salad Spinner: stored as $3,295 (should be $32.95), NFL t-shirt: stored as $2,799 (should be $27.99) |
| **Total bad records** | **169** out of 3,435 (4.9%) | |

**6 product catalog surfaces affected:**

1. **Homepage "Create Your Perfect Wishlist"** -- Uses `productCatalogService` (edge function). No price validation. This is where you saw the $0.00 products.
2. **Marketplace Landing Rows** (Trending / New Arrivals / Top Rated) -- Queries `products` table directly. No price filter.
3. **Life Event "All Items"** (Wedding / Baby pages) -- Same direct DB query, no price filter.
4. **Brand Landing "All Items"** (Nike, Apple, etc.) -- Same pattern, no price filter.
5. **Homepage "Featured Products"** -- Uses `productCatalogService`, no validation.
6. **Category Browse Sections** (Beauty, Electronics, etc.) -- Uses `productCatalogService`, explicitly falls back to `price: 0` for missing prices.

### Root Cause

The Zinc API returns prices in cents for search results but dollars for product detail lookups. The `get-products` edge function normalizes most prices, but some slip through -- particularly when the Zinc response has `price: 0` or `price: null` (common for out-of-stock or variant-only listings). These get cached as-is in the `products` table with no write-time validation.

### Fix Plan

#### Part 1: Database Data Cleanup (one-time SQL)

Run two corrective queries:

**Fix cents-as-dollars** (61 records where price > 200 and the product is clearly a normal consumer good):
```sql
UPDATE products
SET price = price / 100
WHERE price > 200
  AND retailer = 'amazon';
```

**Remove $0 products** (108 records that have no usable pricing data):
```sql
DELETE FROM products
WHERE (price = 0 OR price IS NULL)
  AND retailer = 'amazon';
```

#### Part 2: Defensive Price Filtering at the Display Layer

Add a `price > 0` filter to every direct DB query so $0 products never reach the UI, even if new ones get cached in the future. This is a single-line addition to each query:

- `TrendingProductsSection.tsx` -- Add `.gt("price", 0)` to all 3 row queries (Trending, New Arrivals, Top Rated)
- `LifeEventAllItems.tsx` -- Add `.gt("price", 0)` to the category query
- `BrandAllItems.tsx` -- Add `.gt("price", 0)` to the brand query

#### Part 3: Write-Time Normalization Guard in `get-products` Edge Function

Add validation before caching products to the `products` table:
- Skip caching any product where `price <= 0` or `price IS NULL`
- Auto-divide by 100 if `price > 200` for Amazon-sourced products (same heuristic already used elsewhere)

This prevents future data corruption at the source.

#### Part 4: Display-Layer Fallback in `mapDbProductToProduct`

The `mapDbProductToProduct` function is duplicated in 3 files. Extract it to a shared utility (`src/utils/mapDbProduct.ts`) and add:
- Skip products with `price <= 0` (filter, not fallback to 0)
- Apply the cents heuristic: if `price > 200` for an amazon product, divide by 100

#### Part 5: Fix `ProgressiveAirbnbStyleCategorySections.tsx` Explicit Zero Fallback

Line 112 has `price: result.price || 0` -- this means any product with a missing price displays as $0.00 instead of being filtered out. Change to filter out products with no valid price after mapping.

---

### Files Changed

| File | Changes |
|------|---------|
| `src/utils/mapDbProduct.ts` | **Create** -- Shared mapper with price validation, replaces 3 duplicates |
| `src/components/marketplace/landing/TrendingProductsSection.tsx` | Add `.gt("price", 0)` to queries, use shared mapper |
| `src/components/marketplace/landing/LifeEventAllItems.tsx` | Add `.gt("price", 0)`, use shared mapper |
| `src/components/marketplace/landing/BrandAllItems.tsx` | Add `.gt("price", 0)`, use shared mapper |
| `src/components/marketplace/ProgressiveAirbnbStyleCategorySections.tsx` | Filter out $0 products after mapping |
| `supabase/functions/get-products/index.ts` | Add write-time price validation before caching |

### What Does NOT Change
- `WishlistCreationCTA.tsx` -- Uses `productCatalogService` which calls the edge function; the edge function fix (Part 3) covers this
- `FeaturedProducts.tsx` -- Same; covered by edge function fix
- `UnifiedProductCard` / `AirbnbStyleProductCard` -- Display components are fine; the data is the problem
- Pricing display logic (`formatPrice`) -- Already correct; it formats whatever number it receives
