

# Fix: "development" mode blocked by URL validation

## Problem
In `src/components/marketplace/shopify/shopifyUtils.ts`, the `connectToShopify` function validates the URL format (lines 64-69) **before** checking for the "development" keyword (lines 72-84). Since "development" doesn't match `.myshopify.com`, `.com`, or `.store`, it returns an error and never reaches the dev store branch.

## Fix
Move the development store check (lines 72-84) **above** the URL format validation (lines 64-69). This way, entering "development" or "dev" bypasses URL validation entirely and returns the mock connection response.

### Single file change: `src/components/marketplace/shopify/shopifyUtils.ts`

Reorder lines 62-84 so that:
1. First: check if `storeUrl.toLowerCase() === "development" || "dev"` → return success
2. Then: validate URL format for real store URLs

No other files need changes.

