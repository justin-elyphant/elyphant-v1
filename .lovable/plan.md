

## Plan: Add Live Fallback to search-suggestions Edge Function

### Problem
`search-suggestions` only queries the local `products` table. Uncached terms return nothing.

### Solution
In `supabase/functions/search-suggestions/index.ts`, after the existing products query returns empty results, invoke `get-products` server-side as a fallback.

### Caching Behavior (Already Built)
`get-products` already upserts all Zinc results into the `products` table on every call. So:
- **First search for "legos"**: fallback fires, Zinc API called (~$0.01), results cached + returned
- **Second search for "legos"**: local `products` table query returns cached rows instantly, no fallback needed, **$0 cost**

No additional caching code is needed — it's already baked into `get-products`.

### Changes

**File: `supabase/functions/search-suggestions/index.ts`**

After the parallel query block (around line 78), add a fallback branch:

1. Check if `productsResult.data` is empty and `normalizedQuery` has content
2. If so, call `get-products` via `supabase.functions.invoke('get-products', { body: { query: normalizedQuery, limit: 5 } })` using a fetch to the Supabase functions URL with the service role key (server-to-server)
3. Map fallback products into the same `{ id, title, price, image, brand, type }` shape
4. Generate text suggestions from fallback product titles (same logic already in the function)
5. Add a 3-second timeout via `AbortSignal.timeout(3000)` so the dropdown stays responsive

No client-side changes needed — the hook and UI already handle the response shape.

