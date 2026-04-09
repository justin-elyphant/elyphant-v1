

## Fix `get-products` Edge Function Crash

### Problem
Every search crashes with: `TypeError: supabase.rpc(...).catch is not a function`

The Supabase JS client's `.rpc()` returns a `PostgrestFilterBuilder`, which supports `.then()` but NOT `.catch()`. Three locations in `get-products/index.ts` call `.catch()` directly on the RPC result, causing the entire function to throw.

### Fix

**File: `supabase/functions/get-products/index.ts`** — 3 locations

Wrap each `.rpc()` call in a proper async pattern. Replace `.catch()` chains with `.then()` error handling or wrap in an async IIFE:

1. **Line 639**: `supabase.rpc('increment_search_impressions', {...}).then(...).catch(...)` → wrap in async IIFE with try/catch
2. **Line 1212**: Same pattern → same fix
3. **Line 1388**: `supabase.rpc('increment_search_impressions', {...}).catch(() => {})` → wrap in async IIFE with try/catch

Each becomes:
```typescript
EdgeRuntime.waitUntil(
  (async () => {
    try {
      await supabase.rpc('increment_search_impressions', { product_ids: ids });
      console.log(`Incremented impressions for ${ids.length} products`);
    } catch (_) { /* non-critical */ }
  })()
);
```

Then redeploy the `get-products` edge function.

### Files Modified
- `supabase/functions/get-products/index.ts` (3 edits)

