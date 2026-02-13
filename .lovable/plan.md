
## Fix Category Search Grid Fill + Friendly "Find More" Button Labels

### Problem 1: Sparse Category Results (Only 3 products for "Pets")
When clicking a category like "Pets," the system navigates with the full Zinc search string (e.g., `"best selling pet products dog cat supplies toys treats"`) as the URL `search` param. The cache may only have 2-3 matches for that exact long query, leaving the grid nearly empty -- unprofessional for an e-commerce site.

**Fix:** When the initial category search returns fewer than 24 products (the grid-aligned page size), automatically trigger a supplementary Zinc API fetch to backfill the grid. This ensures every category landing always shows a full, professional grid.

### Problem 2: Raw Query String in "Find More" Button
The button currently reads: `Find more "best selling pet products dog cat supplies toys treats" results` -- exposing the internal Zinc search string to users.

**Fix:** Detect when the current search is a category-based search (via the `category` URL param) and display a friendly label instead, e.g., **"Find more Pets gifts"** or **"Find more Electronics gifts"**.

---

### Technical Details

**Files to modify:**

1. **`src/components/marketplace/StreamlinedMarketplaceWrapper.tsx`**
   - Add a `categoryDisplayName` derived value that checks the `category` URL param and maps it to a friendly name using `getCategoryDisplayNameFromValue()`
   - Update both desktop and mobile "Find more" button labels (lines ~883 and ~1053):
     - If `categoryParam` exists: `Find more {categoryDisplayName} gifts`
     - Otherwise (freeform search): `Find more "{urlSearchTerm}" results` (current behavior)
   - Add a `useEffect` that auto-triggers `handleFindMoreResults()` when the initial load returns fewer than 24 products AND a `category` param is present AND `fromCache` is true. This ensures category landings always attempt to fill the grid.

2. **`src/utils/categoryDisplayMapper.ts`** (no change needed, already has `getCategoryDisplayNameFromValue`)

**Button label examples:**
- Pets category: "Find more Pets gifts"  
- Electronics category: "Find more Electronics gifts"
- Freeform search "nike shoes": `Find more "nike shoes" results`

**Auto-backfill logic (pseudocode):**
```text
useEffect:
  if (category param exists AND fromCache AND products.length < 24 AND not already finding more):
    auto-trigger handleFindMoreResults()
```

This ensures that sparse cache categories always attempt to pull fresh results from Zinc to fill the grid, while keeping costs low (only triggers when cache is insufficient).
