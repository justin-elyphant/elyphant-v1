

# Registry-Style Landing Pages for Wedding and Baby

## What We're Building

When a user clicks "Wedding" or "Baby" in the top navigation, instead of seeing a plain product grid, they'll land on a curated, registry-style experience with:

1. A full-width hero image with headline and CTA (bleed-first, edge-to-edge)
2. A "Shop by Collection" carousel of 4-5 sub-category tiles (lifestyle images with titles)
3. The product grid below (populated from whichever sub-category they click)

This mirrors the main landing page's curated feel but is purpose-built for life-event gifting.

## How It Works (No New Routes)

The existing flow stays intact. When a user navigates to `/marketplace?category=wedding`, the wrapper already sets `showSearchInfo = true` and renders the `CategoryLandingHeader`. We'll add a detection layer: if the category is `wedding` or `baby`, render the new `LifeEventLandingPage` component instead of the standard header + grid. When the user clicks a sub-collection tile (e.g., "Diapers"), it navigates to `/marketplace?search=baby+diapers&category=baby` -- the standard marketplace search flow with cache-first product loading.

## Visual Layout

```text
/marketplace?category=wedding
---------------------------------------------------------------
[                                                             ]
[   Full-width hero image (wedding scene, Unsplash)           ]
[   "Wedding Gift Shop"                                       ]
[   "Find the perfect gift for every wedding moment"          ]
[   [Shop All Wedding Gifts]  (CTA button)                    ]
[                                                             ]
---------------------------------------------------------------

  Shop the Collection

  [ Bride & Groom ] [ Bridal Party ] [ Registry ]  [ Decor  ] [ Honeymoon ]
  [ wedding photo  ] [ bridesmaids ] [ gifts     ]  [ table  ] [ travel    ]
    Title + desc     Title + desc    Title + desc   Title+desc  Title+desc

---------------------------------------------------------------
(Clicking a tile navigates to /marketplace?search=wedding+bridal+party&category=wedding)
(Standard product grid loads below via useMarketplace)
```

```text
/marketplace?category=baby
---------------------------------------------------------------
[                                                             ]
[   Full-width hero image (baby scene, Unsplash)              ]
[   "Baby Gift Shop"                                          ]
[   "Everything for the newest arrival"                       ]
[   [Shop All Baby Gifts]  (CTA button)                       ]
[                                                             ]
---------------------------------------------------------------

  Shop the Collection

  [ Essentials  ] [ Diapers &  ] [ Top Baby  ] [ Nursery  ] [ Clothing  ]
  [ baby photo  ] [ Wipes      ] [ Brands    ] [ Decor    ] [ & Shoes   ]
    Title + desc   Title + desc   Title+desc   Title+desc   Title+desc

---------------------------------------------------------------
(Clicking a tile navigates to /marketplace?search=baby+essentials&category=baby)
(Standard product grid loads below via useMarketplace)
```

## Sub-Collection Tile Definitions

### Baby (5 tiles)
| Tile | Search Term | Image Theme |
|------|-------------|-------------|
| Baby Essentials | baby essentials must haves | Soft nursery items |
| Diapers and Wipes | baby diapers wipes pampers huggies | Diaper packs |
| Top Baby Brands | baby products fisher price graco | Brand variety |
| Nursery Decor | baby nursery decor crib bedding | Decorated nursery |
| Baby Clothing | baby clothes onesies shoes | Tiny outfits |

### Wedding (5 tiles)
| Tile | Search Term | Image Theme |
|------|-------------|-------------|
| Bride and Groom | wedding gifts bride groom | Couple-focused |
| Bridal Party | bridesmaid groomsmen gifts | Group gifts |
| Registry Favorites | wedding registry kitchen home | Classic registry |
| Wedding Decor | wedding decorations centerpieces | Table settings |
| Honeymoon | honeymoon travel luggage couples | Travel gear |

Each tile navigates to `/marketplace?search={searchTerm}&category={wedding|baby}`, which flows through the existing `useMarketplace` -> `get-products` cache-first pipeline. Zero new API endpoints needed.

## Technical Changes

### New File: `src/components/marketplace/landing/LifeEventLandingPage.tsx`

A single component (~180 lines) that renders:

1. **Hero Section**: Uses the existing `FullBleedSection` component with an Unsplash background image, gradient overlay (matching hero-image-standards: `from-black/60 via-black/40 to-black/25`), headline, subtitle, and a CTA button that navigates to the full category search.

2. **Sub-Collection Carousel**: Reuses the exact `motion.button` + image + gradient overlay pattern from `CuratedCollectionTiles.tsx` (same aspect ratio, same animation, same text placement). Data comes from a config object defined within the component.

Props:
- `category: 'wedding' | 'baby'` -- determines which config to render

Reuses:
- `FullBleedSection` from `@/components/layout/FullBleedSection`
- `motion.button` pattern from `CuratedCollectionTiles` (same styling)
- `triggerHapticFeedback` from `@/utils/haptics`
- `useNavigate` from react-router-dom
- `CollectionTile` type from `CuratedCollectionTiles` (reuse the same interface for tile data)

No data fetching, no hooks beyond `useNavigate`. Pure presentation.

### Edit: `src/components/marketplace/StreamlinedMarketplaceWrapper.tsx`

Add a detection check before the existing header/grid rendering. When `category === 'wedding'` or `category === 'baby'` AND there is no search term active (user just landed on the category, hasn't clicked a sub-collection yet):

- Render `LifeEventLandingPage` instead of the standard `CategoryLandingHeader` + product grid
- Once the user clicks a sub-collection tile, the URL gains a `search` param, `showSearchInfo` triggers the normal product grid flow, and the landing page is no longer shown

This requires:
- Import `LifeEventLandingPage`
- Add a `isLifeEventLanding` check (~3 lines) in the `useMemo` that computes `hideHeroBanner`
- Add a conditional render (~5 lines) before the curated landing sections that shows `LifeEventLandingPage` when the category is `wedding` or `baby` but no search is active yet

Changes are minimal -- roughly 10 lines added to the wrapper.

### No Other Files Change

- `useMarketplace` -- untouched (URL-driven, already handles `category` + `search` combos)
- `get-products` edge function -- untouched (cache-first logic preserved)
- `CategoryLandingHeader` -- untouched (still used for Quick Pick and other categories)
- `CuratedCollectionTiles` -- untouched (landing page tiles stay as-is)
- Navigation links (`CategoryLinks.tsx`) -- untouched (already link to `/marketplace?category=wedding`)
- Product cards, pricing, filters -- all untouched

### Cache-First Behavior

When a user clicks a sub-collection tile like "Diapers and Wipes", the URL becomes `/marketplace?search=baby+diapers+wipes+pampers+huggies&category=baby`. This triggers `useMarketplace`, which calls `get-products` with that search term. The edge function checks the `products` table cache first via `getCachedProductsForQuery()`. If matching products exist in cache (from previous searches or the Nicole weekly curator), they're returned at zero Zinc API cost. Only on cache miss does Zinc get called, and results are cached for next time.

## Files Summary

| File | Action | Scope |
|------|--------|-------|
| `src/components/marketplace/landing/LifeEventLandingPage.tsx` | New | ~180 lines -- hero + sub-collection tiles |
| `src/components/marketplace/StreamlinedMarketplaceWrapper.tsx` | Edit | ~10 lines -- detect wedding/baby category, render landing page |

