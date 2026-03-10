

## Problem Diagnosis

The Shopify API is returning all 3 products correctly (confirmed in network logs). The issue is **Row-Level Security (RLS)** on the `products` table. The only write policy requires `service_role`:

```
Policy: "Service role can manage products"
Condition: auth.role() = 'service_role'
```

The client-side Supabase client uses the `anon` key, so every upsert is silently rejected. That's why you see "Synced 0 products."

## Plan

### 1. Create an Edge Function for Shopify product sync

Build a new `sync-shopify-products` edge function that:
- Accepts the vendor's `vendor_account_id` and the Shopify product data from the client
- Uses the service-role Supabase client to upsert products into the `products` table (bypassing RLS)
- Returns the count of successfully synced products

This is the correct pattern -- the client fetches from Shopify, then passes the data to a privileged edge function for persistence.

### 2. Update `useSyncShopifyToProducts` hook

Replace the direct `supabase.from("products").upsert(...)` calls with a single `supabase.functions.invoke("sync-shopify-products", { body: { rows } })` call. The Shopify fetch stays client-side (it already works through the proxy).

### 3. Add an RLS policy for vendor product reads (if missing)

The current SELECT policy is `true` (public), so reads are fine. No change needed there.

### 4. Wire up Dashboard metrics

The dashboard already uses `useVendorProducts` (from the previous edit). Once products actually persist, the "Active Products" count will update automatically.

### Summary of changes

| File | Action |
|------|--------|
| `supabase/functions/sync-shopify-products/index.ts` | New edge function for service-role upsert |
| `src/hooks/vendor/useSyncShopifyToProducts.ts` | Call edge function instead of direct upsert |

This is a minimal, targeted fix. The Shopify fetch and product grid display code are already working correctly -- the only gap is the RLS-blocked write path.

