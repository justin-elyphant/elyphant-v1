

## Plan: Wire Vendor Shopify Integration to Real Storefront API

### Context
Your Shopify development store (`elyphant-iayjj.myshopify.com`) is live with 0 products. The current vendor integration code in `shopifyUtils.ts` uses entirely mock data -- simulated delays, hardcoded products, and fake connection flows. For beta vendors to have a good experience, this needs to hit the real Shopify Storefront API.

### What Changes

**1. Update `shopifyUtils.ts` -- Replace mock functions with real API calls**
- Add Storefront API constants (domain, token, API version 2025-07)
- Add `storefrontApiRequest()` helper for GraphQL calls
- Replace `connectToShopify()` to validate against the real store domain
- Replace `fetchShopifyProducts()` to query real products via Storefront API GraphQL
- Remove mock product generators (`generateDevelopmentStoreProducts`, `generateShopifyProductsFromRealData`)
- Map Storefront API product shape back to the app's `Product` type

**2. Update `ConnectShopifyForm.tsx` -- Simplify for real connections**
- Remove the "development mode" testing instructions since we now have a real store
- Keep the form functional for entering store URLs

**3. Add a Shopify API config file** (e.g., `src/lib/shopify.ts`)
- Centralize the Storefront API URL, token, and `storefrontApiRequest` helper
- Reusable across vendor integration and any future marketplace product display

**4. Product type mapping**
- Map Shopify Storefront API `ShopifyProduct` shape (with `node.title`, `node.priceRange`, etc.) to the existing app `Product` type used by `ProductContext`

### What Stays the Same
- `useShopifyConnection`, `useShopifySync`, `useShopifyIntegration` hooks -- same structure, just calling real functions
- `ShopifyIntegrationContent`, `SyncSettingsPanel`, `ProductCatalog` UI components
- `SyncSettings` type and markup logic
- localStorage-based connection persistence

### Before Testing
Since the store has 0 products, I'll first create 2-3 test products via the Shopify Admin API so there's real data to sync when a beta vendor connects.

### Technical Details
- Storefront API endpoint: `https://elyphant-iayjj.myshopify.com/api/2025-07/graphql.json`
- Token: `559b4f378f328ed6f2dcc32a4458486d`
- GraphQL query fetches: id, title, description, handle, priceRange, images, variants, options
- Products mapped to app's `Product` type with `productSource: 'shopify'`

