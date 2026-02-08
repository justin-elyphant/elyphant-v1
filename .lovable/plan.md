

# Reimagine Marketplace Landing Page

## Overview

Replace the current 16 identical horizontal category scroll rows with a curated, editorial-driven storefront. All changes are scoped to the "no search active" landing state only -- the existing search results experience remains 100% untouched.

## iOS Capacitor and Tablet Best Practices Applied Throughout

Every new component will follow the established patterns from `PopularBrands`, `SimpleRecipientSelector`, and other iOS-compliant components:

- **44px minimum touch targets** on all interactive elements (`min-h-[48px]` or `touch-target-44` class)
- **`touch-manipulation`** class on all tappable areas to eliminate 300ms tap delay
- **`triggerHapticFeedback('light')`** on all user interactions (card taps, pill clicks, category selections)
- **`framer-motion` spring animations** with `whileTap={{ scale: 0.95 }}` for tactile press feedback
- **Safe area padding** preserved via existing `pt-safe-top pb-safe` on the parent container
- **No custom gesture interception** -- trust native browser scroll handling
- **Tablet content density** -- 2-column grids on 768-1024px (tablet), single column below 768px (phone), 3-4 columns above 1024px (desktop), using Tailwind responsive breakpoints (`grid-cols-2 md:grid-cols-2 lg:grid-cols-4`)
- **`text-base` (16px minimum)** on any input elements to prevent iOS auto-zoom
- **`ios-smooth-scroll` and `touch-pan-y`** classes where horizontal scrolling occurs
- **No `overflow-hidden` on scroll containers** -- prevents iOS momentum scrolling issues
- **`overscroll-behavior: contain`** on scrollable sections to prevent parent page scroll bleed

## New Landing Page Sections (Top to Bottom)

### Section 1: MarketplaceLandingHero
Clean, minimalist text hero on white/light grey background.
- Bold headline: "Find the Perfect Gift"
- Subtitle: "Discover curated gifts for every person and occasion"
- Row of quick-access category pills using `getQuickAccessCategories()` data (Electronics, Flowers, Fashion, Beauty, Gaming, Tech)
- Each pill navigates to `/marketplace?search=...&category=...` with haptic feedback
- No search bar (nav bar handles search)
- Responsive: pills wrap into 2 rows on phone, single row on tablet/desktop
- All pills have 44px+ tap area

### Section 2: CuratedCollectionTiles (4 tiles)
Magazine-style visual tiles with lifestyle imagery.
- Tiles: "Gifts for Her", "Gifts for Him", "Under $50", "Luxury Gifts"
- Each navigates using existing URL params (`?giftsForHer=true`, `?giftsForHim=true`, etc.) -- already wired in the wrapper
- Desktop/tablet: 2x2 grid, Phone: 2-column grid (same but smaller cards)
- Full-bleed image with dark overlay and white text
- `whileTap` spring animation and haptic feedback on each tile
- Imagery: Unsplash URLs (same pattern as GiftingCategories)

### Section 3: PopularBrands (existing component)
Surface the existing `PopularBrands` component -- already iOS-compliant with haptics, spring animations, and 48px min-height touch targets. No changes needed.

### Section 4: TrendingProductsSection
One curated product carousel replacing the 16 rows.
- Title: "Trending Right Now"
- Wraps existing `CategorySection` component + `productCatalogService.searchProducts()`
- Loads "best selling" products with `limit: 8`
- "See All" navigates to full best-selling results
- Reuses exact same Zinc/cache product loading logic from `ProgressiveAirbnbStyleCategorySections`
- Horizontal scroll uses `ios-smooth-scroll` class for native momentum

### Section 5: ShopByOccasion
Occasion-driven navigation cards.
- Cards: Birthday, Anniversary, Valentine's Day, Wedding, Baby Shower, Just Because
- Each navigates to `/marketplace?search=birthday+gifts` etc.
- 3-column grid on phone, 3 columns on tablet, 6 columns on desktop
- Each card has icon + label, 44px+ tap area, haptic feedback
- `motion.div` with `whileTap={{ scale: 0.95 }}` spring animation

### Section 6: CategoryBrowseGrid
Compact icon + label grid for traditional browsing.
- Uses existing `UNIVERSAL_CATEGORIES` data and Lucide icons from `categories.ts`
- 3 columns on phone, 4 on tablet, 6 on desktop
- Clean icon + label card style (monochromatic, white cards with subtle border)
- Each navigates to `/marketplace?search=...&category=...`
- 44px+ touch targets, haptic feedback

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/marketplace/landing/MarketplaceLandingHero.tsx` | Clean text hero with category pills |
| `src/components/marketplace/landing/CuratedCollectionTiles.tsx` | 4 visual lifestyle tiles |
| `src/components/marketplace/landing/ShopByOccasion.tsx` | Occasion-based navigation cards |
| `src/components/marketplace/landing/CategoryBrowseGrid.tsx` | Compact category grid using UNIVERSAL_CATEGORIES |
| `src/components/marketplace/landing/TrendingProductsSection.tsx` | Single "Trending" carousel wrapping CategorySection + productCatalogService |

## Files to Modify

| File | Change |
|------|--------|
| `src/components/marketplace/StreamlinedMarketplaceWrapper.tsx` | Lines 562-581: Replace hero banner rendering with `MarketplaceLandingHero` for the default landing state. Lines 990-992: Replace `ProgressiveAirbnbStyleCategorySections` with the new curated landing layout (CuratedCollectionTiles, PopularBrands, TrendingProductsSection, ShopByOccasion, CategoryBrowseGrid). The existing hero banner logic for quick-pick categories (Gifts for Her/Him, brand heroes) remains untouched. |

## What Stays 100% the Same

- All search results experience (filters, sidebar, product grid, FeaturedProductHero, pagination, zero-results)
- Product cataloging: `productCatalogService`, `EnhancedCacheService`, all Zinc API logic
- Product cards: `UnifiedProductCard`, `AirbnbStyleProductCard`
- Mobile filter drawer and Lululemon-style filter UX
- Quick-pick category hero banners (when navigating to Gifts for Her/Him/Under $50/Luxury)
- Brand hero sections
- iOS Capacitor app shell (bottom nav, safe areas)
- Design system: monochromatic white/grey/black, red CTAs only
- All backend edge functions -- zero changes

## Tablet-Specific Layout Considerations

Following the established `tablet-ios-capacitor-layout-strategy` memory:
- Tablet (768-1024px) uses the mobile app shell (bottom nav, safe areas) per `useResponsiveLayout`
- Content grids expand to 2 columns on tablet for better screen utilization
- Collection tiles use `aspect-[3/2]` on tablet for more visual impact vs `aspect-[2/1]` on phone
- Typography scales with `text-lg md:text-xl lg:text-2xl` pattern for readability across devices
- No horizontal overflow issues -- all grids use responsive columns, not fixed widths

