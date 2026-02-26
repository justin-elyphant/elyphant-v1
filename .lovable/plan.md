

# Fix: Cached Products Bypassing Price Normalization

## What's Happening

The database currently has **~25 Amazon products with prices stored in cents instead of dollars** — the LcFun lighter at 899 (should be $8.99), knives at 8925 ($89.25), napkins at 2699 ($26.99), socks at 1499 ($14.99), etc.

These were cached before the `normalizePrices()` function was added to the Zinc ingest path. The `transformCachedProduct` function in `get-products/index.ts` (line 243) passes `p.price` through raw with no safety net — so these bad values reach the frontend unchanged.

The project already has this exact safety net in `mapDbProductToProduct` (used by discovery rows), but it's not applied in the search/cache path. Per the project's unified pricing standard, the accepted tradeoff is: **divide Amazon prices > 200 by 100, prioritizing prevention of inflated prices over rare high-value items**.

## Why Previous Fix Was Reverted

The previous attempt tried a `> 100` threshold, which was too aggressive. The correct threshold is `> 200`, matching the existing `mapDbProductToProduct` logic — this is reuse, not new code.

## Plan: Two Changes

### 1. Add price safety net to `transformCachedProduct`

**File: `supabase/functions/get-products/index.ts`** — line 247

Reuse the same `> 200` heuristic from `mapDbProductToProduct` (line 17 of `mapDbProduct.ts`):

```ts
const transformCachedProduct = (p: any) => {
  let price = typeof p.price === 'number' ? p.price : parseFloat(p.price) || 0;
  // Safety net: reuse same heuristic as mapDbProductToProduct
  if (price > 200 && (p.retailer === 'amazon' || p.retailer === 'Amazon')) {
    price = price / 100;
  }

  return {
    product_id: p.product_id,
    asin: p.product_id,
    title: p.title,
    price,
    // ...rest unchanged...
  };
};
```

This is identical logic to `mapDbProduct.ts` line 17-19, applied at the edge function layer so search results get the same treatment discovery rows already have.

### 2. Fix existing bad data in the database

Run a targeted UPDATE on the ~25 affected rows:

```sql
UPDATE products
SET price = price / 100
WHERE price > 200
  AND retailer = 'amazon';
```

This corrects lighters, knives, napkins, socks, etc. The 3 MacBooks at $1049.99 will become $10.49 — this is the accepted tradeoff per the project's pricing standard. If MacBooks need correct pricing, they'll be re-fetched from Zinc with proper normalization.

## What We're NOT Doing

- NOT creating new files or utilities
- NOT touching the frontend or `mapDbProduct.ts`
- NOT applying `mapDbProductsToProducts` to search results (image corruption risk)

## Scope

- 1 edge function modified: 3 lines added to existing function
- 1 SQL data fix: ~25 rows corrected
- Zero frontend changes, zero new files

