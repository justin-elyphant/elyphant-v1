

## Fix: Block Whole Foods / Grocery Items from Zinc Fulfillment

### The Problem

Product B08W28BM7D ("Bobo's Oat Bars") is sold exclusively by **Whole Foods Market** on Amazon. Zinc cannot fulfill Whole Foods, Amazon Fresh, or Prime Pantry orders -- they require special grocery logistics that Zinc's automation doesn't support.

The existing `unsupportedProductFilter.ts` only checks three Zinc boolean flags (`digital`, `fresh`, `pantry`), but many grocery/Whole Foods items don't have these flags set. The Bobo's product slipped through because Zinc's search API didn't mark it with `fresh: true`.

### The Fix (Two Layers of Defense)

**Layer 1: Strengthen the search filter** so grocery items never appear in results.

**Layer 2: Add a pre-submission check** in `process-order-v2` so if a grocery item somehow reaches checkout, it's caught before Zinc submission.

---

### Changes

**File 1: `supabase/functions/shared/unsupportedProductFilter.ts`**

Expand `isUnsupportedProduct()` to detect Whole Foods / grocery items via:

- **Category matching**: Block items in "Grocery & Gourmet Food" category (the breadcrumb for this product)
- **Seller/fulfillment detection**: Check `seller_name`, `sold_by`, or `fulfilled_by` fields for "Whole Foods"
- **Title heuristics**: Detect common grocery quantity patterns (e.g., "4 Count, 3 OZ", "Pack of 12", "Fl Oz")
- **Sub-department matching**: Block "Prime Pantry", "Amazon Fresh", "Whole Foods Market" in any category or sub-category field

New patterns added:
```
- Category: /grocery.*gourmet|amazon\s*fresh|prime\s*pantry/i
- Seller: /whole\s*foods/i on seller_name, sold_by, fulfilled_by fields
- Subcategory array: check all categories[] entries for grocery signals
```

**File 2: `supabase/functions/process-order-v2/index.ts`**

Add a pre-submission product validation step (after line 79, before Zinc API call). For each product in `line_items.items`:
- Look up the product in the `products` table to get cached category/metadata
- Run `isUnsupportedProduct()` against the cached data
- If any item is unsupported, fail the order with a clear error message ("This order contains items that cannot be fulfilled via our standard shipping") instead of submitting to Zinc and getting a confusing `internal_error`

**File 3: `supabase/functions/get-product-detail/index.ts`**

After fetching product detail from Zinc (around line 261), run the unsupported product check. If the product is unsupported, include a `fulfillment_blocked: true` flag and `blocked_reason` in the response. This allows the frontend to show a warning on the product page before add-to-cart.

### Frontend Enhancement (Optional but Recommended)

On the product detail page, if `fulfillment_blocked: true` is present, show a banner: "This item is not available for purchase through our platform" and disable the Add to Cart / Buy Now buttons.

### Technical Details

| File | Change |
|---|---|
| `supabase/functions/shared/unsupportedProductFilter.ts` | Add category, seller, and grocery pattern detection |
| `supabase/functions/process-order-v2/index.ts` | Add pre-submission unsupported product validation |
| `supabase/functions/get-product-detail/index.ts` | Return `fulfillment_blocked` flag for blocked items |
| `supabase/functions/get-products/index.ts` | Already uses the filter -- will benefit from expanded rules automatically |

### What This Prevents

- Whole Foods Market items reaching checkout
- Amazon Fresh items being ordered
- Prime Pantry items being submitted to Zinc
- Grocery & Gourmet Food category items that lack `fresh`/`pantry` flags
- Wasted Zinc API calls and confusing `internal_error` responses
- Customer confusion from failed fulfillment

