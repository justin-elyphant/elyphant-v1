

# Make the Marketplace Landing Product-Forward

## The Ask

Right now the landing page is mostly navigation tiles and links -- it tells users *where* to go but doesn't show them *what* to buy. The Lululemon reference is clear: surface real products with images, titles, and prices so the page itself is a product discovery experience.

## Changes Overview

Two changes, both to existing files:

### 1. Remove Hero Category Pills (MarketplaceLandingHero)

Strip the category pills from the hero, leaving only the clean headline and subtitle. This eliminates the redundancy with Browse All Categories and lets the curated collection tiles be the first actionable element below the hero.

### 2. Add Multiple Themed Product Rows (TrendingProductsSection)

Transform the single "Trending Right Now" section into **3 product discovery rows**, each loading real products from the Zinc/cache pipeline with different search queries. This is the Lululemon pattern -- clean horizontal product carousels with actual product images, titles, and prices.

The three rows:
- **"Trending Right Now"** -- best selling/popular products (already exists)
- **"New Arrivals"** -- fresh finds and new products
- **"Top Rated"** -- highest rated products with best reviews

Each row reuses the existing `CategorySection` component (which already renders `UnifiedProductCard` with image, title, price, rating, and add-to-cart) and loads products via `productCatalogService.searchProducts()` -- the same Zinc-powered pipeline used everywhere else.

The product cards already display in the Lululemon-inspired style: clean image, title + price on one line, star rating, share/cart buttons. No changes to the card itself.

## Revised Page Flow

```text
+----------------------------------------------------------+
|  [Nav Bar with Search]                                    |
+----------------------------------------------------------+
|                                                           |
|           Find the Perfect Gift                           |
|    Discover curated gifts for every person and occasion   |
|                                                           |
+----------------------------------------------------------+
|  Shop by Collection                                       |
|  [Gifts for Her] [Gifts for Him] [Under $50] [Luxury]    |
+----------------------------------------------------------+
|  Popular Brands                                           |
|  [Apple] [Samsung] [Nike] [Adidas] [Sony] [Lego]         |
+----------------------------------------------------------+
|  Trending Right Now                    [See All ->]       |
|  [Product+Price] [Product+Price] [Product+Price] >>>      |
+----------------------------------------------------------+
|  New Arrivals                          [See All ->]       |
|  [Product+Price] [Product+Price] [Product+Price] >>>      |
+----------------------------------------------------------+
|  Top Rated                             [See All ->]       |
|  [Product+Price] [Product+Price] [Product+Price] >>>      |
+----------------------------------------------------------+
|  Shop by Occasion                                         |
|  [Birthday] [Anniversary] [Wedding] [Baby] [Holiday]     |
+----------------------------------------------------------+
|  Browse All Categories                                    |
|  [Electronics] [Fashion] [Beauty] [Home] ...              |
+----------------------------------------------------------+
```

Each product row shows real product cards with images, titles, prices, ratings, and cart buttons -- exactly like the Lululemon screenshot but horizontally scrollable.

## Technical Details

### File: `src/components/marketplace/landing/MarketplaceLandingHero.tsx`
- Remove `getQuickAccessCategories` import and the entire category pills `div`
- Keep only the `h1` headline and `p` subtitle
- Remove unused `useNavigate`, `triggerHapticFeedback`, and `motion` imports

### File: `src/components/marketplace/landing/TrendingProductsSection.tsx`
- Add two more product rows alongside the existing "Trending Right Now":
  - **"New Arrivals"** using search query: `"new arrivals latest products fresh finds"`
  - **"Top Rated"** using search query: `"top rated best reviewed highest rated"`
- Each row uses `productCatalogService.searchProducts()` with `limit: 8` (same Zinc/cache pipeline)
- Each row renders via the existing `CategorySection` component (same product cards with pricing)
- Progressive loading: "Trending" loads immediately, the other two load after a short delay to avoid API contention
- "See All" buttons navigate to appropriate search results
- All product data flows through the existing Zinc pricing pipeline (no price format changes)
- Horizontal scroll containers use `ios-smooth-scroll` class for native iOS momentum

### No other files change
- `StreamlinedMarketplaceWrapper.tsx` already renders `TrendingProductsSection` in the right spot
- Product cards (`AirbnbStyleProductCard`) already show image, title, price, rating
- `CategorySection` already handles the horizontal carousel layout
- All Zinc cataloging, caching, and pricing logic stays untouched
