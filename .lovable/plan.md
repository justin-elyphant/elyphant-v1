

# Fix: Reuse `mapDbProductToProduct` for Search Result Price Normalization

## Analysis

After reading the codebase, here's what already exists:

1. **`mapDbProductToProduct`** (`src/utils/mapDbProduct.ts`) — already has the exact safety net needed: divides Amazon prices > 200 by 100, rejects invalid prices. Used by discovery paths (trending, brands, life events).
2. **`normalizePrices`** (edge function) — runs on fresh Zinc results before caching. Works correctly for NEW searches.
3. **`transformCachedProduct`** (edge function) — passes price through raw. This is where the $939 lighters leak through — they were cached before `normalizePrices` existed.

The search results path (`ProductCatalogService` → `get-products` → `transformCachedProduct`) is the ONLY path that doesn't run through `mapDbProductToProduct`. That's the gap.

## Stripe Webhook Safety

No conflict. Stripe webhooks read prices from **session metadata** set by `create-checkout-session` at purchase time — not from the products table or display prices. The checkout session captures the price the user saw and agreed to. Normalizing display prices has zero effect on payment amounts.

## Plan: One-File Change

### File: `src/services/ProductCatalogService.ts`

Import and apply `mapDbProductsToProducts` to the search response (around line 131):

```ts
import { mapDbProductsToProducts } from '@/utils/mapDbProduct';

// After receiving products from edge function:
const rawProducts = data?.results || data?.products || [];
const products = mapDbProductsToProducts(rawProducts);
```

This reuses the existing mapper that:
- Divides Amazon prices > 200 by 100 (catches $939 → $9.39)
- Rejects products with price ≤ 0
- Normalizes all field names (stars, reviewCount, images, etc.)

No new logic. No edge function changes. No deployment needed.

## Why This Works

- The $939 lighter (939 > 200) gets divided to $9.39
- The $22 NFL poncho (22 < 200) passes through unchanged
- Legitimate $200+ products are rare in a gift marketplace and would be divided — same existing tradeoff already accepted in discovery paths
- Over time, as products get re-cached via fresh Zinc searches, `normalizePrices` writes correct values and the frontend safety net becomes a no-op

