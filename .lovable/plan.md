

# Fix: Product Details Page Reverting to "Unnamed Product"

## Root Cause

The Zinc Product Detail API returns an **error response** for certain products (e.g., `invalid_variant`):

```json
{"_type": "error", "status": "failed", "code": "invalid_variant", "data": {...}}
```

The `get-product-detail` edge function (line 213) does `const data = await productResponse.json()` but **never checks if `data._type === "error"`**. It spreads this error object into `enhancedData` (line 262), producing:
- `title: undefined` → becomes "Unnamed Product" after `normalizeProduct`
- `image: undefined` → becomes placeholder
- `price: 2199` (from Offers API, in cents) → shows as $21.99 initially but the real issue is the missing title/image

The frontend (`ProductDetails.tsx` line 48-72) first shows the good navigation state data, then the background `fetchProductDetail` call completes and **overwrites** the good data with the broken API response — causing the "flash then revert" behavior.

## Fix: 1 Change in Edge Function

**File: `supabase/functions/get-product-detail/index.ts`** — after line 213

Add an error check on the Zinc API response. If Zinc returns an error, fall back to cached data (if available) or return the error gracefully — don't spread error fields over the product.

```ts
const data = await productResponse.json();

// CHECK: Zinc API can return error responses (e.g., invalid_variant)
// These have _type: "error" and no product data (no title, no images)
if (data._type === 'error' || data.status === 'failed') {
  console.log(`[Zinc API ERROR] Product ${product_id}: ${data.code || data.message || 'unknown error'}`);
  
  // If we have cached data, return it even if stale — better than nothing
  if (cachedProduct) {
    console.log(`[Fallback] Returning cached data for ${product_id}`);
    const fallbackData = {
      ...cachedProduct,
      ...(cachedProduct.metadata || {}),
      image: cachedProduct.metadata?.main_image || cachedProduct.image_url,
      stars: cachedProduct.metadata?.stars,
      review_count: cachedProduct.metadata?.review_count,
      hasVariations: Boolean(cachedProduct.metadata?.all_variants?.length > 0),
      // Include variant data from the error response if available
      all_variants: data.data?.all_variants || cachedProduct.metadata?.all_variants || [],
    };
    return new Response(JSON.stringify(fallbackData), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
  
  // No cache either — return error so frontend keeps navigation state
  return new Response(JSON.stringify({ 
    error: true, 
    code: data.code,
    message: 'Product details unavailable' 
  }), {
    status: 404,
    headers: { "Content-Type": "application/json", ...corsHeaders }
  });
}
```

This prevents the broken error data from being returned as if it were a valid product. The frontend's existing fallback logic (line 132-136 of `ProductDetails.tsx`) already handles `null` returns from `getProductDetail` by keeping the navigation state — so returning a 404 will trigger that path naturally.

## Scope
- 1 edge function modified: `get-product-detail/index.ts` (add error check after line 213)
- Zero frontend changes — existing fallback logic handles this
- Zero new files

