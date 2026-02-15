

## Fix: Search Bar Returns Too Few Products

### The Problem

When users search multi-word queries like "tactical knives" from the header search bar, only 1 product shows up -- even though Amazon has hundreds. This same issue affected "Levis 511 jeans" and will affect many multi-word searches.

### Root Cause (Two Issues)

**Issue 1: OR cache returns junk, then strict filter removes it all**

The cache lookup uses OR logic: find products matching "tactical" OR "knives". This pulls in tactical flashlights, knife sharpeners, cutting boards -- 24 products that are mostly irrelevant. The brand-aware filter then correctly requires BOTH terms (minScore 150), leaving only 1 product.

**Issue 2: Sparse results fallback only triggers for brand searches**

There's a "smart threshold" that falls back to the Zinc API when results are sparse (fewer than 8). But it only activates for brand searches (Nike, Sony, etc.). For generic multi-word searches like "tactical knives", it sees 1 result and serves it -- instead of calling Zinc for a full set.

### The Fix

**File: `supabase/functions/get-products/index.ts`** (lines 1184-1193)

Extend the sparse results threshold to apply to ALL multi-word searches, not just brand searches:

- Current: `hasBrandSearch && sortedProducts.length < 8` triggers Zinc fallback
- New: `(hasBrandSearch || isMultiWordSearch) && sortedProducts.length < 8` triggers Zinc fallback
- Where `isMultiWordSearch` is derived from `searchTerms.length >= 2` (already parsed)

This means "tactical knives" (1 cached result) will fall through to Zinc and return a full page of actual tactical knives.

**File: `supabase/functions/shared/brandAwareFilter.ts`** (relevance scoring)

Add basic plural stemming so "knives" matches "knife", "jeans" matches "jean", etc.:

- Add a small stemming utility that strips common English suffixes (s, es, ves to f/fe, ing, etc.)
- Apply stemming to both search terms and product title/category during scoring
- This improves cache hit quality for future searches so the OR-to-AND pipeline works better

### What This Changes

| Search | Before | After |
|---|---|---|
| "tactical knives" | 1 product (cached) | 20+ products (Zinc API call) |
| "leather wallets" | Likely sparse | Full results via Zinc fallback |
| "wireless earbuds" | Likely sparse | Full results via Zinc fallback |

### Cost Impact

Slightly more Zinc API calls ($0.01 each) for multi-word searches that have sparse cache coverage. This is the correct tradeoff -- showing 1 irrelevant product costs more in lost customers than $0.01. As the catalog grows organically, the cache will fill and these fallbacks will decrease.

### Technical Details

The sparse threshold change is a one-line edit expanding the condition. The stemming utility is ~15 lines. Both changes are in the edge function, so a redeploy is required.

