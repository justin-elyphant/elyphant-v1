

# Fix: LcFun Lighter $899 Price — Minimal, Safe Approach

## Root Cause

The `normalizePrices()` function runs before caching Zinc results, but 20+ products in the database already have cent-as-dollar prices (e.g., LcFun lighter at 1999 = $19.99, a knife at 8925 = $89.25). These were likely cached before the normalization logic was added or via a code path that bypassed it.

## Why the Previous Fix Corrupted Images

The `mapDbProductToProduct` mapper (line 24 of `mapDbProduct.ts`) reads `row.image_url` — the **database column name**. But search results from the edge function already transform this to `image` via `transformCachedProduct`. Piping search results through `mapDbProductsToProducts` sets every product's image to `"/placeholder.svg"` because `row.image_url` is undefined on those objects. **We must NOT use this mapper on search results.**

## Plan: Two Targeted Changes, Maximum Reuse

### Change 1: Add price safety net to `transformCachedProduct` (edge function)

**File: `supabase/functions/get-products/index.ts`** — `transformCachedProduct` function (line 243)

Add the same `> 100` threshold already used by `normalizePrices` (line 1000). This is reusing existing logic, not creating new code:

```ts
const transformCachedProduct = (p: any) => {
  let price = typeof p.price === 'number' ? p.price : parseFloat(p.price) || 0;
  // Reuse same heuristic as normalizePrices(): cents > 100 → divide by 100
  if (price > 100) {
    price = price / 100;
  }

  return {
    product_id: p.product_id,
    // ...everything else unchanged...
    price,
    // ...
  };
};
```

This catches all cached cent-as-dollar prices at the **source** before they reach the frontend. No new functions, no new files.

### Change 2: Fix bad data already in the database

One-time data fix using the insert/update tool:

```sql
UPDATE products 
SET price = price / 100 
WHERE price > 200 
  AND retailer = 'amazon';
```

This corrects the 20+ products currently stored with inflated prices. The edge function safety net prevents future occurrences.

### What We Are NOT Doing

- **NOT** applying `mapDbProductsToProducts` to search results in `StreamlinedMarketplaceWrapper` — this is what corrupted images last time
- **NOT** creating any new files, hooks, or utilities
- **NOT** modifying the frontend display layer at all
- **NOT** changing `mapDbProduct.ts` — it works correctly for discovery rows where data comes directly from the DB

## Scope

- 1 edge function modified: `get-products/index.ts` (add 3 lines to existing function)
- 1 data fix: UPDATE statement for ~20 rows
- Zero frontend changes
- Zero new files

