

## Product Caching System: Gap Analysis and Recommendations

### How It Works Today

The caching system has two tiers:

1. **Search caching (DB-first):** When a user searches, `get-products` checks the `products` table first via `getCachedProductsForQuery()`. If enough cached results exist (80% of requested limit), those are returned without a Zinc API call. Otherwise, Zinc is called and results are cached via `cacheSearchResults()`.

2. **Detail caching:** When a user views a product detail page, `get-product-detail` checks the `products` table first. On cache miss, it calls Zinc, then upserts the full response into the `products` table.

3. **Popularity sorting:** Cached products get a `popularity_score` calculated from `view_count`, ratings, reviews, badges. The `sortByPopularity()` function sorts by this score when `sortBy=popularity` (the default).

---

### Gaps Found

#### Gap 1: Category/discovery rows NEVER use the cache
Lines 1142-1179 — when `activeCategory` is set (homepage rows like "Best Selling", "Gifts for Her", etc.), the code jumps directly to `searchCategoryBatch()` which calls Zinc API every time. It skips `getCachedProductsForQuery()` entirely. This means:
- Every homepage load costs multiple Zinc API calls
- Previously cached products for those categories are ignored
- Discovery rows never benefit from organic catalog growth

**Fix:** Add a cache-first lookup for category queries before calling `searchCategoryBatch()`. Use the category's query terms to check the `products` table. Only call Zinc if the cache returns insufficient results.

#### Gap 2: `popularity_score` is calculated at read-time but never persisted
`calculatePopularityScore()` runs during every search request but the computed score is never written back to the `products` table. This means:
- The DB can't sort by popularity in SQL — sorting only happens in-memory after fetching
- `getCachedProductsForQuery()` sorts by `view_count` only (line 320), not by the full popularity score
- Products with high ratings + badges but low view counts get buried

**Fix:** Persist `popularity_score` in the `products` table. Update it during `cacheSearchResults()` and `get-product-detail` upserts. Change `getCachedProductsForQuery()` to `ORDER BY popularity_score DESC` instead of `view_count`.

#### Gap 3: Cache threshold is too aggressive — forces unnecessary Zinc calls
The cache threshold is `Math.ceil(limit * 0.8)` (line 303). For a default `limit=20`, that's 16. If a query has 15 cached products, it's a "cache miss" and triggers a full Zinc API call. Additionally, the supplement threshold at line 1226 is `Math.max(limit, 20)` — so even if 19 products are cached, it supplements with Zinc.

**Fix:** Lower the cache threshold to `Math.ceil(limit * 0.5)` (50%). If 10+ products exist in cache for a 20-item request, serve them. Only supplement when results are truly sparse (< 8).

#### Gap 4: Cached products have no staleness refresh strategy
Products cached from searches have `last_refreshed_at` set once but are never refreshed unless a user happens to view the detail page (which calls `get-product-detail`). There's no mechanism to refresh stale cached data for products that haven't been individually viewed.

The `nicole-weekly-curator` cron is referenced in documentation but does not appear to be implemented/deployed.

**Fix:** This is a known gap per the project knowledge doc. Recommend implementing the Nicole weekly curator to refresh products with 10+ searches in 7 days, as designed.

#### Gap 5: Merge logic puts cached products BEFORE Zinc products (line 1379)
When supplementing sparse cache results with Zinc data, the merge is:
```
filteredResults = [...cachedProductsForMerge, ...newZincProducts].slice(0, limit);
```
This places cached products first regardless of relevance or popularity. If old/stale cached products have low scores, they still appear above fresh, higher-quality Zinc results.

**Fix:** After merging, re-sort by `popularity_score` so the best products surface regardless of source. This directly addresses your observation that cached products aren't consistently in primary position — the issue is that sorting happens before the merge, not after.

#### Gap 6: `view_count` increment happens only on detail page views
`view_count` is only incremented in `get-product-detail` (line 164). Products that appear in search results but are never clicked get `view_count = 0` and therefore low `popularity_score`. This creates a cold-start problem — new cached products can't rank highly until someone clicks them.

**Fix:** Add a lightweight impression counter. When products are returned in search results, batch-increment a `search_impression_count` field. Factor this into `popularity_score` at a lower weight (e.g., +1 per 10 impressions, capped at 20 points).

---

### Recommended Implementation Priority

| Priority | Fix | Impact | Effort |
|----------|-----|--------|--------|
| 1 | Persist `popularity_score` + sort by it in cache queries | Cached products appear in correct order | Medium |
| 2 | Add cache-first lookup for category/discovery rows | Eliminates repeated Zinc calls on homepage | Medium |
| 3 | Re-sort merged results after Zinc supplement | Best products surface regardless of source | Small |
| 4 | Lower cache threshold from 80% to 50% | Fewer unnecessary Zinc API calls | Small |
| 5 | Add search impression counting | Solves cold-start ranking problem | Medium |
| 6 | Implement Nicole weekly curator | Keeps catalog fresh without manual intervention | Large |

### Files to touch
- `supabase/functions/get-products/index.ts` — fixes 1-5
- `supabase/functions/get-product-detail/index.ts` — fix 1 (persist score on detail view)
- New migration for `popularity_score` column + `search_impression_count` on `products` table (fixes 1, 5)

### What stays unchanged
- `ProductCatalogService.ts` client-side — no changes needed
- `EnhancedCacheService.ts` — Redis layer is orthogonal to these DB-level fixes
- Zinc API integration, order flows, email orchestrator — all untouched

