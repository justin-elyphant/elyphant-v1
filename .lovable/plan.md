

# Fix Empty Product Discovery Rows

## Problem

The three product rows (Trending, New Arrivals, Top Rated) are nearly empty because they send vague multi-word text queries like `"best selling top rated popular trending"` to the `get-products` edge function. The relevance filter strips out almost everything -- only 1 product survives for "Trending" and "Top Rated", and 0 for "New Arrivals."

## Root Cause

The `get-products` edge function tries to match these words against product titles in the cache. "best selling top rated popular trending" doesn't appear in any product title, so the cache returns almost nothing. When it falls through to Zinc API, the brand-aware filter also strips results because the query words don't match product attributes.

## Solution

Query the `products` table directly using the Supabase client instead of going through the `get-products` edge function. This approach:

- Costs zero Zinc API calls (uses 100% cached data from the 2,772 products already in the database)
- Guarantees each row shows different products by sorting on different dimensions
- Eliminates the text-matching problem entirely
- Respects the existing product catalog caching logic (products table IS the cache)
- Clicking a product from these rows will still use `get-product-detail` edge function as normal, which checks cache first before calling Zinc

## Three Rows, Three Sort Dimensions

| Row | Sort Logic | What it shows |
|-----|-----------|---------------|
| **Trending Right Now** | `view_count DESC` | Most-viewed products (real user engagement data) |
| **New Arrivals** | `created_at DESC` | Most recently added to catalog |
| **Top Rated** | `metadata->>'review_count' DESC` where review_count > 10 | Products with the most verified reviews |

Each query returns 8 products, totaling 24 products across all three rows -- all from cache, zero API cost.

## Product Click / Detail View Caching

When a user clicks a product from these rows, the existing `get-product-detail` edge function handles it. That function already checks the products table cache first before calling Zinc. Since all products shown here are already in the cache (they came from the products table), clicking them will NOT trigger a Zinc API charge. The caching logic is fully preserved.

## Technical Changes

### File: `src/components/marketplace/landing/TrendingProductsSection.tsx`

Replace the `productCatalogService.searchProducts()` calls with direct Supabase queries on the `products` table. Each row gets its own optimized query:

- **Trending**: `supabase.from('products').select('*').order('view_count', { ascending: false }).limit(8)`
- **New Arrivals**: `supabase.from('products').select('*').order('created_at', { ascending: false }).limit(8)`
- **Top Rated**: `supabase.from('products').select('*').not('metadata->review_count', 'is', null).order('view_count', { ascending: false }).limit(8)` with client-side sort by review_count (since Supabase can't sort on JSONB fields directly via the client)

The product mapping logic stays the same -- we just need to map from the `products` table column names (e.g., `image_url` instead of `image`) to the `Product` type. The `metadata` JSONB field provides stars, review_count, images, and other enrichment data.

Progressive loading with staggered delays is kept to avoid overwhelming the database with simultaneous queries.

### No other files change

- `StreamlinedMarketplaceWrapper.tsx` -- already renders TrendingProductsSection correctly
- `CategorySection` component -- already handles the product card rendering
- `get-products` edge function -- untouched, still handles all search/category requests
- `get-product-detail` edge function -- untouched, still handles product clicks with cache-first lookup
- Product cards and pricing logic -- untouched

