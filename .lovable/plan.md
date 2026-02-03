

# Plan: Fix Product Pricing Normalization Chain

## Issues Identified

Based on investigation, there are two core bugs causing the pricing problems in the auto-gift emails:

| Issue | Evidence | Root Cause |
|-------|----------|------------|
| **$3,374 water bottle** | `products` table has `price: 3374.00` for product `B0DJCJ9DB7` | Raw Zinc cents cached BEFORE `normalizePrices()` is called |
| **$0 Adidas shoes** | `products` table has `price: 0.00` for product `B09VCPFG24` | Zinc API returns null/0 for some products (no fix available) |
| **$97 jersey passed $50 filter** | Appeared in previous run | Already fixed in prior update; filter now converts to cents |

## Root Cause Deep Dive

In `get-products/index.ts`, the execution order is problematic:

```text
1. Zinc API returns prices in CENTS (3374 = $33.74)
2. Price filtering runs (NOW FIXED - converts max_price to cents)
3. processAndReturnResults() is called (line 1308)
   → Inside: cacheSearchResults() runs with RAW CENTS ❌
   → Products cached with price: 3374
4. normalizePrices() is called (line 1286) - but ONLY on filteredResults
   → processedResults in cacheSearchResults still had raw cents
```

The `cacheSearchResults` at line 582 receives `processedResults` BEFORE any price normalization occurs.

## Solution

### Fix 1: Normalize Prices BEFORE Caching

Move `normalizePrices()` to run BEFORE `processAndReturnResults()` so cached data has correct dollar values.

**File:** `supabase/functions/get-products/index.ts`

Current order (around lines 1280-1320):
```javascript
// Current (WRONG ORDER):
filteredResults = normalizePrices(filteredResults);  // Line 1286
const searchResponse = await processAndReturnResults(...);  // Line 1308
// cacheSearchResults inside processAndReturnResults uses raw cents!
```

Fixed order:
```javascript
// Move normalization EARLIER in the pipeline
// 1. Apply price filter (already using cents comparison)
// 2. Apply brand filter
// 3. Apply unsupported filter
// 4. Normalize prices ← BEFORE processAndReturnResults
// 5. processAndReturnResults (which caches the normalized data)
```

### Fix 2: Handle Zero-Price Products Gracefully

Add validation in the orchestrator to skip products with `price === 0` or `price === null`:

**File:** `supabase/functions/auto-gift-orchestrator/index.ts`

```javascript
// After gender filtering, also filter out zero-price products
if (products.length > 0) {
  products = products.filter((p: any) => {
    const price = p.price;
    return price && price > 0;
  });
}
```

### Fix 3: Update Historical Cached Data

Run a one-time update to normalize existing cached prices in the `products` table:

```sql
-- Fix products with prices that appear to be in cents (> $200)
UPDATE products 
SET price = price / 100 
WHERE price > 200 
  AND retailer = 'amazon';
```

This converts values like `3374` → `33.74` for obviously-cents prices.

### Fix 4: Add Fallback Normalization in Orchestrator

As a safety net, normalize prices when mapping products in the orchestrator:

**File:** `supabase/functions/auto-gift-orchestrator/index.ts`

```javascript
// Normalize price (safety net for legacy cached data)
const rawPrice = products[0].price;
const normalizedPrice = typeof rawPrice === 'number' && rawPrice > 200 
  ? rawPrice / 100 
  : rawPrice;

const mapped = {
  product_id: products[0].product_id || products[0].asin,
  name: products[0].title || products[0].name,
  price: normalizedPrice,  // Use normalized value
  image_url: products[0].image || products[0].main_image,
  interest_source: interest
};
```

## Files Modified

| File | Changes |
|------|---------|
| `supabase/functions/get-products/index.ts` | Move `normalizePrices()` call earlier in pipeline (before `processAndReturnResults`) |
| `supabase/functions/auto-gift-orchestrator/index.ts` | 1) Filter out zero-price products, 2) Add fallback price normalization |

## Test Plan

After deployment:

1. **Re-run orchestrator** with simulated date `2026-12-18`
2. Verify in email:
   - [ ] Water bottle shows ~$33.74 (not $3,374)
   - [ ] No $0.00 products appear
   - [ ] All products under $50 budget
   - [ ] No women's products for male recipients (after gender column is added)
3. Check database:
   - [ ] New cached products have normalized prices

## Technical Details

### Price Normalization Heuristic

The existing heuristic `price > 100 ? price / 100 : price` works for most cases but has edge cases:

| Raw Value | Interpretation | Normalized |
|-----------|----------------|------------|
| 3374 | $33.74 in cents | 33.74 ✅ |
| 35.9 | $35.90 in dollars | 35.9 ✅ |
| 150 | Ambiguous ($1.50 or $150?) | 1.50 ⚠️ |

For safety, I'll use a higher threshold (`> 200`) in the orchestrator fallback to avoid misinterpreting $150 products as $1.50.

