

## Product Seeding Gap Analysis

### Current State
The `seed-product-catalog` edge function seeds 32 categories (22 primary + 10 subcollections). The `CATEGORY_REGISTRY` in `get-products` has entries for the SubCategoryTabs filters (`luxury`, `gifts-for-her`, `gifts-for-him`, `gifts-under-50`).

### What's Missing from Seeding

**SubCategoryTabs filters (in CATEGORY_REGISTRY but NOT in seed catalog):**
- `gifts-for-her` — has 5 query groups in registry, zero pre-seeded products
- `gifts-for-him` — has 6 query groups in registry, zero pre-seeded products
- `gifts-under-50` — has 6 query groups in registry, zero pre-seeded products
- `luxury` — has 4 query groups in registry, zero pre-seeded products

**Lifestyle categories from homepage "Gifts for Every Lifestyle" grid (NOT in registry OR seed catalog):**
- `on-the-go` — no registry entry, no seeded products
- `movie-buff` — no registry entry, no seeded products
- `work-from-home` — no registry entry, no seeded products
- `the-traveler` — no registry entry, no seeded products
- `the-home-chef` — no registry entry, no seeded products
- `teens` — no registry entry, no seeded products

These 10 categories will return zero cached products on first click, forcing a live Zinc API call (or showing nothing if Zinc is slow/down).

### Plan

**1. Add 10 entries to `SEED_CATEGORIES` in `seed-product-catalog/index.ts`**

Using search terms optimized for Amazon/Zinc results:

```text
gifts-for-her    → "gifts for her women birthday skincare candles jewelry spa"
gifts-for-him    → "gifts for him men grooming tech gadgets watches tools"
gifts-under-50   → "best gifts under 50 dollars stocking stuffers affordable"
luxury           → "luxury gifts designer accessories premium watches jewelry"
on-the-go        → "portable electronics travel accessories commuter gear water bottles"
movie-buff       → "streaming devices home theater popcorn maker movie collectibles blankets"
work-from-home   → "home office desk accessories ergonomic keyboard monitor stand organizer"
the-traveler     → "travel luggage packing cubes neck pillow travel accessories organizer"
the-home-chef    → "kitchen gadgets cookware chef knife cutting board cooking accessories"
teens            → "teen gifts trendy accessories phone cases LED lights room decor gaming"
```

**2. Add 6 lifestyle entries to `CATEGORY_REGISTRY` in `shared/categoryRegistry.ts`**

So `get-products` can do proper cache-first lookups instead of falling through to the generic fallback:

```text
on-the-go, movie-buff, work-from-home, the-traveler, the-home-chef, teens
```

Each with 3-4 query groups matching their search terms.

**3. Run a dry-run seed** to estimate Zinc API cost before actual seeding.

Estimated cost: ~10 categories x 2-3 pages each x $0.01 = $0.20-$0.30.

### Files Changed
- `supabase/functions/seed-product-catalog/index.ts` — add 10 seed entries
- `supabase/functions/shared/categoryRegistry.ts` — add 6 lifestyle category configs
- Redeploy both edge functions

