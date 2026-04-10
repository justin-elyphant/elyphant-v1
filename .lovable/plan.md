

## Plan: Seed Full Product Catalog (All 32 Categories)

### Current State
- Zinc API is **working** -- tested live, no 500 errors
- Electronics category just seeded successfully (16 products added)
- `get-products` returns cached products correctly with enrichment
- 32 categories need seeding, estimated cost: **$0.64** (64 API calls)
- The dry run shows `existing: 0` for electronics even after seeding -- this is a minor counting bug in the `search_terms` lookup (the seeded data uses exact match `"electronics"` but the count query uses `ilike` with `OR` across two conditions, which should work). This doesn't block seeding.

### What the Plan Does

**Step 1: Run full catalog seed** (no code changes needed)
- Call the `seed-product-catalog` edge function with all 32 categories
- This will make ~64 Zinc API calls ($0.64) and add ~1,000-1,350 products to the `products` table
- Categories include: electronics, fashion, home, beauty, sports, books, toys, baby, jewelry, kitchen, tech, gaming, wedding subcollections, baby subcollections, etc.

**Step 2: Verify storefront product availability**
- Test `get-products` for several categories to confirm cache-first serving
- Verify the storefront displays products without hitting Zinc API (zero-cost discovery)

**Step 3: Fix the existing count query in seed function** (minor)
- The `existing` count check in `seed-product-catalog` may undercount due to the OR condition. Fix it so re-running the seed function correctly skips already-stocked categories (idempotent).

### Technical Details
- No frontend code changes needed
- The seed function already handles deduplication via `upsert` on `product_id`
- Products are stored with `search_terms`, `metadata.seeded_category`, and `popularity_score`
- The `get-products` function already has cache-first lookup, brand-aware filtering, and popularity sorting

### Risk
- Low: $0.64 total Zinc API cost
- The seed function has a 3-page cap per category and 300ms delays between pages
- Edge function timeout could be an issue for 32 categories in a single call -- may need to batch into groups of 8-10 categories per call

