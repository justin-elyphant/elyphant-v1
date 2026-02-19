
# Fix Sparse Grid: Merge Cache + Zinc Results and Lower Filter Threshold

## Problem Summary

Three interconnected bugs prevent the marketplace from filling the 24-product grid:

1. **Sparse threshold too low (8)**: "Tactical knives" returns 11 cached products, which passes the threshold of 8, so Zinc is never called to supplement. The grid shows 11 items with white spaces.
2. **No merge logic**: When sparse results DO trigger a Zinc fallback, the cached products are discarded entirely. The system returns ONLY Zinc results instead of combining cache + Zinc.
3. **"Find more" returns duplicates**: The skip-cache Zinc call returns ~51 products, brand filter reduces to 5, and those 5 overlap with the 11 already displayed. Frontend deduplication removes them all, so nothing new appears despite the "Found 5" toast.

```text
Current flow (broken):
  Cache: 11 products → threshold 8 → "enough!" → return 11 only → white spaces

  "Find more" (skip_cache): Zinc 51 → brand filter → 5 → all duplicates → 0 new

Desired flow (fixed):
  Cache: 11 products → threshold = limit (24) → "need more" → call Zinc
  → merge cache(11) + Zinc(new ones) → deduplicate → return 20+ products → full grid
```

## Changes

### 1. Edge function: Raise threshold and add merge logic

**File: `supabase/functions/get-products/index.ts`**

**a) Raise MIN_RESULTS_THRESHOLD from 8 to match the requested `limit` (default 24)**

Change line 1203:
- From: `const MIN_RESULTS_THRESHOLD = 8;`
- To: `const MIN_RESULTS_THRESHOLD = Math.max(limit, 20);`

This ensures any search returning fewer products than the grid size triggers Zinc supplementation.

**b) Add merge logic: when Zinc is called as supplement, KEEP cached products and APPEND new Zinc results**

Currently (lines 1208-1214), when sparse results are detected, the code falls through to a Zinc-only path that discards cached products entirely. The fix:

- Save the cached `sortedProducts` in a variable (e.g., `cachedProducts`) before falling through
- After the Zinc API call, normalize, and filter results (line ~1313), merge:
  - Start with `cachedProducts`
  - Collect IDs of cached products into a Set
  - Append Zinc products whose product_id/asin is NOT in that Set
- This gives us cache(11) + new Zinc items = closer to 24

**c) Make "Find more" (skip_cache) also request page 2 from Zinc**

Currently skip_cache sends the same `page=1` query, getting the same ~51 products that are already cached. Add `page=2` parameter when `skip_cache=true` so Zinc returns genuinely different products that won't all be filtered as duplicates.

### 2. Frontend: Show correct count in toast after dedup

**File: `src/components/marketplace/StreamlinedMarketplaceWrapper.tsx`**

In `handleFindMoreResults` (lines 247-264), after adding products to `extraProducts`, the toast should reflect how many NEW (non-duplicate) products were actually added, not the raw count from the API.

- After deduplication against existing `displayProducts`, count genuinely new items
- Show "Found X new products" with the deduplicated count
- If 0 new after dedup, show "No new products found" instead of a misleading success toast

### 3. Grid: Fill incomplete rows with a visual treatment

**File: `src/components/marketplace/components/OptimizedProductGrid.tsx`**

This is optional but improves UX: when the last grid row has fewer items than columns, the empty cells look broken. A simple CSS fix using `grid-auto-rows: 1fr` and ensuring cards stretch properly will make partial rows look intentional rather than broken.

## Technical Details

### Merge algorithm (edge function)
```text
1. cachedProducts = brand-filtered cache results (11 items)
2. Call Zinc API for fresh results
3. zincProducts = normalize + brand-filter Zinc results
4. cachedIds = Set of product_id/asin from cachedProducts
5. newZincProducts = zincProducts.filter(p => !cachedIds.has(p.product_id || p.asin))
6. merged = [...cachedProducts, ...newZincProducts].slice(0, limit)
7. Cache new Zinc products in background
8. Return merged results with fromCache: false
```

### Cache-cost alignment
- First search: cache hit returns 11 products (free, no Zinc call)
- BUT 11 < 24, so Zinc is called ONCE to supplement (one API call at $0.01)
- New Zinc products are cached in background
- Next identical search: cache now has 11 + new = 20+ products, likely passes threshold with no Zinc call
- "Find more" requests page 2, getting genuinely new inventory

### Files modified
1. `supabase/functions/get-products/index.ts` -- raise threshold, add merge logic, page 2 for skip_cache
2. `src/components/marketplace/StreamlinedMarketplaceWrapper.tsx` -- accurate toast after dedup
3. `src/components/marketplace/components/OptimizedProductGrid.tsx` -- optional grid fill fix
