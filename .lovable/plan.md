

# Assessment: Mock Data vs. Real Shopify Storefront API

## The Core Issue

The "development" connection flow **never contacts Shopify**. It's 100% hardcoded mock data in `generateDevelopmentStoreProducts()`. There is no API call being made — not to Shopify, not to any external service. So the question of "did we capture all the metadata Shopify sent us" doesn't apply yet — Shopify never sent us anything.

## What the mock products include vs. what a real Shopify Storefront API response provides

| Field | Mock Data | Real Shopify API |
|-------|-----------|-----------------|
| title | ✅ | ✅ `node.title` |
| price | ✅ (flat number) | ✅ `priceRange.minVariantPrice.amount` + `currencyCode` |
| description | ✅ (1 sentence) | ✅ `description` + `descriptionHtml` |
| images | ✅ (1 Unsplash URL) | ✅ `images.edges[].node.url` + `altText` + `width`/`height` — often 5-10 images |
| variants | ✅ (flat string array like `["Small","Medium"]`) | ✅ Structured: `variants.edges[].node` with `title`, `sku`, `price`, `availableForSale`, `selectedOptions[{name, value}]` |
| category / productType | ✅ (generic "Test Category") | ✅ `productType` + `collections` |
| vendor / brand | ✅ "Shopify" | ✅ `vendor` (actual brand name) |
| tags | ❌ missing | ✅ `tags[]` — array of strings |
| handle / SEO slug | ❌ missing | ✅ `handle` |
| availableForSale | ❌ missing | ✅ boolean |
| compareAtPrice | ❌ missing | ✅ `compareAtPriceRange` (original/sale pricing) |
| createdAt / updatedAt | ❌ missing | ✅ timestamps |
| metafields | ❌ missing | ✅ custom key-value pairs |
| SKU per variant | ❌ missing | ✅ `variants.edges[].node.sku` |
| inventory / quantity | ❌ missing | ✅ `quantityAvailable` (with scope) |
| weight / dimensions | ❌ missing | ✅ `weight`, `weightUnit` |

## What needs to happen

Update the mock development products to mirror the **actual shape** of a Shopify Storefront API `products` query response, mapped into your `Product` type. This means:

### File: `src/components/marketplace/shopify/shopifyUtils.ts`

**`generateDevelopmentStoreProducts()`** — rewrite the 5 mock products to include:

1. **Structured variants** using `variant_specifics` and `all_variants` (your Product type already supports these) instead of flat string arrays
2. **Multiple images** in the `images[]` array (2-3 per product)
3. **Tags** array (e.g. `["gift", "bestseller", "eco-friendly"]`)
4. **Brand** field populated (not just vendor)
5. **`productSource: 'shopify'`** flag set on each product
6. **Realistic category names** matching the images
7. **`feature_bullets`** array with 3-4 bullet points per product
8. **Stars/rating and review count** to simulate what a storefront would surface
9. **Realistic titles and descriptions** matching the Unsplash images already in use

This won't change any API logic — it just makes the mock data structurally faithful to what a real Shopify integration would produce, so you can trust that the UI handles all fields correctly when you wire up the real API later.

