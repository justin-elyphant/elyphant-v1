
# ShoppingPanel Search Fix Plan

## Problem Identified

The "Add Items to Wishlist" side panel uses the same `ProductCatalogService` and `get-products` edge function as the header search bar, but **the results are not being displayed** due to a bug in how `executeSearch` results are handled.

### Root Cause

In `ShoppingPanel.tsx`:

```typescript
// Line 39: Gets products from useMarketplace hook
const { executeSearch, isLoading: isSearching, products: searchResults } = useMarketplace();

// Line 99: Calls executeSearch but ignores returned results
const handleSearch = async () => {
  setHasSearched(true);
  await executeSearch(searchQuery); // Results returned here but NOT stored!
};

// Line 143: Uses searchResults which is still from URL state (empty/stale)
const displayProducts = hasSearched ? searchResults : products.slice(0, 20);
```

The `executeSearch` function returns search results as a Promise, but the ShoppingPanel doesn't capture them. Instead, it reads `products` from the hook, which only updates when URL params change.

## Solution

Store the `executeSearch` results in local state within ShoppingPanel, since it's a modal that shouldn't affect the main marketplace URL.

## Changes Summary

| File | Action | Purpose |
|------|--------|---------|
| `ShoppingPanel.tsx` | Modify | Store search results in local state |

## Technical Implementation

### ShoppingPanel.tsx Changes

**Add local state for search results (after line 43):**
```typescript
const [localSearchResults, setLocalSearchResults] = useState<Product[]>([]);
```

**Update handleSearch to capture results (line 95-100):**
```typescript
const handleSearch = async () => {
  if (!searchQuery.trim()) return;
  
  setHasSearched(true);
  const response = await executeSearch(searchQuery);
  
  // Store results in local state
  if (response && response.products) {
    setLocalSearchResults(response.products as Product[]);
  }
};
```

**Update displayProducts to use local results (line 143):**
```typescript
const displayProducts = hasSearched ? localSearchResults : products.slice(0, 20);
```

## Expected Behavior After Fix

1. User opens "Add Items" panel → Trending products shown (best-selling category)
2. User types "levis 511" and clicks Search
3. `executeSearch` calls `get-products` edge function with query
4. Results stored in `localSearchResults` state
5. Panel re-renders showing Levi's 511 jeans

## Why This Is Correct

- **Same search backend**: Uses `ProductCatalogService.searchProducts()` → `get-products` edge function (same as header search)
- **Same relevance filtering**: Brand-aware scoring (+150 for model numbers like '511')
- **Same BRAND_ALIASES**: `levis` → `levi's` normalization
- **Isolated state**: ShoppingPanel modal doesn't pollute marketplace URL params

## Impact

- **Lines changed**: ~5 lines in ShoppingPanel.tsx
- **No new components**: Just fixing existing data flow
- **No backend changes**: Edge function already works correctly (logs show 31 results cached)
