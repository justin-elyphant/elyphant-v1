

## Plan: Ensure Brand Name Displays on All Product Cards

### Problem
- 6,020 out of 8,502 products (71%) have `brand = NULL` in the database
- The Zinc search API doesn't always return brand data
- The `ProductCard.tsx` already has brand display logic (lines 358-363), but it only shows when `product.brand` is truthy
- The `standardizeProduct()` function in `productUtils.ts` already has an `extractBrandFromTitle()` fallback, but `mapDbProductToProduct()` (used by discovery rows and brand pages) does NOT use this fallback

### Root Causes
1. **`mapDbProductToProduct`** sets `brand: row.brand || ""` -- empty string is falsy, so the card hides it, but it doesn't attempt title extraction
2. **`get-products` edge function** returns `brand: p.brand` which is often `null` from the DB
3. Products pass through `standardizeProduct()` in some flows (which extracts brand from title) but NOT in others (e.g., `TrendingProductsSection`, `BrandAllItems`, `LifeEventAllItems` which use `mapDbProductsToProducts` directly)

### Solution

**Step 1: Add brand extraction fallback to `mapDbProductToProduct`**
- Import or duplicate the `extractBrandFromTitle` utility from `productUtils.ts` into `src/utils/mapDbProduct.ts`
- Update the mapper to use: `brand: row.brand || extractBrandFromTitle(row.title || "") || ""`
- This ensures ALL code paths that use this mapper (discovery rows, brand pages, life event pages) get brand names

**Step 2: Add brand extraction in the `get-products` edge function response mapper**
- Add a simple brand extraction function to the edge function (lines ~269-290)
- Update line 277 from `brand: p.brand` to `brand: p.brand || extractBrandFromTitle(p.title || "")`
- This ensures brand is populated at the API level for all consumers

**Step 3: Verify `ProductCard.tsx` brand display works across all views**
- No changes needed to `ProductCard.tsx` -- it already displays brand when present
- No changes needed to `standardizeProduct()` -- it already has the fallback

### Technical Details
- The `extractBrandFromTitle` function uses regex patterns to find brand names at the start of Amazon-style titles (e.g., "SAFAVIEH Area Rug" → "SAFAVIEH", "Disney Mickey Mouse" → "Disney")
- Two files modified: `src/utils/mapDbProduct.ts` and `supabase/functions/get-products/index.ts`
- One edge function redeployment required

### Impact
- All 6,020 products currently missing brand will show extracted brand names where parseable from titles
- Brand display becomes consistent across marketplace grid, discovery rows, brand pages, and life event pages

