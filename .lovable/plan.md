

## Brand Landing Page Enhancement: Retailer Storefront Experience

### Context
Currently, when a user clicks a brand tile (e.g., Nike), they land on a generic search results page (`?search=nike`). There IS a `BrandHeroSection` component that renders a nice branded hero, but it only triggers via `?brandCategories=nike` -- a URL pattern the brand tiles don't actually use. Beyond the hero, the page is just a flat product grid with no editorial structure.

For your retailer partnership model, brand pages need to feel like a **curated storefront** -- similar to what Lululemon does with their category pages, or what you already built for Wedding/Baby with the `LifeEventLandingPage`.

### What Changes

**1. Route brand tile clicks to brand landing pages**
Update `PopularBrands.tsx` (both homepage and marketplace versions) to navigate to `?brandCategories=nike` instead of `?search=nike`. This activates the existing `BrandHeroSection` hero banner.

**2. Create a `BrandLandingPage` component (new file)**
A dedicated landing page component -- inspired by your `LifeEventLandingPage` pattern -- that replaces the flat grid when `brandCategories` is active and no search term is entered. It will include:

- **Full-bleed brand hero** with lifestyle imagery, brand logo, tagline, and a "Shop All [Brand]" CTA (replaces the current card-style `BrandHeroSection`)
- **"Shop the Collection" carousel** with brand-specific sub-categories (e.g., Nike: Footwear, Apparel, Accessories, Training Gear, Kids)
- **"All [Brand] Items" grid** pulling cached products from the `products` table filtered by brand name (zero Zinc API cost, same pattern as `LifeEventAllItems`)

**3. Add brand-specific sub-collection configs**
Each brand gets a config object (like `LIFE_EVENT_CONFIGS`) defining:
- Hero image (lifestyle Unsplash photo matching the brand)
- Sub-collection tiles with search terms (e.g., "nike shoes", "nike apparel")
- Brand color theming (already exists in `brandData.ts`)

**4. Update `BrandHeroSection` to full-bleed style**
Transform the current card-style hero into a full-bleed Lululemon-style hero matching the `LifeEventLandingPage` visual pattern -- large lifestyle image, gradient overlay, white text, rounded CTA button.

**5. Wire into `StreamlinedMarketplaceWrapper`**
When `brandCategories` is set and there's no active search term, render `BrandLandingPage` instead of the product grid (same conditional pattern used for life event landings).

### Visual Structure (Brand Landing Page)

```text
+--------------------------------------------------+
|  [Full-bleed hero image with gradient overlay]   |
|                                                  |
|    [Brand Logo]                                  |
|    Just Do It                                    |
|    Elevate your performance with Nike's...       |
|                                                  |
|    [ Shop All Nike Products ]  (white pill CTA)  |
+--------------------------------------------------+
|                                                  |
|  Shop the Collection                             |
|  [Footwear] [Apparel] [Accessories] [Training]   |
|  (scrollable tiles with lifestyle images)        |
|                                                  |
+--------------------------------------------------+
|                                                  |
|  All Nike Products                               |
|  [Product Grid - 24 items from products cache]   |
|                                                  |
+--------------------------------------------------+
```

### Technical Details

| File | Action |
|------|--------|
| `src/components/marketplace/landing/BrandLandingPage.tsx` | **Create** -- New component modeled after `LifeEventLandingPage` |
| `src/components/marketplace/landing/BrandAllItems.tsx` | **Create** -- Brand-filtered "All Items" grid (queries `products` table by brand) |
| `src/constants/brandData.ts` | **Edit** -- Add `heroImage` and `collections` sub-category arrays to each brand config |
| `src/components/marketplace/BrandHeroSection.tsx` | **Edit** -- Rebuild as full-bleed hero (or delegate to `BrandLandingPage`) |
| `src/components/marketplace/PopularBrands.tsx` | **Edit** -- Change navigation from `?search=` to `?brandCategories=` |
| `src/components/gifting/PopularBrands.tsx` | **Edit** -- Same navigation fix for homepage brand tiles |
| `src/components/marketplace/StreamlinedMarketplaceWrapper.tsx` | **Edit** -- Add conditional rendering for `BrandLandingPage` when `brandCategories` is active with no search |

### Design Principles Applied
- **Lululemon monochromatic aesthetic** -- White, grey, black with brand accent colors only in the hero
- **Zero Zinc API cost** -- All items grid pulls from local `products` table cache
- **Existing pattern reuse** -- Same architecture as Wedding/Baby life event pages
- **44px+ touch targets** -- All tiles and CTAs follow iOS Capacitor standards
- **Haptic feedback** -- On all interactive elements

