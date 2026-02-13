

# Improve Search Relevance and Product Discovery

## Problems Identified

1. **"Adidas mens socks" returns running shoes** -- The cache has zero Adidas socks. The OR-fallback query in `getCachedProductsForQuery` matches products containing "adidas" OR "mens" (ignoring "socks" entirely). The brand-aware filter then passes them because "adidas" brand match (+100) plus "mens" title match (+50) = 150, meeting the threshold. The critical product-type keyword ("socks") has no special weight.

2. **No "Load More" / "See More" button** -- The server returns all matching products in one batch (e.g., 13). Client-side pagination uses `pageSize=20`, so all 13 fit on page 1 and `hasMore` is `false`. No mechanism exists to fetch additional results from Zinc when the cache is sparse.

## Solution: 3 Industry-Standard Improvements

### 1. Enforce Product-Type Keywords in Relevance Scoring

**File:** `supabase/functions/shared/brandAwareFilter.ts`

Currently, all non-brand search terms are weighted equally (50 points for title match). For "adidas mens socks," the word "socks" is the product-type differentiator but gets the same score as "mens."

**Changes:**
- After scoring, add a **product-type enforcement check**: if a multi-word search has non-brand, non-generic terms (not "mens", "womens", "kids", etc.), at least ONE of those terms must appear in the product title/category. If none appear, apply a heavy penalty (-200).
- Define a small set of generic/modifier words to exclude from enforcement: `["mens", "womens", "women", "men", "kids", "boys", "girls", "unisex", "adult", "junior", "youth", "small", "medium", "large", "new", "best"]`
- This ensures "socks" must appear somewhere in the product data, otherwise the product gets filtered out regardless of brand match.

This is a **universal** solution (no product-specific mappings) that scales to any query like "Nike running shorts," "Sony wireless earbuds," etc.

### 2. Add "Search for More" Button When Results Are Sparse

**File:** `src/components/marketplace/StreamlinedMarketplaceWrapper.tsx`

When the initial result set is small (under 20 products) and came from cache, add a "Search for more [query] on Amazon" button below the grid. Clicking it triggers a fresh Zinc API call that bypasses the cache.

**Changes:**
- Below the existing "Load More Products" button, add a new conditional block: if `fromCache === true` and `total < 20` and there's an active search term, show a "Find more results" button.
- On click, re-invoke the product search with a `skipCache: true` parameter.
- In `get-products/index.ts`, respect a new `skip_cache` body parameter to bypass `getCachedProductsForQuery` and go directly to the Zinc API.

### 3. Show "Load More Products" When Server Has More Pages

**File:** `supabase/functions/get-products/index.ts` and `StreamlinedMarketplaceWrapper.tsx`

The Zinc API returns a `total` count that can be much larger than the returned page. Currently this information is passed through but the frontend doesn't use it to offer pagination.

**Changes:**
- In the edge function response, ensure `hasMore: true` is set when `total > products.length`.
- In `StreamlinedMarketplaceWrapper`, update `hasMore` to also check the server's `hasMore` flag (from the API response), not just client-side array length.
- Wire the existing `handleLoadMore` callback (already implemented) to actually trigger when the server signals more pages exist.

## Technical Summary

```text
File Changes:
1. supabase/functions/shared/brandAwareFilter.ts
   - Add GENERIC_MODIFIERS list
   - Add product-type enforcement penalty in calculateRelevanceScore()

2. supabase/functions/get-products/index.ts  
   - Add skip_cache parameter support
   - Ensure hasMore flag reflects Zinc API total

3. src/components/marketplace/StreamlinedMarketplaceWrapper.tsx
   - Add "Find more results" button for sparse cache results
   - Update hasMore to use server-side flag
   - Wire server-side pagination into loadMore
```

## Expected Outcomes

- "Adidas mens socks" will return zero results from cache (shoes get penalized for missing "socks"), triggering a fresh Zinc API call that returns actual socks
- Sparse results always show a path to find more products
- Users see a "Load More Products" button when the Zinc API has additional pages beyond the initial 20
