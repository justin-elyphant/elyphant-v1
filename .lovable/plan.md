

## Product Catalog Seeding Plan

### Current State: 170 total available products across 18 DB categories

| Frontend Category | DB Category Match | Products | Status |
|---|---|---|---|
| Fashion | Clothing, Shoes & Jewelry | 51 | OK |
| Sports | Sports & Outdoors | 41 | OK |
| Electronics | Electronics | 17 | Thin |
| Baby | Baby Products | 15 | Thin |
| Health | Health & Household | 11 | Thin |
| Home & Living | Home & Kitchen | 10 | Thin |
| Tech | Cell Phones & Accessories | 8 | Thin |
| Pets | Pet Supplies | 4 | Critical |
| Books | Books | 2 | Critical |
| Toys & Games | Video Games | 2 | Critical |
| Beauty | Beauty & Personal Care | 1 | Critical |
| **Flowers** | *(none)* | **0** | Empty |
| **Athleisure** | *(none)* | **0** | Empty |
| **Arts & Crafts** | *(none)* | **0** | Empty |
| **Wedding** | *(none)* | **0** | Empty |
| **Best Selling** | *(none)* | **0** | Empty |
| **Jewelry** | *(none)* | **0** | Empty |
| **Kitchen** | *(none)* | **0** | Empty |
| **Music** | *(none)* | **0** | Empty |
| **Gaming** | *(none)* | **0** | Empty |
| **Gifts** | *(none)* | **0** | Empty |
| **Bags & Purses** | *(none)* | **0** | Empty |

**11 of 22 categories are completely empty. 5 more have fewer than 10 products.**

### Target: 40 products per category (minimum viable for e-commerce browsing)

This is the threshold where a category page feels "stocked" with 2+ pages of results and enough variety to shop meaningfully.

### Seeding Strategy

Create a `seed-product-catalog` edge function that iterates through each category's `searchTerm` from `UNIVERSAL_CATEGORIES`, calls the Zinc search API, and upserts results into the `products` table with full metadata and calculated `popularity_score`.

**Per-category approach:**
- Use 2 Zinc search calls per category (page 1 + page 2) to get ~40 unique products
- Each call returns ~20 results
- Deduplicate by `product_id` (ASIN)

### Cost Estimate

| Item | Count | Cost |
|---|---|---|
| Categories to seed (empty) | 11 | |
| Categories to top-up (< 40) | 7 | |
| Total categories | 18 | |
| Zinc calls per category | 2 (page 1 + page 2) | |
| **Total Zinc API calls** | **36** | |
| Cost per call | $0.01 | |
| **Total seeding cost** | **$0.36** | |

If we also want to run `get-product-detail` on each product for full metadata (images, variants, descriptions), that adds ~720 calls at $0.01 each = **$7.20 extra**. This is optional but recommended for categories where rich detail pages matter (Electronics, Jewelry, Beauty).

**Recommended budget: $0.36 (search only) to $7.56 (search + detail enrichment)**

### Implementation

**1. New edge function: `seed-product-catalog`**
- Accepts optional `categories` array param (or seeds all if omitted)
- Accepts `target_per_category` param (default: 40)
- For each category: checks current DB count, calculates deficit, calls Zinc search for remaining
- Upserts into `products` table with `popularity_score` calculated
- Returns summary report of products added per category

**2. Invocation**
- Call via `supabase functions invoke seed-product-catalog` with a JSON body specifying which categories to seed
- Can be run incrementally (safe to re-run — upserts by `product_id`)

**3. Category mapping fix**
- The current `searchCategoryBatch` in `get-products` maps frontend category values to Zinc queries but doesn't filter cached products by category column. The seed function will store the frontend category value (e.g., "flowers", "wedding") in addition to Zinc's native category, so cache-first lookups work correctly.

### Files to create/modify
- **New:** `supabase/functions/seed-product-catalog/index.ts` — the seeding function
- **Modify:** `supabase/functions/get-products/index.ts` — ensure `search_terms` column stores the frontend category value so cache lookups match

### What stays unchanged
- All existing cached products remain untouched
- `get-product-detail`, `popularity_score` logic, impression tracking — all unchanged
- Frontend category cards, navigation — no changes needed

