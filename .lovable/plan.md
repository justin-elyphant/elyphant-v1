

# Fix: Price Filters Not Working in Marketplace

## Root Cause

The price filter is **set in local state** (`activeFilters.priceRange`) but **never applied** to filter products. There are two disconnected paths:

1. **Desktop sidebar** (`DynamicDesktopFilterSidebar.tsx`): Sets `priceRange` as `[min, max]` array via slider → stored in `activeFilters` state → **never used to filter or sent to URL**
2. **Mobile filter pills** (`LululemonMobileFilters.tsx`): Sets `priceRange` as a string like `"0-25"` → stored in `activeFilters` state → **also never used**

On line 286 of `StreamlinedMarketplaceWrapper.tsx`:
```ts
const filteredPaginatedProducts = paginatedProducts; // No filtering at all!
```

Meanwhile, `triggerEnhancedSearch` (lines 386-396) adds `waist`, `inseam`, `size`, `brand`, `color`, `gender` to URL params but **omits price entirely**. And `useMarketplace` already supports `minPrice`/`maxPrice` URL params and passes them server-side — they're just never set by the filter UI.

## Fix (2 files)

### 1. `StreamlinedMarketplaceWrapper.tsx` — Apply client-side price filtering + propagate to URL

Replace line 286 (`const filteredPaginatedProducts = paginatedProducts;`) with a `useMemo` that filters by the `activeFilters.priceRange`:

```ts
const filteredPaginatedProducts = useMemo(() => {
  if (!activeFilters.priceRange) return paginatedProducts;

  let min = 0, max = Infinity;

  // Handle mobile string format: "0-25", "25-50", "200+"
  if (typeof activeFilters.priceRange === 'string') {
    const range = activeFilters.priceRange;
    if (range.endsWith('+')) {
      min = parseInt(range);
    } else {
      const [lo, hi] = range.split('-').map(Number);
      min = lo; max = hi;
    }
  }
  // Handle desktop slider array format: [0, 25]
  else if (Array.isArray(activeFilters.priceRange)) {
    [min, max] = activeFilters.priceRange;
    if (max >= 300) max = Infinity; // slider max = uncapped
  }

  if (min === 0 && max === Infinity) return paginatedProducts;

  return paginatedProducts.filter(p => {
    const price = parseFloat(p.price) || 0;
    return price >= min && price <= max;
  });
}, [paginatedProducts, activeFilters.priceRange]);
```

### 2. `StreamlinedMarketplaceWrapper.tsx` — Add price to `triggerEnhancedSearch` URL params

In `triggerEnhancedSearch` (around line 390), add price params so server-side filtering also applies on re-fetch:

```ts
// After the existing filter params (line 395)
if (filters.priceRange) {
  if (Array.isArray(filters.priceRange)) {
    if (filters.priceRange[0] > 0) newParams.set('minPrice', String(filters.priceRange[0]));
    if (filters.priceRange[1] < 300) newParams.set('maxPrice', String(filters.priceRange[1]));
  } else if (typeof filters.priceRange === 'string') {
    const range = filters.priceRange;
    if (range.endsWith('+')) {
      newParams.set('minPrice', range.replace('+', ''));
    } else {
      const [lo, hi] = range.split('-').map(Number);
      if (lo > 0) newParams.set('minPrice', String(lo));
      if (hi) newParams.set('maxPrice', String(hi));
    }
  }
}
```

Also add `priceRange` to the `criticalFilters` array in all three `onFilterChange` handlers (lines 822, 964, and the one at ~1147) so that selecting a price triggers a server refetch too.

### Duplicate filter logic note

The `src/components/gifting/` filter files (`useProductFilter.tsx`, `useFilteredProducts.tsx`, `usePriceFilter.tsx`, `ProductFilters.tsx`) are a **separate, older system** used by the gifting page — NOT the marketplace. They can be left alone for now. The marketplace's active filtering system is:
- `useMarketplace.ts` (URL → server)
- `StreamlinedMarketplaceWrapper.tsx` (local `activeFilters` state)
- `LululemonMobileFilters.tsx` + `DynamicDesktopFilterSidebar.tsx` (UI)

No duplicate marketplace filter logic needs cleanup — the issue is simply that price was never wired through.

