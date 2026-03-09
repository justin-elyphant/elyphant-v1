

## Problem

The Shopify Storefront API call fails with a **CORS error** ("Failed to fetch"). The browser blocks the direct request from the Lovable preview domain (`*.lovableproject.com`) to `elyphant-iayjj.myshopify.com`. While Shopify's Storefront API generally supports CORS, development stores on free plans often don't allow cross-origin requests from arbitrary domains.

## Solution: Proxy via Supabase Edge Function

Create a lightweight edge function that proxies Storefront API requests, bypassing browser CORS restrictions entirely. Server-to-server calls have no CORS limitations.

### Changes

**1. Create edge function `shopify-storefront-proxy`**
- Accepts a JSON body with `query` and `variables`
- Forwards the request to Shopify's Storefront API server-side using the hardcoded store domain and token
- Returns the Shopify response to the client
- Adds proper CORS headers for the Lovable preview domain

**2. Update `src/lib/shopify.ts`**
- Change `storefrontApiRequest()` to call the Supabase edge function instead of hitting Shopify directly
- Keep all types and queries unchanged -- only the transport layer changes

### What stays the same
- All GraphQL queries, types, and product mapping logic
- All hooks (`useShopifyConnection`, `useShopifySync`, `useShopifyIntegration`)
- All UI components
- The store URL, token, and API version constants (moved to edge function)

