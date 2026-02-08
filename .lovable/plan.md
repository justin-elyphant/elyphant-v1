
# Fix Broken Diapers & Wipes Image

## Problem

The "Diapers & Wipes" tile on the Baby landing page shows a broken image (alt text visible instead of photo). The Unsplash photo ID `photo-1584839404054-c29ddb387edf` is returning a 404.

## Fix

Replace the broken image URL on line 113 of `LifeEventLandingPage.tsx` with a working Unsplash photo that fits the "diapers and baby care" theme.

Replacement image: A soft, well-lit photo of baby care products/supplies — something like folded baby towels, baby bath items, or neatly arranged baby care essentials that visually communicates "stock up on the basics."

## Click Behavior (Already Working)

Each tile already triggers a search when clicked via the `handleTileClick` function. The navigation pattern is:

```
/marketplace?search={searchTerm}&category={category}
```

This flows through `useMarketplace` -> `get-products` edge function with cache-first lookup. No changes needed here.

## File Changed

| File | Action | Scope |
|------|--------|-------|
| `src/components/marketplace/landing/LifeEventLandingPage.tsx` | Edit | Replace 1 broken Unsplash URL (line 113) |
