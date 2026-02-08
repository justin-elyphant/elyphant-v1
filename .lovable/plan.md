

# Fix Sub-Collection Titles and Search Relevance for Baby and Wedding

## Problems

1. **Wrong page title**: When clicking any sub-collection tile (e.g., "Diapers & Wipes"), the results page shows the parent category name ("Baby" or "Wedding") instead of the tile's title. This happens because the header logic in `StreamlinedMarketplaceWrapper.tsx` (line 657-669) reads the `category` URL param and uses its display name, ignoring the specific sub-collection.

2. **Poor product relevance**: Search terms like `"baby diapers wipes pampers huggies"` mix generic terms with brand names, producing weak Zinc API matches and confusing the relevance filter.

## Solution

### Part 1: Pass tile title via URL parameter

Add a `title` URL parameter when navigating from tile clicks so the header can display the correct sub-collection name.

**File: `src/components/marketplace/landing/LifeEventLandingPage.tsx`**

- Update `handleTileClick` to append `&title={collection.title}` to the URL
- Update `handleCtaClick` to append `&title={ctaLabel text}` to the URL

Example resulting URL:
```
/marketplace?search=diapers+and+wipes&category=baby&title=Diapers+%26+Wipes
```

### Part 2: Read title param in header logic

**File: `src/components/marketplace/StreamlinedMarketplaceWrapper.tsx`**

- In the header block (around line 657), check for a `title` URL param first
- When present, use it as `headerTitle` instead of the category display name
- Update subtitle to say "Browse [title]" and breadcrumbs to show the tile title as the current page with the parent category as a clickable ancestor

Example breadcrumb: **Marketplace > Baby > Diapers & Wipes**

### Part 3: Simplify search terms for better product matches

**File: `src/components/marketplace/landing/LifeEventLandingPage.tsx`**

Clean up all search terms across both Wedding and Baby configs:

**Baby tiles:**

| Tile | Current Search Term | New Search Term |
|------|-------------------|-----------------|
| All Items | baby gifts | baby gifts |
| Baby Essentials | baby essentials must haves | baby essentials |
| Diapers & Wipes | baby diapers wipes pampers huggies | diapers and wipes |
| Top Baby Brands | baby products fisher price graco | top baby products |
| Nursery Decor | baby nursery decor crib bedding | nursery decor |
| Baby Clothing | baby clothes onesies shoes | baby clothing |

**Wedding tiles:**

| Tile | Current Search Term | New Search Term |
|------|-------------------|-----------------|
| All Items | wedding gifts | wedding gifts |
| Bride & Groom | wedding gifts bride groom | wedding gifts for couple |
| Bridal Party | bridesmaid groomsmen gifts | bridal party gifts |
| Registry Favorites | wedding registry kitchen home | wedding registry gifts |
| Wedding Decor | wedding decorations centerpieces | wedding decorations |
| Honeymoon | honeymoon travel luggage couples | honeymoon essentials |

## Files Changed

| File | Changes |
|------|---------|
| `src/components/marketplace/landing/LifeEventLandingPage.tsx` | Add `title` param to navigation URLs; simplify all 12 search terms |
| `src/components/marketplace/StreamlinedMarketplaceWrapper.tsx` | Read `title` URL param in header logic; update breadcrumbs to show parent category link |

## What stays the same

- No backend or edge function changes
- No new files or components
- Hero section, images, and carousel layout unchanged
- Click-to-search flow unchanged (just cleaner search terms)
