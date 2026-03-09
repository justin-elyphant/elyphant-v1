

# Fix: Missing images on mock Shopify development products

## Problem
The 5 mock products in `generateDevelopmentStoreProducts()` use a Shopify CDN placeholder URL (`https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png`) that returns a broken/404 response, so images fail to load and show the grey fallback.

## Fix
In `src/components/marketplace/shopify/shopifyUtils.ts`, replace the broken Shopify CDN URLs with working Unsplash product images — one unique image per mock product so they look distinct and realistic.

### Single file change: `src/components/marketplace/shopify/shopifyUtils.ts`
- Lines 162, 176, 190, 204, 218: Replace each `image` value with a different Unsplash photo URL (e.g., product/lifestyle images)
- Also add an `images` array to each mock product so the `ProductImage` component can find them

