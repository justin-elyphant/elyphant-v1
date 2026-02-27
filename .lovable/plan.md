

# Catch Unavailable Products at Catalog Level, Not Checkout

## Problem
A shopper browses → clicks Buy Now → enters payment → gets charged → Zinc says "invalid ASIN" → order stuck. The validation happens way too late. Products that no longer exist on Amazon should be caught before they're ever purchasable.

## Where Products Enter the System
1. **Zinc Search API** (`get-products`) — returns search results including ASINs. These can include discontinued products that Amazon still indexes but no longer sells.
2. **Products table cache** — stores previously seen products indefinitely, including ones that may have been delisted since caching.
3. **Product detail page** (`get-product-detail`) — fetches full product info when a user clicks through. This is the natural gatekeeping point.

## Strategy: Validate at Product Detail, Gate the Buy Button

Rather than adding a Zinc API call at checkout (adds latency to every purchase), catch it when the user views the product detail page — the step right before they can buy.

### Change 1: `get-product-detail` — Flag unavailable products in response
**File:** `supabase/functions/get-product-detail/index.ts`

When Zinc returns `_type: "error"` with code `invalid_product_id`, the function currently returns a 404 (line 245). Instead:
- If there's cached data, return it with `is_unavailable: true` so the frontend can show the product info but disable purchasing
- If no cache, return the 404 as today
- Also mark the product as unavailable in the `products` table so it's flagged for future visitors

```ts
// When Zinc returns invalid_product_id error:
if (cachedProduct) {
  // Mark product unavailable in DB
  await supabase.from('products').update({ 
    metadata: { ...cachedProduct.metadata, is_unavailable: true, unavailable_since: new Date().toISOString() }
  }).eq('product_id', product_id);

  return Response with { ...cachedData, is_unavailable: true }
}
```

### Change 2: Frontend — Disable Buy/Cart buttons for unavailable products
**Files:**
- `src/components/marketplace/product-details/ProductDetailsSidebar.tsx`
- `src/components/marketplace/product-details/BuyNowDrawer.tsx`

When the product has `is_unavailable: true`:
- Show a "This product is no longer available" banner
- Disable "Buy Now", "Add to Cart", "Schedule Gift", and "Create Auto-Gift" buttons
- Keep the product page visible (user might want to find alternatives)

### Change 3: Filter unavailable products from search results
**File:** `supabase/functions/get-products/index.ts`

In `enrichWithCachedData` (~line 144), when merging cached data, check if `metadata.is_unavailable === true` and exclude those products from search results. This prevents discontinued products from appearing in the grid at all.

### Change 4: Product card "Unavailable" badge (optional, low effort)
**File:** `src/components/marketplace/UnifiedProductCard.tsx`

If a cached product somehow still appears (e.g., from a direct link), show a subtle "Unavailable" badge on the card.

## Files Changed
1. `supabase/functions/get-product-detail/index.ts` — flag unavailable products in response + DB
2. `supabase/functions/get-products/index.ts` — filter out unavailable products from search results
3. `src/components/marketplace/product-details/ProductDetailsSidebar.tsx` — disable purchase buttons
4. `src/components/marketplace/product-details/BuyNowDrawer.tsx` — prevent opening for unavailable products
5. `src/components/marketplace/UnifiedProductCard.tsx` — unavailable badge

## Why Not Validate at Checkout?
- Adds 200-500ms latency to every purchase (bad UX for 99% of valid orders)
- Costs $0.01 per Zinc API call on every checkout
- User already entered payment info — telling them "sorry" after that is worse than before

## Why Product Detail Page is the Right Layer
- Already makes a Zinc API call (no extra cost)
- Natural point where we learn the product is gone
- User hasn't committed to buying yet
- We can show alternatives or similar products

